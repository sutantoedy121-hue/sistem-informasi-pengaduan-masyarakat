import { Users } from "lucide-react";
import type { ExecutorBreakdown } from "@/lib/pimpinan/stats";

interface Props {
  breakdown: ExecutorBreakdown[];
}

/**
 * Tabel "Performa Pelaksana" di dashboard pimpinan (FR-15):
 * beban & kecepatan tiap pelaksana — berapa aduan masih diproses,
 * berapa selesai, dan rata-rata lama penanganan aduan yang selesai.
 */
export default function PimpinanExecutorTable({ breakdown }: Props) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
        <Users className="h-4 w-4 text-brand-600" />
        <h2 className="text-sm font-bold text-ink">Performa Pelaksana</h2>
      </div>

      {breakdown.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-ink-muted">
          Belum ada aduan yang ditugaskan ke pelaksana.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                {["Pelaksana", "Diproses", "Selesai", "Total", "Rata-rata selesai"].map(
                  (h) => (
                    <th key={h} className="whitespace-nowrap px-5 py-3 font-semibold">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {breakdown.map((row) => (
                <tr key={row.name} className="hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-5 py-3 font-medium text-ink">
                    {row.name}
                  </td>
                  <td className="px-5 py-3 text-ink-soft">{row.diproses}</td>
                  <td className="px-5 py-3 text-ink-soft">{row.selesai}</td>
                  <td className="px-5 py-3 font-semibold text-ink">{row.total}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-ink-soft">
                    {row.avgDurasiHari !== null ? `${row.avgDurasiHari} hari` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}