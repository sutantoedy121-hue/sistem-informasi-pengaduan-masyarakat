import Link from "next/link";
import {
  Inbox,
  Clock3,
  CheckCircle2,
  Star,
  ChevronRight,
  Bell,
  ArrowUpRight,
  Plus,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { getPhotoUrl } from "@/lib/storage";
import { formatRelativeTimeID, cn } from "@/lib/utils";
import type { ComplaintWithCategory } from "@/lib/db-types";
import StatusBadge from "@/components/ui/StatusBadge";

type StatTile = {
  label: string;
  value: number;
  icon: typeof Inbox;
  iconClass: string;
};

export default async function DashboardOverview({
  complaints,
}: {
  complaints: ComplaintWithCategory[];
}) {
  const all = complaints;
  const inProgress = all.filter((c) =>
    ["diajukan", "diterima", "diproses"].includes(c.status)
  );
  const done = all.filter((c) => c.status === "selesai");
  const rated = done.filter((c) => c.rating != null);
  const latest = all.slice(0, 3);

  const tiles: StatTile[] = [
    {
      label: "Total Aduan",
      value: all.length,
      icon: Inbox,
      iconClass: "bg-brand-50 text-brand-700",
    },
    {
      label: "Sedang Diproses",
      value: inProgress.length,
      icon: Clock3,
      iconClass: "bg-amber-50 text-amber-700",
    },
    {
      label: "Selesai",
      value: done.length,
      icon: CheckCircle2,
      iconClass: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Sudah Dinilai",
      value: rated.length,
      icon: Star,
      iconClass: "bg-violet-50 text-violet-700",
    },
  ];

  return (
    <div className="container-page py-8">
      {/* Ringkasan tile — mobile: scroll horizontal agar tiap tile lega; lg: 4 kolom */}
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-4 lg:gap-4 lg:overflow-visible lg:pb-0">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="card w-[46vw] min-w-[160px] max-w-[210px] shrink-0 snap-start p-4 sm:p-5 lg:w-auto lg:min-w-0 lg:max-w-none"
          >
            <div className="flex items-center justify-between">
              <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", t.iconClass)}>
                <t.icon className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-4 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              {t.value}
            </p>
            <p className="mt-0.5 text-xs font-medium text-ink-muted sm:text-sm">
              {t.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Aduan terbaru */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
              <Inbox className="h-4 w-4 text-brand-600" />
              Aduan Terbaru
            </h2>
            {all.length > 3 && (
              <Link
                href="/masyarakat/aduan"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                Lihat semua
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {latest.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <Inbox className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-base font-bold text-ink">
                Belum ada aduan
              </h3>
              <p className="mt-1 max-w-xs text-sm text-ink-muted">
                Mulai sampaikan permasalahan di lingkunganmu dan pantau progresnya di sini.
              </p>
              <Link href="/masyarakat/baru" className="btn-primary mt-5 !py-2.5 text-sm">
                <Plus className="h-4 w-4" />
                Buat Aduan Pertama
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {latest.map((c) => {
                const thumb = getPhotoUrl(c.photo_url);
                return (
                  <li key={c.id}>
                    <Link
                      href={`/masyarakat/aduan/${c.id}`}
                      className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-brand-50/40"
                    >
                      {thumb ? (
                        <img
                          src={thumb}
                          alt=""
                          className="h-11 w-11 shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
                        />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-ink-faint">
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink group-hover:text-brand-700">
                          {c.title}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] text-ink-faint">
                          {c.ticket} · {formatRelativeTimeID(c.created_at)}
                        </p>
                      </div>
                      <StatusBadge status={c.status} className="shrink-0" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Kolom kanan */}
        <div className="space-y-6">
          {/* Aksi cepat */}
          <div className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
              <Plus className="h-4 w-4 text-brand-600" />
              Aksi Cepat
            </h2>
            <div className="mt-4 space-y-2.5">
              <Link
                href="/masyarakat/baru"
                className="btn-primary w-full justify-start text-sm"
              >
                <Plus className="h-4 w-4" />
                Buat Aduan Baru
              </Link>
              <Link
                href="/masyarakat/aduan"
                className="btn-secondary w-full justify-start text-sm"
              >
                <Inbox className="h-4 w-4" />
                Riwayat Aduan Saya
              </Link>
              <Link
                href="/#lacak"
                className="btn-ghost w-full justify-start text-sm"
              >
                <ArrowUpRight className="h-4 w-4" />
                Lacak Lewat Tiket (Publik)
              </Link>
            </div>
          </div>

          {/* Tips */}
          <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
              <Bell className="h-4 w-4 text-brand-600" />
              Cara aduan diproses
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Setiap perubahan status dikirimkan sebagai notifikasi. Pastikan
              aduanmu memuat foto & lokasi yang jelas agar verifikasi lebih cepat.
            </p>
            <div className="mt-3 grid grid-cols-4 gap-1.5 text-center text-[10px] font-medium">
              {["Diajukan", "Diverifikasi", "Diproses", "Selesai"].map((s, i) => (
                <div key={s} className="flex flex-col items-center gap-1">
                  <div className="h-1.5 w-full rounded-full bg-brand-600/80" />
                  <span className="text-ink-muted">{s}</span>
                  {i < 3 && null}
                </div>
              ))}
            </div>
          </div>

          {/* Status ditolak */}
          {all.some((c) => c.status === "ditolak") && (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5">
              <h3 className="flex items-center gap-2 text-sm font-bold text-rose-700">
                <XCircle className="h-4 w-4" />
                Perlu perhatian
              </h3>
              <p className="mt-1.5 text-sm text-rose-800">
                Ada aduan yang ditolak. Klik detail untuk melihat alasan dan
                coba ajukan ulang dengan data yang lebih lengkap.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
