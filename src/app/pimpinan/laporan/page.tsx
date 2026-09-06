import Link from "next/link";
import { FileText } from "lucide-react";
import { getAllComplaints } from "@/lib/queries";
import {
  filterByPeriod,
  buildRekapRows,
  periodLabel,
  type PeriodFilter,
} from "@/lib/pimpinan/stats";
import { formatDateTimeID } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";
import PimpinanReportButtons from "@/components/dashboard/PimpinanReportButtons";

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

interface Props {
  searchParams: { bulan?: string; tahun?: string };
}

export const metadata = {
  title: "Laporan Kinerja — Panel Pimpinan",
};

export default async function PimpinanLaporanPage({ searchParams }: Props) {
  const all = await getAllComplaints();
  const bulan = searchParams.bulan ? Number(searchParams.bulan) : null;
  const tahun = searchParams.tahun ? Number(searchParams.tahun) : null;
  const period: PeriodFilter = {
    bulan: bulan && bulan >= 1 && bulan <= 12 ? bulan : null,
    tahun,
  };
  const complaints = filterByPeriod(all, period);
  const rekapRows = buildRekapRows(complaints);
  const detail = complaints.slice(0, 50);

  const tahunOptions = Array.from(
    new Set(all.map((c) => new Date(c.created_at).getFullYear()))
  ).sort((a, b) => b - a);

  return (
    <main className="flex-1 pb-16">
      <div className="container-page py-8">
        <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
          Laporan Kinerja
        </h1>
        <p className="mt-0.5 text-sm text-ink-muted">
          Rekap penanganan aduan per kategori & periode. Bisa diunduh sebagai Excel.
        </p>

        {/* Filter periode */}
        <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="bulan" className="block text-xs font-semibold text-ink-muted">
              Bulan
            </label>
            <select
              id="bulan"
              name="bulan"
              defaultValue={bulan ?? ""}
              className="input-field mt-1 !w-auto !py-2"
            >
              <option value="">Semua</option>
              {BULAN.map((b, i) => (
                <option key={b} value={i + 1}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tahun" className="block text-xs font-semibold text-ink-muted">
              Tahun
            </label>
            <select
              id="tahun"
              name="tahun"
              defaultValue={tahun ?? ""}
              className="input-field mt-1 !w-auto !py-2"
            >
              <option value="">Semua</option>
              {tahunOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-secondary !py-2">
            Terapkan
          </button>
          <Link
            href="/pimpinan/laporan"
            className="btn-ghost !py-2 text-ink-muted"
          >
            Reset
          </Link>
        </form>

        {/* Tombol unduh (server sudah filter) */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-muted">
            Menampilkan <b className="text-ink">{complaints.length}</b> aduan
            {" · "}periode <b className="text-ink">{periodLabel(period)}</b>
          </p>
          <PimpinanReportButtons complaints={complaints} period={period} />
        </div>

        {/* Tabel rekap */}
        <div className="card mt-4 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <FileText className="h-4 w-4 text-brand-600" />
            <h2 className="text-sm font-bold text-ink">Rekap per Kategori</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted">
                <tr>
                  {["Kategori", "Total", "Diajukan", "Diterima", "Diproses", "Selesai", "Ditolak", "% Selesai"].map((h) => (
                    <th key={h} className="whitespace-nowrap px-5 py-3 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rekapRows.slice(1).map((row) => {
                  const isTotal = row[0] === "TOTAL";
                  return (
                    <tr key={String(row[0])} className={isTotal ? "bg-brand-50/40 font-bold" : ""}>
                      <td className="px-5 py-3 font-medium text-ink">{row[0]}</td>
                      {row.slice(1).map((cell, i) => (
                        <td key={i} className="px-4 py-3">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail aduan (50 terbaru) */}
        <div className="card mt-6 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <FileText className="h-4 w-4 text-brand-600" />
            <h2 className="text-sm font-bold text-ink">Detail Aduan (terbaru)</h2>
          </div>
          {detail.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-muted">
              Tidak ada aduan pada periode ini.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {detail.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/pimpinan/aduan/${c.id}`}
                    className="flex flex-wrap items-center gap-3 px-5 py-4 transition-colors hover:bg-brand-50/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{c.title}</p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        <span className="font-mono">{c.ticket}</span> ·{" "}
                        {c.category?.name ?? "Tanpa kategori"} ·{" "}
                        {formatDateTimeID(c.created_at)}
                      </p>
                    </div>
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