import { getAllComplaints } from "@/lib/queries";
import { AlertTriangle, Clock } from "lucide-react";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatDateTimeID, formatRelativeTimeID } from "@/lib/utils";

export const metadata = {
  title: "Aduan Terlambat Direspon — Panel Pimpinan",
};

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export default async function PimpinanOverduePage() {
  const all = await getAllComplaints();
  const overdue = all
    .filter(
      (c) =>
        c.status === "diajukan" &&
        Date.now() - new Date(c.created_at).getTime() >= SEVEN_DAYS_MS
    )
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

  return (
    <main className="flex-1 pb-16">
      <div className="container-page py-8">
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/70 p-4 text-sm text-red-900 shadow-soft">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-red-950">
              Laporan Belum Direspon &gt; 1 Minggu
            </h2>
            <p className="mt-0.5 text-xs text-red-800">
              Audit pengawasan: {overdue.length} aduan berstatus <b>Diajukan</b>{" "}
              telah melewati SLA 7 hari tanpa verifikasi dari pihak terkait.
            </p>
          </div>
        </div>

        <div className="mt-6 card overflow-hidden">
          {overdue.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Clock className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-base font-bold text-ink">
                Tidak ada keterlambatan
              </h3>
              <p className="mt-1 max-w-xs text-sm text-ink-muted">
                Semua aduan sudah direspon dalam batas waktu 7 hari.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {overdue.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/pimpinan/aduan/${c.id}`}
                    className="flex flex-wrap items-center gap-3 px-5 py-4 transition-colors hover:bg-red-50/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">
                        {c.title}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-muted">
                        <span className="font-mono">{c.ticket}</span>
                        <span>·</span>
                        <span>{c.category?.name ?? "Tanpa kategori"}</span>
                        <span>·</span>
                        <span>{formatDateTimeID(c.created_at)}</span>
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600 ring-1 ring-red-200">
                      <AlertTriangle className="h-3 w-3" />
                      {formatRelativeTimeID(c.created_at)}
                    </span>
                    <StatusBadge status={c.status} className="shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}