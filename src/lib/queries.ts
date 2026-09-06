import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AdminUserRow,
  Category,
  ComplaintLogWithActor,
  ComplaintDetail,
  ComplaintStaffListItem,
  ComplaintWithCategory,
  Executor,
  LoginLogRow,
  NotificationRow,
  Profile,
  SiteSettings,
  UserRole,
} from "@/lib/db-types";

/** User auth + profil. Profile di-fallback dari user_metadata bila trigger belum sempat membuatnya. */
export async function getSession(): Promise<{
  user: {
    id: string;
    email: string | null;
    /** Provider autentikasi user (mis. "google"), untuk UI profil. */
    providers: string[];
  } | null;
  profile: Profile | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };

  const userData = {
    id: user.id,
    email: user.email ?? null,
    providers:
      user.identities?.map((i) => i.provider).filter(Boolean) as string[] ?? [],
  };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) return { user: userData, profile: profile as Profile };

  const fallback: Profile = {
    id: user.id,
    role: "masyarakat",
    full_name: (user.user_metadata?.full_name as string) || userData.email || null,
    phone: (user.user_metadata?.phone as string) || null,
    address: null,
    region_id: null,
    avatar_url: null,
    is_active: true,
    created_at: user.created_at,
    updated_at: user.created_at,
  };
  return { user: userData, profile: fallback };
}

/** Daftar kategori aktif untuk form aduan. */
export async function getActiveCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("name");
  if (error) return [];
  const cats = (data ?? []) as Category[];
  // Pastikan kategori "Lainnya" selalu tampil di paling akhir.
  return [
    ...cats.filter((c) => c.slug !== "lainnya"),
    ...cats.filter((c) => c.slug === "lainnya"),
  ];
}

/** Semua aduan milik satu pelapor (terbaru dulu), beserta kategori. */
export async function getUserComplaints(
  reporterId: string
): Promise<ComplaintWithCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("complaints")
    .select("*, category:categories(*)")
    .eq("reporter_id", reporterId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as ComplaintWithCategory[];
}

/** Cari satu aduan berdasarkan nomor tiket (untuk pelacakan publik). */
export async function getComplaintByTicket(
  ticket: string
): Promise<ComplaintDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("complaints")
    .select("*, category:categories(*), executor:executors(*), region:regions(*)")
    .eq("ticket", ticket.trim().toUpperCase())
    .maybeSingle();
  if (error || !data) return null;
  return data as ComplaintDetail;
}

/** Detail satu aduan + kategori/pelaksana/wilayah/pelapor. */
export async function getComplaintDetail(
  id: string
): Promise<ComplaintDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("complaints")
    .select(
      "*, category:categories(*), executor:executors(*), region:regions(*), reporter:profiles(full_name, phone)"
    )
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as ComplaintDetail;
}

/** Sebagian aduan terbaru untuk halaman publik (transparansi), beserta kategori. */
export async function getRecentComplaints(
  limit = 4
): Promise<ComplaintWithCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("complaints")
    .select("*, category:categories(*)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as ComplaintWithCategory[];
}

/**
 * Semua aduan dari semua pelapor untuk panel staf (FR-08), beserta kategori
 * dan data pelapor. Terbaru dulu. Dipakai petugas/pimpinan/admin.
 */
export async function getAllComplaints(): Promise<ComplaintStaffListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("complaints")
    .select(
      "*, category:categories(*), executor:executors(name), reporter:profiles(full_name, phone)"
    )
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as ComplaintStaffListItem[];
}

/** Daftar pelaksana aktif (tabel executors) untuk form penugasan (FR-10). */
export async function getExecutors(): Promise<Executor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("executors")
    .select("*")
    .eq("is_active", true)
    .order("name");
  if (error) return [];
  return (data ?? []) as Executor[];
}

/** Riwayat progres (complaint_logs) sebuah aduan, dari lama ke baru. */
export async function getComplaintLogs(
  complaintId: string
): Promise<ComplaintLogWithActor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("complaint_logs")
    .select("*, actor:profiles(full_name)")
    .eq("complaint_id", complaintId)
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data ?? []) as ComplaintLogWithActor[];
}

/** Notifikasi terbaru milik user (FR-06A, diisi mulai Tahap 4/6). */
export async function getLatestNotifications(
  userId: string,
  limit = 5
): Promise<NotificationRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as NotificationRow[];
}

/** Semua kategori (termasuk nonaktif) untuk tabel master admin (FR-18). */
export async function getAllCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");
  if (error) return [];
  return (data ?? []) as Category[];
}

/** Semua pelaksana (termasuk nonaktif) untuk tabel master admin (FR-18). */
export async function getAllExecutors(): Promise<Executor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("executors")
    .select("*")
    .order("name");
  if (error) return [];
  return (data ?? []) as Executor[];
}

/**
 * Daftar semua akun (auth.users + profiles) untuk panel admin (FR-17).
 * SERVER-ONLY: email ada di auth.users yang tak bisa dibaca via RLS —
 * dipakai createAdminClient() (service role). Jangan pernah di-client.
 */
export async function getAdminUserList(): Promise<AdminUserRow[]> {
  const admin = await createAdminClient();

  const { data: profiles, error: pErr } = await admin
    .from("profiles")
    .select("id, role, full_name, is_active, created_at");
  if (pErr) return [];

  const { data: authUsers, error: uErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (uErr) return [];

  const profileById = new Map(
    (profiles ?? []).map((p) => [p.id as string, p as Profile])
  );

  return (authUsers.users ?? [])
    .map((u) => {
      const p = profileById.get(u.id);
      return {
        id: u.id,
        email: u.email ?? null,
        fullName:
          (p?.full_name ?? (u.user_metadata?.full_name as string)) || u.email || null,
        role: (p?.role ?? "masyarakat") as UserRole,
        isActive: p?.is_active ?? true,
        createdAt: u.created_at,
      };
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** Riwayat login semua user (terbaru dulu) untuk panel admin (FR-17). */
export async function getAdminLoginLogs(): Promise<LoginLogRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("login_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) return [];
  return (data ?? []) as LoginLogRow[];
}

/** Pengaturan situs (row id=1) untuk pengaturan & Footer. */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  return (data as SiteSettings | null) ?? null;
}
