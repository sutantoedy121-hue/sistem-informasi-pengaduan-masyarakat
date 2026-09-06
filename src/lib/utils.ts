import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes safely, resolving conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format an ISO date string to Indonesian locale.
 */
export function formatDateID(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/**
 * Format ISO date + time to Indonesian (e.g. "5 September 2026 pukul 09.30").
 */
export function formatDateTimeID(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * Label kategori aduan. Bila kategori "Lainnya" dan ada catatan,
 * tampilkan "Lainnya (catatan)". Contoh: "Lainnya (Kabel Putus)".
 */
export function categoryLabel(category?: { name?: string | null } | null, note?: string | null) {
  if (!category?.name) return "—";
  if (category.name === "Lainnya" && note?.trim()) {
    return `Lainnya (${note.trim()})`;
  }
  return category.name;
}

/**
 * Label wilayah berjenjang dari baris regions:
 *   "Kec. Bojonegoro, Desa Karang Pacar, RW 01 RT 01"
 * Menangani rw/rt null (aduan di level kecamatan/desa).
 */
export function regionLabel(region: {
  name?: string | null;
  kecamatan?: string | null;
  desa?: string | null;
  rw?: number | null;
  rt?: number | null;
} | null | undefined): string | null {
  if (!region) return null;
  if (region.name) return region.name;

  const parts: string[] = [];
  if (region.kecamatan) parts.push(`Kec. ${region.kecamatan}`);
  if (region.desa) parts.push(`Desa ${region.desa}`);

  if (region.rw != null && region.rt != null) {
    parts.push(`RW ${String(region.rw).padStart(2, "0")} RT ${String(region.rt).padStart(2, "0")}`);
  } else if (region.rw != null) {
    parts.push(`RW ${String(region.rw).padStart(2, "0")}`);
  } else if (region.rt != null) {
    parts.push(`RT ${String(region.rt).padStart(2, "0")}`);
  }

  return parts.length > 0 ? parts.join(", ") : null;
}


/**
 * Relative time in Indonesian (e.g. "2 jam lalu").
 */
export function formatRelativeTimeID(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${Math.max(1, minutes)} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  if (days < 7) return `${days} hari lalu`;
  return formatDateID(d);
}
