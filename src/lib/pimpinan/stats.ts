/**
 * Agregasi & penyusun laporan untuk Panel Pimpinan.
 * Semua dihitung dari satu sumber: getAllComplaints() (semua aduan staf).
 * Dipakai bersama oleh dashboard (grafik) & laporan kinerja (Excel).
 */
import type { ComplaintStaffListItem } from "@/lib/db-types";
import { statusMeta } from "@/lib/data";
import { labelStatus } from "@/lib/report/labels";
import { formatDateTimeID } from "@/lib/utils";
import { CATEGORY_HEX } from "@/lib/pimpinan/chartColors";

export interface StatusCount {
  status: string;
  label: string;
  count: number;
}

export interface CategoryCount {
  name: string;
  count: number;
  /** HEX untuk fill grafik recharts. */
  color: string;
}

export interface PeriodFilter {
  bulan?: number | null; // 1-12
  tahun?: number | null;
}

// Warna grafik di chartColors.ts (dipakai juga PimpinanCharts).

/** Distribusi aduan per status, urut tetap (diajukan → ditolak). */
export function perStatusCounts(
  complaints: ComplaintStaffListItem[]
): StatusCount[] {
  return Object.keys(statusMeta).map((status) => ({
    status,
    label: statusMeta[status as keyof typeof statusMeta].label,
    count: complaints.filter((c) => c.status === status).length,
  }));
}

/** Distribusi aduan per kategori (nama kategori), + warna. */
export function perCategoryCounts(
  complaints: ComplaintStaffListItem[]
): CategoryCount[] {
  const map = new Map<string, number>();
  for (const c of complaints) {
    const name = c.category?.name ?? "Tanpa kategori";
    map.set(name, (map.get(name) ?? 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count], i) => ({
      name,
      count,
      color: CATEGORY_HEX[i % CATEGORY_HEX.length],
    }));
}

export interface DashboardStats {
  total: number;
  perStatus: StatusCount[];
  perCategory: CategoryCount[];
  selesai: number;
  ditolak: number;
  tingkatPenyelesaian: number; // %
}

export function computeStats(
  complaints: ComplaintStaffListItem[]
): DashboardStats {
  const perStatus = perStatusCounts(complaints);
  const byStatus = (status: string) =>
    perStatus.find((s) => s.status === status)?.count ?? 0;
  const selesai = byStatus("selesai");
  const ditolak = byStatus("ditolak");
  const total = complaints.length;
  return {
    total,
    perStatus,
    perCategory: perCategoryCounts(complaints),
    selesai,
    ditolak,
    tingkatPenyelesaian: total ? Math.round((selesai / total) * 100) : 0,
  };
}

/** Filter aduan berdasarkan periode (bulan &/atau tahun created_at). */
export function filterByPeriod(
  complaints: ComplaintStaffListItem[],
  p: PeriodFilter
): ComplaintStaffListItem[] {
  return complaints.filter((c) => {
    const d = new Date(c.created_at);
    if (p.tahun && d.getFullYear() !== p.tahun) return false;
    if (p.bulan && d.getMonth() + 1 !== p.bulan) return false;
    return true;
  });
}

