import type { ComplaintStatus } from "@/lib/db-types";

/**
 * Statistik ringkas untuk halaman publik — dihitung dari baris aduan ringan
 * (tanpa join). Dipakai section landing & realtime refresh.
 */

export interface PublicComplaintStat {
  status: ComplaintStatus;
  created_at: string;
  accepted_at: string | null;
  rating: number | null;
}

export interface PublicStatsResult {
  total: number;
  selesai: number;
  /** Sedang ditangani: diterima + diproses (konsisten konvensi panel pimpinan). */
  sedangDiproses: number;
  /** Rata-rata lama created_at → accepted_at dalam jam (ceil), null bila belum ada. */
  responseJam: number | null;
  /** % selesai dari total. */
  penyelesaianPct: number;
  /** Rata-rata rating warga (1–5) dari aduan selesai yang sudah dinilai; null bila belum ada. */
  avgRating: number | null;
  /** Jumlah aduan yang sudah dinilai. */
  ratedCount: number;
}

/** Hitung angka tile publik dari daftar aduan terang (hanya field yg dipakai). */
export function computePublicStats(rows: PublicComplaintStat[]): PublicStatsResult {
  let selesai = 0;
  let sedang = 0;
  let accepted = 0;
  let totalJam = 0;
  let ratingSum = 0;
  let ratedCount = 0;
  for (const r of rows) {
    if (r.status === "selesai") selesai += 1;
    else if (r.status === "diterima" || r.status === "diproses") sedang += 1;
    if (r.accepted_at && r.created_at) {
      const jam =
        (new Date(r.accepted_at).getTime() - new Date(r.created_at).getTime()) / 3_600_000;
      if (Number.isFinite(jam) && jam >= 0) {
        totalJam += jam;
        accepted += 1;
      }
    }
    if (typeof r.rating === "number") {
      ratingSum += r.rating;
      ratedCount += 1;
    }
  }
  return {
    total: rows.length,
    selesai,
    sedangDiproses: sedang,
    responseJam: accepted ? Math.ceil(totalJam / accepted) : null,
    penyelesaianPct: rows.length ? Math.round((selesai / rows.length) * 100) : 0,
    avgRating: ratedCount ? Math.round((ratingSum / ratedCount) * 10) / 10 : null,
    ratedCount,
  };
}