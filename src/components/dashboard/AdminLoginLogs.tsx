"use client";

import { useMemo, useState, useTransition } from "react";
import { Search, Globe, Monitor, Smartphone, ShieldBan, ShieldCheck, AlertCircle, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { cn, formatDateTimeID } from "@/lib/utils";
import type { AdminUserRow, LoginLogRow, BlockedIp } from "@/lib/db-types";
import Pagination from "@/components/ui/Pagination";
import { blockIpAction, unblockIpAction } from "@/app/admin/actions";

interface Props {
  logs: LoginLogRow[];
  users: AdminUserRow[];
  blockedIps?: BlockedIp[];
}

/** Perkiraan jenis perangkat dari user-agent (FR-17: lihat device). */
function deviceLabel(ua: string | null): { label: string; icon: typeof Monitor } {
  const s = (ua ?? "").toLowerCase();
  if (/iphone|ipad|android|mobile/i.test(s))
    return { label: "Seluler", icon: Smartphone };
  return { label: "Desktop", icon: Monitor };
}

/**
 * Panel admin: riwayat login & kontrol keamanan (FR-17) — email, waktu, IP,
 * perangkat, serta fitur blokir IP mencurigakan.
 */
export default function AdminLoginLogs({ logs, users, blockedIps = [] }: Props) {
  const [activeTab, setActiveTab] = useState<"logs" | "blocked">("logs");
  const [userId, setUserId] = useState<string>("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const PAGE_SIZE = 10;

  const blockedIpSet = useMemo(
    () => new Set(blockedIps.map((b) => b.ip_address)),
    [blockedIps]
  );

  function handleBlockIp(ip: string) {
    if (!ip || ip === "-" || ip === "127.0.0.1") {
      setError("Alamat IP tidak valid untuk diblokir.");
      return;
    }
    const reason = window.prompt(`Alasan pemblokiran IP ${ip}:`, "Aktivitas mencurigakan / Spam login");
    if (!reason) return;

    startTransition(async () => {
      setError(null);
      const res = await blockIpAction(ip, reason);
      if (res?.error) setError(res.error);
      else setSuccess(res?.success || "IP berhasil diblokir.");
    });
  }

  function handleUnblockIp(id: string) {
    startTransition(async () => {
      setError(null);
      const res = await unblockIpAction(id);
      if (res?.error) setError(res.error);
      else setSuccess(res?.success || "Blokir IP dibuka.");
    });
  }

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
      // Output hasil pencarian hanya aktif jika mengetik minimal 3 huruf
      if (query.length < 3) return true;
      return (
        (l.email ?? "").toLowerCase().includes(query) ||
        (l.ip_address ?? "").toLowerCase().includes(query)
      );
    });
  }, [logs, userId, q]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = visible.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="container-page py-8">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
          Keamanan & Riwayat Login
        </h1>
        <p className="mt-0.5 text-sm text-ink-muted">
          Aktivitas masuk akun, alamat IP perangkat, dan daftar IP yang diblokir (FR-17).
        </p>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      {/* Tab Switcher: Riwayat Login vs IP Diblokir */}
      <div className="mt-6 flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => { setActiveTab("logs"); setPage(1); }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
            activeTab === "logs"
              ? "bg-brand-600 text-white shadow-soft"
              : "text-ink-muted hover:bg-slate-100 hover:text-ink"
          }`}
        >
          <Monitor className="h-4 w-4" />
          Riwayat Login ({logs.length})
        </button>
        <button
          onClick={() => { setActiveTab("blocked"); setPage(1); }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
            activeTab === "blocked"
              ? "bg-rose-600 text-white shadow-soft"
              : "text-ink-muted hover:bg-slate-100 hover:text-ink"
          }`}
        >
          <ShieldBan className="h-4 w-4" />
          Daftar IP Diblokir ({blockedIps.length})
        </button>
      </div>

      {activeTab === "logs" ? (
        <>
          {/* Search */}
          <div className="relative mt-6 max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Cari email / IP address (min. 3 huruf)..."
              className="input-field pl-10"
            />
          </div>

          {/* Filter per user */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => { setUserId("all"); setPage(1); }}
              className={cn(
                "rounded-full px-3.5 py-1 text-xs font-semibold transition-colors",
                userId === "all"
                  ? "bg-brand-600 text-white shadow-soft"
                  : "border border-slate-200 bg-white text-ink-muted hover:border-brand-200 hover:text-brand-700"
              )}
            >
              Semua akun
            </button>
            {recentUsers.map(([id, count]) => {
              const u = userById.get(id);
              const label = u?.fullName || u?.email || "Akun";
              const isSelected = userId === id;
              return (
                <button
                  key={id}
                  onClick={() => { setUserId(id); setPage(1); }}
                  className={cn(
                    "rounded-full px-3.5 py-1 text-xs font-semibold transition-colors",
                    isSelected
                      ? "bg-brand-600 text-white shadow-soft"
                      : "border border-slate-200 bg-white text-ink-muted hover:border-brand-200 hover:text-brand-700"
                  )}
                >
                  <span className="max-w-[140px] truncate">{label}</span>
                  <span
                    className={cn(
                      "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]",
                      isSelected ? "bg-white/20" : "bg-slate-100"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* List tabel login */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
            {visible.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-16 text-center">
                <Globe className="h-10 w-10 text-ink-faint" />
                <h3 className="mt-4 text-base font-bold text-ink">Tidak ada catatan</h3>
              </div>
            ) : (
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-ink-faint bg-slate-50/70">
                    <th className="px-5 py-3 font-semibold">Akun</th>
                    <th className="px-5 py-3 font-semibold">Waktu</th>
                    <th className="px-5 py-3 font-semibold">Perangkat</th>
                    <th className="px-5 py-3 font-semibold">IP Address</th>
                    <th className="px-5 py-3 font-semibold text-right">Aksi Keamanan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pageRows.map((l) => {
                    const dev = deviceLabel(l.user_agent);
                    const isBlocked = l.ip_address ? blockedIpSet.has(l.ip_address) : false;
                    return (
                      <tr key={l.id} className="transition-colors hover:bg-slate-50/60">
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
                          <span className="font-mono text-xs font-semibold text-ink-soft">
                            {l.ip_address || "-"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {l.ip_address && l.ip_address !== "-" && (
                            isBlocked ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-600 ring-1 ring-rose-200">
                                <ShieldBan className="h-3 w-3" />
                                Diblokir
                              </span>
                            ) : (
                              <button
                                onClick={() => handleBlockIp(l.ip_address!)}
                                disabled={pending}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-50"
                              >
                                <ShieldBan className="h-3.5 w-3.5" />
                                Blokir IP
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          {visible.length > PAGE_SIZE && (
            <Pagination page={safePage} pageCount={pageCount} onChange={setPage} />
          )}
        </>
      ) : (
        /* Tabel IP yang Diblokir */
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
          {blockedIps.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <ShieldCheck className="h-10 w-10 text-emerald-500" />
              <h3 className="mt-4 text-base font-bold text-ink">Tidak ada IP yang diblokir</h3>
              <p className="mt-1 text-xs text-ink-muted">Semua lalu lintas jaringan saat ini diizinkan.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wider text-ink-muted">
                <tr>
                  <th className="px-5 py-3.5">Alamat IP</th>
                  <th className="px-5 py-3.5">Alasan Pemblokiran</th>
                  <th className="px-5 py-3.5">Waktu Blokir</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {blockedIps.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-4 font-mono font-bold text-rose-600">{b.ip_address}</td>
                    <td className="px-5 py-4 text-xs text-ink-muted">{b.reason || "Tidak ada keterangan"}</td>
                    <td className="px-5 py-4 text-xs text-ink-muted">{formatDateTimeID(b.created_at)}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleUnblockIp(b.id)}
                        disabled={pending}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-emerald-700"
                      >
                        Buka Blokir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}