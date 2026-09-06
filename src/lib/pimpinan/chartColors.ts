/**
 * Warna HEX untuk grafik Recharts (FR-15).
 * Sebasai nilai SVG fill — class Tailwind tidak berlaku di elemen grafik.
 * Sejajar dengan badge warna statusMeta di src/lib/data.ts.
 */

export const STATUS_HEX: Record<string, string> = {
  diajukan: "#f59e0b", // amber-500
  diterima: "#3b82f6", // blue-500
  diproses: "#6366f1", // indigo-500
  selesai: "#10b981", // emerald-500
  ditolak: "#f43f5e", // rose-500
};

export const CATEGORY_HEX = [
  "#2563eb",
  "#f59e0b",
  "#059669",
  "#0ea5e9",
  "#8b5cf6",
  "#f43f5e",
  "#64748b",
  "#e11d48",
];