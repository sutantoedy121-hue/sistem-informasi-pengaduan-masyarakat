"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
  LabelList,
} from "recharts";
import type { StatusCount, CategoryCount } from "@/lib/pimpinan/stats";
import { STATUS_HEX } from "@/lib/pimpinan/chartColors";

interface Props {
  perStatus: StatusCount[];
  perCategory: CategoryCount[];
}

/**
 * Grafik dashboard pimpinan (FR-15): bar chart per status & per kategori.
 * Recharts butuh HEX fill, bukan class Tailwind — warna di chartColors.ts.
 */
export default function PimpinanCharts({ perStatus, perCategory }: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Per status */}
      <div className="card p-5 sm:p-6">
        <h3 className="text-sm font-bold text-ink">Distribusi per Status</h3>
        <p className="mt-0.5 text-xs text-ink-muted">
          Jumlah aduan berdasarkan status saat ini.
        </p>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={perStatus}
              layout="vertical"
              margin={{ top: 0, right: 40, bottom: 0, left: 0 }}
            >
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="label" width={92} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: "rgba(148,163,184,0.12)" }} />
              <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={28}>
                {perStatus.map((s) => (
                  <Cell key={s.status} fill={STATUS_HEX[s.status] ?? "#64748b"} />
                ))}
                <LabelList dataKey="count" position="right" className="fill-ink-soft" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per kategori */}
      <div className="card p-5 sm:p-6">
        <h3 className="text-sm font-bold text-ink">Aduan per Kategori</h3>
        <p className="mt-0.5 text-xs text-ink-muted">
          Jumlah aduan dikelompokkan per kategori.
        </p>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={perCategory}
              layout="vertical"
              margin={{ top: 0, right: 40, bottom: 0, left: 0 }}
            >
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={130} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: "rgba(148,163,184,0.12)" }} />
              <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={24}>
                {perCategory.map((cat) => (
                  <Cell key={cat.name} fill={cat.color} />
                ))}
                <LabelList dataKey="count" position="right" className="fill-ink-soft" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}