/**
 * Tipe data yang dipakai aplikasi, dicocokkan manual dengan schema.sql
 * (tidak ada codegen dari supabase CLI).
 * Nama field mengikuti kolom PostgreSQL (snake_case) karena itu yang
 * dikembalikan supabase-js.
 */

export type UserRole = "masyarakat" | "petugas" | "pimpinan" | "admin";

export type ComplaintStatus =
  | "diajukan"
  | "diterima"
  | "ditolak"
  | "diproses"
  | "selesai";

export type LogAction =
  | "created"
  | "accepted"
  | "rejected"
  | "assigned"
  | "progress"
  | "completed"
  | "reopened"
  | "rated"
  | "commented";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  region_id: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  description: string | null;
  color: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Executor {
  id: string;
  name: string;
  category_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Region {
  id: string;
  kecamatan: string | null;
  desa: string | null;
  rw: number | null;
  rt: number | null;
  name: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Complaint {
  id: string;
  ticket: string;
  reporter_id: string;
  category_id: string | null;
  executor_id: string | null;
  region_id: string | null;
  title: string;
  description: string;
  location: string | null;
  location_detail: string | null;
  category_note: string | null;
  lat: number | null;
  lng: number | null;
  photo_url: string | null;
  status: ComplaintStatus;
  rating: number | null;
  rating_note: string | null;
  target_date: string | null;
  created_at: string;
  updated_at: string;
  accepted_at: string | null;
  completed_at: string | null;
}

/** complaints + join kategori (dipakai di list/dashboard). */
export interface ComplaintWithCategory extends Complaint {
  category?: Category | null;
}

/** complaints + join kategori + data pelapor (dipakai list/dashboard petugas). */
export interface ComplaintStaffListItem extends ComplaintWithCategory {
  reporter?: { full_name: string | null; phone: string | null } | null;
  executor?: { name: string | null } | null;
}

/** complaints + join kategori, pelaksana, dan wilayah (dipakai di detail). */
export interface ComplaintDetail extends Complaint {
  category?: Category | null;
  executor?: Executor | null;
  region?: Region | null;
  reporter?: { full_name: string | null; phone: string | null } | null;
}

export interface ComplaintLog {
  id: string;
  complaint_id: string;
  actor_id: string | null;
  action: LogAction;
  status_from: ComplaintStatus | null;
  status_to: ComplaintStatus | null;
  description: string | null;
  result: string | null;
  photo_url: string | null;
  created_at: string;
}

export interface ComplaintLogWithActor extends ComplaintLog {
  actor?: { full_name: string | null } | null;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  complaint_id: string | null;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
}

/** Baris tabel login_logs (riwayat login, dipakai panel admin FR-17). */
export interface LoginLogRow {
  id: string;
  user_id: string;
  email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

/** Baris tabel site_settings (single row id=1, pengaturan situs FR-18). */
export interface SiteSettings {
  id: number;
  site_name: string;
  tagline: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_address: string | null;
  /** Nama file logo di bucket "site-assets" (atau URL absolut). */
  logo_url: string | null;
  updated_at: string;
}

/** Baris daftar akun untuk panel admin (auth.users + profiles digabung). */
export interface AdminUserRow {
  id: string;
  email: string | null;
  fullName: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}
