/**
 * Helper penyusun data laporan yang dipakai ekspor Excel.
 * Mendapatkan shape data dari ComplaintDetail + ComplaintLogWithActor
 * (sudah lengkap dengan join category/executor/region/reporter).
 */
import type {
  ComplaintDetail,
  ComplaintLogWithActor,
} from "@/lib/db-types";
import {
  formatDateID,
  formatDateTimeID,
  categoryLabel,
  regionLabel,
} from "@/lib/utils";
import { labelStatus, labelAction } from "@/lib/report/labels";

/**
 * Pasangan [label, nilai] yang mewakili "Laporan Aduan" (sheet 1).
 * Baris urut: data aduan → pelapor → lokasi → penjadwalan.
 */
export function buildComplaintRows(c: ComplaintDetail): Array<[string, string]> {
  const rows: Array<[string, string]> = [];

  // --- Data aduan ---
  rows.push(["No. Tiket", c.ticket]);
  rows.push(["Judul Aduan", c.title]);
  rows.push(["Status", labelStatus(c.status)]);
  rows.push(["Kategori", categoryLabel(c.category, c.category_note)]);
  rows.push([
    "Diajukan",
    formatDateTimeID(c.created_at),
  ]);
  if (c.accepted_at) rows.push(["Diterima oleh Petugas", formatDateTimeID(c.accepted_at)]);
  if (c.completed_at) rows.push(["Selesai", formatDateTimeID(c.completed_at)]);
  rows.push(["Uraian Aduan", c.description]);

  // --- Pelapor ---
  rows.push(["Nama Pelapor", c.reporter?.full_name ?? "Warga"]);
  rows.push(["Telepon Pelapor", c.reporter?.phone ?? "-"]);

  // --- Lokasi ---
  rows.push([
    "Lokasi",
    c.location && c.lat != null && c.lng != null
      ? `${c.location} (${c.lat}, ${c.lng})`
      : c.location || "-",
  ]);
  if (c.location_detail) rows.push(["Detail Lokasi", c.location_detail]);
  const region = regionLabel(c.region);
  if (region) rows.push(["Wilayah", region]);

  // --- Penjadwalan & pelaksana ---
  if (c.executor?.name) rows.push(["Pelaksana", c.executor.name]);
  if (c.target_date) rows.push(["Target Selesai", formatDateID(c.target_date)]);
  if (c.rating != null && c.rating > 0)
    rows.push(["Penilaian Warga", `${c.rating}/5${c.rating_note ? ` — ${c.rating_note}` : ""}`]);

  return rows;
}

/**
 * Baris "Riwayat Penanganan" (sheet 2): satu baris per complaint_log,
 * urut kronologis (sudah dari query asc). Kolom: Waktu, Aksi, Keterangan, Oleh.
 */
export function buildLogRows(
  logs: ComplaintLogWithActor[]
): Array<[string, string, string, string]> {
  return logs.map((log) => {
    const actor = log.actor?.full_name;
    return [
      formatDateTimeID(log.created_at),
      labelAction(log.action),
      log.description ?? log.result ?? "",
      actor ?? "-",
    ];
  });
}

export const LOG_HEADERS = ["Waktu", "Aksi", "Keterangan", "Oleh"];