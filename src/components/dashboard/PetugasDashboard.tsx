import Link from "next/link";
import {
  Inbox,
  ClipboardCheck,
  Wrench,
  CheckCircle2,
  ChevronRight,
  User,
  MapPin,
  Bell,
  ClipboardList,
} from "lucide-react";
import { getPhotoUrl } from "@/lib/storage";
import { formatRelativeTimeID, categoryLabel, cn } from "@/lib/utils";
import type { ComplaintStaffListItem } from "@/lib/db-types";
import StatusBadge from "@/components/ui/StatusBadge";

type StatTile = {
  label: string;
  value: number;
  icon: typeof Inbox;
  iconClass: string;
};

export default function PetugasDashboard({
  complaints,
}: {
  complaints: ComplaintStaffListItem[];
}) {
  const menunggu = complaints.filter((c) => c.status === "diajukan");
  const berjalan = complaints.filter((c) =>
    ["diterima", "diproses"].includes(c.status)
  );
  const selesai = complaints.filter((c) => c.status === "selesai");
  const ditolak = complaints.filter((c) => c.status === "ditolak");
  const latest = complaints.slice(0, 5);

  const tiles: StatTile[] = [
    {
      label: "Menunggu Verifikasi",
      value: menunggu.length,
      icon: ClipboardCheck,
      iconClass: "bg-amber-50 text-amber-700",
    },
    {
      label: "Sedang Diproses",
      value: berjalan.length,
      icon: Wrench,
      iconClass: "bg-indigo-50 text-indigo-700",
    },
    {
      label: "Selesai",
      value: selesai.length,
      icon: CheckCircle2,
      iconClass: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Total Aduan",
      value: complaints.length,
      icon: Inbox,
      iconClass: "bg-brand-50 text-brand-700",
    },
  ];

  return (
    <div className="container-page py-8">
      {/* Ringkasan tile */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="card p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  t.iconClass
                )}
              >
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
            <Link
              href="/petugas/aduan"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              Lihat semua
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {latest.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <Inbox className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-base font-bold text-ink">
                Belum ada aduan masuk
              </h3>
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
                      href={`/petugas/aduan/${c.id}`}
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
                          <ClipboardList className="h-5 w-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">
                          {c.title}
                        </p>
                        <p className="mt-0.5 flex items-center gap-x-2 gap-y-0.5 text-[11px] text-ink-faint">
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

        {/* Kolom kanan */}
        <div className="space-y-6">
          {/* Antrean verifikasi */}
          <div className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
              <ClipboardCheck className="h-4 w-4 text-amber-500" />
              Antrean Verifikasi
            </h2>
            {menunggu.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">
                Tidak ada aduan yang menunggu verifikasi. Semua beres 🎉
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {menunggu.slice(0, 4).map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/petugas/aduan/${c.id}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2.5 transition-colors hover:border-amber-200 hover:bg-amber-50/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">
                          {c.title}
                        </p>
                        <p className="font-mono text-[10px] text-ink-faint">
                          {c.ticket}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" />
                    </Link>
                  </li>
                ))}
                {menunggu.length > 4 && (
                  <li className="pt-1 text-center">
                    <Link
                      href="/petugas/aduan?filter=diajukan"
                      className="text-xs font-semibold text-brand-600 hover:underline"
                    >
                      + {menunggu.length - 4} aduan lainnya
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </div>

          {/* Tips / ringkasan lain */}
          <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
              <Bell className="h-4 w-4 text-brand-600" />
              Alur penanganan
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Verifikasi aduan yang lengkap, tugaskan ke pelaksana, lalu catat
              tindak lanjut dan foto bukti hingga aduan selesai.
            </p>
          </div>

          {/* Status ditolak */}
          {ditolak.length > 0 && (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5">
              <h3 className="flex items-center gap-2 text-sm font-bold text-rose-700">
                <MapPin className="h-4 w-4" />
                Aduan Ditolak
              </h3>
              <p className="mt-1.5 text-sm text-rose-800">
                {ditolak.length} aduan berstatus ditolak. Pastikan alasan
                penolakan jelas agar warga bisa melengkapi data.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}