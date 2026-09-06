"use client";

import { useMemo, useState } from "react";
import { Search, Globe, Monitor, Smartphone } from "lucide-react";
import { cn, formatDateTimeID } from "@/lib/utils";
import type { AdminUserRow, LoginLogRow } from "@/lib/db-types";
import Pagination from "@/components/ui/Pagination";

interface Props {
  logs: LoginLogRow[];
  users: AdminUserRow[];
}

/** Perkiraan jenis perangkat dari user-agent (FR-17: lihat device). */
function deviceLabel(ua: string | null): { label: string; icon: typeof Monitor } {
  const s = (ua ?? "").toLowerCase();
  if (/iphone|ipad|android|mobile/i.test(s))
    return { label: "Seluler", icon: Smartphone };
  return { label: "Desktop", icon: Monitor };
}

/**
 * Panel admin: riwayat login (FR-17) — email, waktu, IP, dan perangkat.
 * Read-only; data ditulis saat login.
 */
export default function AdminLoginLogs({ logs, users }: Props) {
  const [userId, setUserId] = useState<string>("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  // User list yang masih ada untuk filter pill (paling banyak 8).
  const recentUsers = useMemo(() => {
    const byLog = new Map<string, number>();
    logs.forEach((l) => byLog.set(l.user_id, (byLog.get(l.user_id) ?? 0) + 1));
    return [...byLog.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [logs]);

  const userById = useMemo(
    () => new Map(users.map((u) => [u.id, u])),
    [users]
  );

  const visible = useMemo(() => {
    const query = q.trim().toLowerCase();
    return logs.filter((l) => {
      if (userId !== "all" && l.user_id !== userId) return false;
      if (!query) return true;
      return (l.email ?? "").toLowerCase().includes(query);
    });
  }, [logs, userId, q]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = visible.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="container-page py-8">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
          Riwayat Login
        </h1>
        <p className="mt-0.5 text-sm text-ink-muted">
          Aktivitas masuk terakhir semua akun — email, waktu, alamat IP, dan
          perangkat.
        </p>
      </div>

      {/* Search */}
      <div className="relative mt-6 max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input
          type="text"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          placeholder="Cari email..."
          className="input-field pl-10"
        />
      </div>

      {/* Filter per user */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => { setUserId("all"); setPage(1); }}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
            userId === "all"
              ? "bg-brand-600 text-white shadow-soft"
              : "border border-slate-200 bg-white text-ink-muted hover:border-brand-200 hover:text-brand-700"
          )}
        >
          Semua
        </button>
        {recentUsers.map(([id, count]) => {
          const u = userById.get(id);
          return (
            <button
              key={id}
              onClick={() => { setUserId(id); setPage(1); }}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
                userId === id
                  ? "bg-brand-600 text-white shadow-soft"
                  : "border border-slate-200 bg-white text-ink-muted hover:border-brand-200 hover:text-brand-700"
              )}
            >
              {u?.email ?? "Pengguna"}
              <span
                className={cn(
                  "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]",
                  userId === id ? "bg-white/20" : "bg-slate-100"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 shadow-soft">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-ink-faint">
              <Globe className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-base font-bold text-ink">
              Belum ada riwayat login
            </h3>
            <p className="mt-1 max-w-xs text-sm text-ink-muted">
              Baris login akan tampil saat pengguna masuk ke SIPMA.
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-5 py-3 font-semibold">Akun</th>
                <th className="px-5 py-3 font-semibold">Waktu</th>
                <th className="px-5 py-3 font-semibold">Perangkat</th>
                <th className="px-5 py-3 font-semibold">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageRows.map((l) => {
                const dev = deviceLabel(l.user_agent);
                return (
                  <tr key={l.id} className="transition-colors hover:bg-brand-50/40">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-ink">{l.email ?? "-"}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-ink-muted">
                      {formatDateTimeID(l.created_at)}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-ink-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <dev.icon className="h-3.5 w-3.5 text-ink-faint" />
                        {dev.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs text-ink-soft">
                        {l.ip_address || "-"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {visible.length > PAGE_SIZE && (
        <Pagination
          page={safePage}
          pageCount={pageCount}
          onChange={setPage}
        />
      )}
    </div>
  );
}