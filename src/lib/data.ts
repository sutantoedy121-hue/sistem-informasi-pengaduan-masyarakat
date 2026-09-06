/**
 * Mock data untuk dashboard publik SIPMA.
 * Nantinya diganti dengan fetch ke Supabase (tabel complaints, categories, complaint_logs).
 */

export type StatusKey = "diajukan" | "diterima" | "diproses" | "selesai" | "ditolak";

export interface StatusMeta {
  key: StatusKey;
  label: string;
  badge: string;
  dot: string;
}

export const statusMeta: Record<StatusKey, StatusMeta> = {
  diajukan: {
    key: "diajukan",
    label: "Diajukan",
    badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    dot: "bg-amber-500",
  },
  diterima: {
    key: "diterima",
    label: "Diterima",
    badge: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    dot: "bg-blue-500",
  },
  diproses: {
    key: "diproses",
    label: "Diproses",
    badge: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
    dot: "bg-indigo-500",
  },
  selesai: {
    key: "selesai",
    label: "Selesai",
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  ditolak: {
    key: "ditolak",
    label: "Ditolak",
    badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    dot: "bg-rose-500",
  },
};

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  count: number;
  color: string;
}

export const categories: Category[] = [
  {
    id: "cat-1",
    name: "Infrastruktur Jalan",
    slug: "jalan",
    icon: "TrafficCone",
    description: "Kerusakan jalan, trotoar, dan jembatan",
    count: 128,
    color: "bg-brand-50 text-brand-700",
  },
  {
    id: "cat-2",
    name: "Penerangan Jalan",
    slug: "pju",
    icon: "Lightbulb",
    description: "Lampu PJU mati atau rusak",
    count: 64,
    color: "bg-amber-50 text-amber-700",
  },
  {
    id: "cat-3",
    name: "Kebersihan & Sampah",
    slug: "sampah",
    icon: "Trash2",
    description: "TPS penuh, saluran mampet",
    count: 97,
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    id: "cat-4",
    name: "Drainase & Banjir",
    slug: "drainase",
    icon: "Droplets",
    description: "Pendangkalan saluran, genangan",
    count: 52,
    color: "bg-sky-50 text-sky-700",
  },
  {
    id: "cat-6",
    name: "Ketertiban Umum",
    slug: "ketertiban",
    icon: "ShieldCheck",
    description: "Gangguan ketertiban & keamanan",
    count: 33,
    color: "bg-rose-50 text-rose-700",
  },
  {
    id: "cat-5",
    name: "Lainnya",
    slug: "lainnya",
    icon: "FileText",
    description: "Keluhan lain di luar kategori yang ada",
    count: 41,
    color: "bg-violet-50 text-violet-700",
  },
];

export interface Complaint {
  id: string;
  ticket: string;
  title: string;
  category: string;
  categoryColor: string;
  status: StatusKey;
  location: string;
  createdAt: string;
  reporter: string;
}

export const recentComplaints: Complaint[] = [
  {
    id: "c-1",
    ticket: "SIPMA-2026-09-0142",
    title: "Jalan berlubang di depan SDN Banjarejo 1 Bojonegoro",
    category: "Infrastruktur Jalan",
    categoryColor: "bg-brand-50 text-brand-700",
    status: "diproses",
    location: "RT 04 / RW 02",
    createdAt: "2026-09-04T07:30:00Z",
    reporter: "Budi Santoso",
  },
  {
    id: "c-2",
    ticket: "SIPMA-2026-09-0141",
    title: "Lampu PJU mati di Gang Mawar",
    category: "Penerangan Jalan",
    categoryColor: "bg-amber-50 text-amber-700",
    status: "diterima",
    location: "RT 02 / RW 01",
    createdAt: "2026-09-04T05:15:00Z",
    reporter: "Siti Aminah",
  },
  {
    id: "c-3",
    ticket: "SIPMA-2026-09-0140",
    title: "Tumpukan sampah di TPS Melati belum diangkut",
    category: "Kebersihan & Sampah",
    categoryColor: "bg-emerald-50 text-emerald-700",
    status: "selesai",
    location: "RT 05 / RW 03",
    createdAt: "2026-09-03T22:10:00Z",
    reporter: "Agus Wijaya",
  },
  {
    id: "c-4",
    ticket: "SIPMA-2026-09-0139",
    title: "Saluran air tersumbat menyebabkan genangan",
    category: "Drainase & Banjir",
    categoryColor: "bg-sky-50 text-sky-700",
    status: "diajukan",
    location: "RT 01 / RW 04",
    createdAt: "2026-09-03T18:45:00Z",
    reporter: "Rina Marlina",
  },
  {
    id: "c-5",
    ticket: "SIPMA-2026-09-0138",
    title: "Pengajuan KTP tertunda lebih dari 7 hari",
    category: "Layanan Administrasi",
    categoryColor: "bg-violet-50 text-violet-700",
    status: "diterima",
    location: "RT 03 / RW 02",
    createdAt: "2026-09-03T14:20:00Z",
    reporter: "Dewi Lestari",
  },
  {
    id: "c-6",
    ticket: "SIPMA-2026-09-0137",
    title: "Kegaduhan warga malam di area pasar",
    category: "Ketertiban Umum",
    categoryColor: "bg-rose-50 text-rose-700",
    status: "selesai",
    location: "RT 06 / RW 03",
    createdAt: "2026-09-02T20:00:00Z",
    reporter: "Hendra Gunawan",
  },
];

export interface ProcessStep {
  step: string;
  title: string;
  description: string;
  icon: string;
}

export const processSteps: ProcessStep[] = [
  {
    step: "01",
    title: "Ajukan Aduan",
    description:
      "Daftar/masuk, isi formulir aduan: kategori, judul, deskripsi, lokasi, dan unggah foto bukti.",
    icon: "PenLine",
  },
  {
    step: "02",
    title: "Terima Nomor Tiket",
    description:
      "Sistem otomatis menerbitkan nomor tiket sebagai bukti resmi bahwa aduan Anda diterima.",
    icon: "Ticket",
  },
  {
    step: "03",
    title: "Verifikasi Petugas",
    description:
      "Petugas memverifikasi kelengkapan aduan dan menetapkan status diterima atau ditolak.",
    icon: "ShieldCheck",
  },
  {
    step: "04",
    title: "Penugasan & Tindak Lanjut",
    description:
      "Aduan ditugaskan ke pelaksana. Progres dan dokumentasi penanganan dicatat di setiap tahap.",
    icon: "Wrench",
  },
  {
    step: "05",
    title: "Selesai & Penilaian",
    description:
      "Setelah selesai, Anda menerima notifikasi real-time dan dapat memberikan konfirmasi & penilaian.",
    icon: "Star",
  },
];
