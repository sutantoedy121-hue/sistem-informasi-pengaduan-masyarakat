/**
 * Label Indonesia untuk enum status aduan & aksi log.
 * Dipakai bersama oleh laporan cetak dan ekspor Excel agar konsisten.
 */

export const STATUS_LABEL: Record<string, string> = {
  diajukan: "Diajukan",
  diterima: "Diterima",
  ditolak: "Ditolak",
  diproses: "Diproses",
  selesai: "Selesai",
};

export const ACTION_LABEL: Record<string, string> = {
  created: "Aduan diajukan",
  accepted: "Aduan diterima",
  rejected: "Aduan ditolak",
  assigned: "Ditugaskan ke pelaksana",
  progress: "Tindak lanjut",
  completed: "Penanganan selesai",
  reopened: "Aduan dibuka kembali",
  rated: "Penilaian warga",
};

export function labelStatus(status: string): string {
  return STATUS_LABEL[status] ?? status;
}

export function labelAction(action: string): string {
  return ACTION_LABEL[action] ?? action;
}