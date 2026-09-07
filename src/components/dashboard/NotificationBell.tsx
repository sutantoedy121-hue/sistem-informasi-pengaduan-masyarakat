"use client";

import { useState, useEffect, useRef, useId } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check, Loader2 } from "lucide-react";
import { cn, formatRelativeTimeID } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { NotificationRow, UserRole } from "@/lib/db-types";

/**
 * Lonceng notifikasi real-time untuk dashboard masyarakat (FR-06A).
 * - Badge = jumlah belum dibaca.
 * - Dropdown 5 terbaru; klik item → tandai dibaca + pindah.
 * - Subscribe Supabase Realtime: INSERT baru langsung masuk tanpa refresh.
 *   Subscriber aktif hanya saat header dipakai (client), benar utk panel warga.
 */
export default function NotificationBell() {
  const router = useRouter();
  const channelId = useId(); // unik per instance, hindari bentrok channel saat beda mount
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [marking, setMarking] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>("masyarakat");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Base path panel sesuai role → arah link notifikasi yang benar (juga
  // dipakai bell di Navbar publik untuk semua role yang login).
  const basePath = userRole === "masyarakat"
    ? "/masyarakat"
    : userRole === "petugas"
      ? "/petugas"
      : userRole === "pimpinan"
        ? "/pimpinan"
        : "/admin";
  // Admin punya panel tapi tanpa rute aduan/notifikasi; item aduan arahkan ke
  // dashboard panel. Hanya masyarakat yang punya halaman "semua notifikasi".
  const notifListHref =
    userRole === "masyarakat" ? `${basePath}/notifikasi` : basePath;

  // Muat awal + tandai dibaca saat dropdown dibuka? Muat sekali di mount.
  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    async function load() {
      // Role dari user_metadata (di-set saat signup/update). Tanpa query profil
      // tambahan — cukup untuk menentukan arah link "Lihat semua".
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.user_metadata?.role) {
        setUserRole(user.user_metadata.role as UserRole);
      }

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (!mounted) return;
      setItems(data ?? []);
      setUnread((data ?? []).filter((n) => !n.is_read).length);
    }
    load();

    // Realtime: terima INSERT notifikasi baru milik user ini.
    // Nama channel harus unik per instance — header desktop + mobile dua mount,
    // nama sama → error "cannot add postgres_changes callbacks after subscribe()".
    const channelName = "notif-bell-" + channelId.replace(/[^a-zA-Z0-9_-]/g, "");
    const channel = supabase.channel(channelName);
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications" },
      (payload) => {
        if (!mounted) return;
        const row = payload.new as NotificationRow;
        setItems((prev) => [row, ...prev].slice(0, 10));
        if (!row.is_read) setUnread((u) => u + 1);
      }
    );
    channel.subscribe((status) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        // Realtime mungkin off di Supabase — UI tetap jalan, hanya tanpa push.
      }
    });

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Tutup dropdown saat klik di luar.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function handleMarkAll() {
    if (marking || unread === 0) return;
    setMarking(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
    }
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
    setMarking(false);
    setOpen(false);
    router.refresh();
  }

  async function handleItemClick(n: NotificationRow) {
    setOpen(false);
    if (n.is_read) return;
    // Optimistic update
    setItems((prev) =>
      prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item))
    );
    setUnread((u) => Math.max(0, u - 1));
    // Persist ke DB
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", n.id);
  }

  function renderDropdown() {
    return (
      <div className="flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-bold text-ink">Notifikasi</p>
          <button
            onClick={handleMarkAll}
            disabled={marking || unread === 0}
            className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-40"
          >
            {marking ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            Tandai dibaca
          </button>
        </div>

        {/* List — hanya bagian ini yang scroll */}
        <div className="overflow-y-auto overscroll-contain">
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-ink-muted">
              Belum ada notifikasi.
            </p>
          ) : (
            items.map((n) => (
              <Link
                key={n.id}
                href={
                  n.complaint_id && userRole !== "admin"
                    ? `${basePath}/aduan/${n.complaint_id}`
                    : basePath
                }
                onClick={() => handleItemClick(n)}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50",
                  !n.is_read && "bg-brand-50/50"
                )}
              >
                <span
                  className={cn(
                    "mt-[7px] h-2 w-2 shrink-0 rounded-full",
                    n.is_read ? "bg-slate-200" : "bg-brand-500"
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block text-sm leading-snug",
                      n.is_read
                        ? "font-medium text-ink-soft"
                        : "font-semibold text-ink"
                    )}
                  >
                    {n.title}
                  </span>
                  {n.body && (
                    <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-ink-muted">
                      {n.body}
                    </span>
                  )}
                  <span className="mt-1 block text-[11px] text-ink-faint">
                    {formatRelativeTimeID(n.created_at)}
                  </span>
                </span>
              </Link>
            ))
          )}
        </div>

        {/* Footer */}
        <Link
          href={notifListHref}
          onClick={() => setOpen(false)}
          className="block shrink-0 border-t border-slate-100 px-4 py-3 text-center text-xs font-semibold text-brand-600 hover:bg-slate-50"
        >
          Lihat semua notifikasi
        </Link>
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className="relative">
      {/* Tombol bel */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifikasi"
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
          open
            ? "border-brand-300 bg-brand-50 text-brand-700"
            : "border-slate-200 text-ink-muted hover:border-slate-300 hover:text-ink"
        )}
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white">
            {unread}
          </span>
        )}
      </button>

      {/* Dropdown — mobile: modal center layar; lg+: dropdown di kanan bel */}
      {open && (
        <>
          {/* Mobile: bottom sheet */}
          <div
            className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/40 lg:hidden"
            onClick={() => setOpen(false)}
          >
            <div
              className="w-full overflow-hidden rounded-t-2xl border-t border-slate-200 bg-white shadow-2xl flex flex-col max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag handle */}
              <div className="flex justify-center py-2 shrink-0">
                <div className="h-1 w-10 rounded-full bg-slate-200" />
              </div>
              {renderDropdown()}
            </div>
          </div>

          {/* Desktop: dropdown di kanan bel */}
          <div className="absolute right-0 top-11 z-50 hidden w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl lg:block">
            {renderDropdown()}
          </div>
        </>
      )}
    </div>
  );
}