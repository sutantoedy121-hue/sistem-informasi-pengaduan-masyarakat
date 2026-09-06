import Link from "next/link";
import {
  Inbox,
  ClipboardCheck,
  Wrench,
  CheckCircle2,
  XCircle,
  Percent,
  ChevronRight,
  User,
} from "lucide-react";
import { getPhotoUrl } from "@/lib/storage";
import { formatRelativeTimeID, cn } from "@/lib/utils";
import type { ComplaintStaffListItem } from "@/lib/db-types";
import StatusBadge from "@/components/ui/StatusBadge";
import PimpinanCharts from "@/components/dashboard/PimpinanCharts";
import PimpinanExecutorTable from "@/components/dashboard/PimpinanExecutorTable";
import {
  computeExecutorBreakdown,
  type DashboardStats,
} from "@/lib/pimpinan/stats";

type StatTile = {
  label: string;
  value: string | number;
  icon: typeof Inbox;
  iconClass: string;
};

export default function PimpinanDashboard({
  complaints,
  stats,
}: {
  complaints: ComplaintStaffListItem[];
  stats: DashboardStats;
}) {
  const latest = complaints.slice(0, 6);
  const berjalan = (stats.perStatus.find((x) => x.status === "diterima")?.count ?? 0) +
    (stats.perStatus.find((x) => x.status === "diproses")?.count ?? 0);

  const tiles: StatTile[] = [
    {
      label: "Total Aduan",
      value: stats.total,
      icon: Inbox,
      iconClass: "bg-brand-50 text-brand-700",
    },
    {
      label: "Menunggu Diterima",
      value: stats.perStatus.find((x) => x.status === "diajukan")?.count ?? 0,
      icon: ClipboardCheck,
      iconClass: "bg-amber-50 text-amber-700",
    },
    {
      label: "Sedang Diproses",
      value: berjalan,
      icon: Wrench,
      iconClass: "bg-indigo-50 text-indigo-700",
    },
    {
      label: "Selesai",
      value: stats.selesai,
      icon: CheckCircle2,
      iconClass: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Ditolak",
      value: stats.ditolak,
      icon: XCircle,
      iconClass: "bg-rose-50 text-rose-700",
    },
    {
      label: "Tingkat Penyelesaian",
      value: `${stats.tingkatPenyelesaian}%`,
      icon: Percent,
      iconClass: "bg-sky-50 text-sky-700",
    },
  ];

  return (
    <div className="container-page py-8">
      {/* Stat tile — mobile: scroll horizontal agar tiap tile lega; lg: 6 kolom */}
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-6 lg:gap-4 lg:overflow-visible lg:pb-0">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="card w-[46vw] min-w-[160px] max-w-[210px] shrink-0 snap-start p-4 sm:p-5 lg:w-auto lg:min-w-0 lg:max-w-none"
          >
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                t.iconClass
              )}
            >
              <t.icon className="h-5 w-5" />
            </span>
            <p className="mt-4 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              {t.value}
            </p>
            <p className="mt-0.5 text-xs font-medium text-ink-muted sm:text-sm">
              {t.label}
            </p>
          </div>
        ))}
      </div>

      {/* Grafik */}
      <div className="mt-6">
        <PimpinanCharts perStatus={stats.perStatus} perCategory={stats.perCategory} />
      </div>

      {/* Performa pelaksana */}
      <div className="mt-6">
        <PimpinanExecutorTable breakdown={computeExecutorBreakdown(complaints)} />
      </div>

      {/* Aduan terbaru */}
      <div className="mt-6 card">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
            <Inbox className="h-4 w-4 text-brand-600" />
            Aduan Terbaru
          </h2>
          <Link
            href="/pimpinan/laporan"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            Lihat laporan
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {latest.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <Inbox className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-base font-bold text-ink">Belum ada aduan</h3>
            <p className="mt-1 max-w-xs text-sm text-ink-muted">
              Aduan dari warga akan tampil di sini begitu masuk.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {latest.map((c) => {
              const thumb = getPhotoUrl(c.photo_url);
              return (
                <li key={c.id}>
                  <Link
                    href={`/pimpinan/aduan/${c.id}`}
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
                        <Inbox className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">
                        {c.title}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-ink-faint">
                        <span className="font-mono">{c.ticket}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {c.reporter?.full_name ?? "Warga"}
                        </span>
                        <span>·</span>
                        <span>{formatRelativeTimeID(c.created_at)}</span>
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
    </div>
  );
}