/** Baris sheet "Rekap Kinerja": satu baris per kategori + baris total. */
export function buildRekapRows(
  complaints: ComplaintStaffListItem[]
): (string | number)[][] {
  const byCategory = new Map<
    string,
    { total: number; diajukan: number; diterima: number; diproses: number; selesai: number; ditolak: number }
  >();

  for (const c of complaints) {
    const name = c.category?.name ?? "Tanpa kategori";
    const row = byCategory.get(name) ?? {
      total: 0,
      diajukan: 0,
      diterima: 0,
      diproses: 0,
      selesai: 0,
      ditolak: 0,
    };
    row.total += 1;
    if (c.status === "diajukan") row.diajukan += 1;
    else if (c.status === "diterima") row.diterima += 1;
    else if (c.status === "diproses") row.diproses += 1;
    else if (c.status === "selesai") row.selesai += 1;
    else if (c.status === "ditolak") row.ditolak += 1;
    byCategory.set(name, row);
  }

  const rows: (string | number)[][] = [
    ["Kategori", "Total", "Diajukan", "Diterima", "Diproses", "Selesai", "Ditolak", "% Selesai"],
  ];
  let tot = { total: 0, diajukan: 0, diterima: 0, diproses: 0, selesai: 0, ditolak: 0 };
  for (const [name, r] of [...byCategory.entries()].sort((a, b) => b[1].total - a[1].total)) {
    const pct = r.total ? Math.round((r.selesai / r.total) * 100) : 0;
    rows.push([name, r.total, r.diajukan, r.diterima, r.diproses, r.selesai, r.ditolak, `${pct}%`]);
    tot.total += r.total;
    tot.diajukan += r.diajukan;
    tot.diterima += r.diterima;
    tot.diproses += r.diproses;
    tot.selesai += r.selesai;
    tot.ditolak += r.ditolak;
  }
  const pctAll = tot.total ? Math.round((tot.selesai / tot.total) * 100) : 0;
  rows.push([
    "TOTAL",
    tot.total,
    tot.diajukan,
    tot.diterima,
    tot.diproses,
    tot.selesai,
    tot.ditolak,
    `${pctAll}%`,
  ]);
  return rows;
}

/** Baris sheet "Detail Aduan": satu baris per aduan. */
export function buildDetailRows(
  complaints: ComplaintStaffListItem[]
): (string | number)[][] {
  return [
    ["Tiket", "Diajukan", "Judul", "Kategori", "Status", "Lokasi", "Pelapor", "Pelaksana"],
    ...complaints.map((c) => [
      c.ticket,
      formatDateTimeID(c.created_at),
      c.title,
      c.category?.name ?? "Tanpa kategori",
      labelStatus(c.status),
      c.location ?? "-",
      c.reporter?.full_name ?? "Warga",
      c.executor?.name ?? "-",
    ] as (string | number)[]),
  ];
}

/** Label periode untuk judul Excel & UI, mis. "2026-09" / "2026" / "Semua". */
export function periodLabel(p: PeriodFilter): string {
  if (p.bulan && p.tahun) return `${p.tahun}-${String(p.bulan).padStart(2, "0")}`;
  if (p.tahun) return String(p.tahun);
  return "semua";
}

export interface ExecutorBreakdown {
  name: string;
  /** Sedang diproses (status diproses). */
  diproses: number;
  /** Selesai ditangani. */
  selesai: number;
  total: number;
  /** Rata-rata lama penanganan aduan selesai, dalam hari (1 desimal). */
  avgDurasiHari: number | null;
}

/**
 * Performa per pelaksana (nama dari join executors). Dipakai dashboard
 * pimpinan untuk melihat beban & kecepatan tiap pelaksana.
 * Aduan yang belum ditugaskan (executor kosong) dilewati.
 */
export function computeExecutorBreakdown(
  complaints: ComplaintStaffListItem[]
): ExecutorBreakdown[] {
  const map = new Map<string, ExecutorBreakdown>();
  for (const c of complaints) {
    const ex = c.executor?.name;
    if (!ex) continue;
    const row =
      map.get(ex) ?? { name: ex, diproses: 0, selesai: 0, total: 0, avgDurasiHari: null };
    row.total += 1;
    if (c.status === "diproses") {
      row.diproses += 1;
    } else if (c.status === "selesai" && c.completed_at) {
      row.selesai += 1;
      const hari =
        (new Date(c.completed_at).getTime() - new Date(c.created_at).getTime()) /
        86_400_000;
      row.avgDurasiHari = row.avgDurasiHari === null ? hari : row.avgDurasiHari + hari;
    }
    map.set(ex, row);
  }
  return [...map.values()]
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
    .map((r) =>
      r.avgDurasiHari === null
        ? r
        : { ...r, avgDurasiHari: Math.round((r.avgDurasiHari / r.selesai) * 10) / 10 }
    );
}