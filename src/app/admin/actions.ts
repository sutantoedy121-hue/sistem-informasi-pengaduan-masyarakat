"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ASSET_BUCKET } from "@/lib/storage";
import type { UserRole } from "@/lib/db-types";

export type ActionResult =
  | { error?: string }
  | { success?: string }
  | undefined;

/**
 * Ambil user & pastikan role ADMIN (FR-17/18). Guard dipakai semua aksi
 * modul admin. Redirect ke panel sesuai role bila bukan admin.
 */
async function requireAdmin(): Promise<{ id: string } | never> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const role = profile?.role as UserRole | undefined;
  if (role !== "admin") {
    if (role === "masyarakat") redirect("/masyarakat");
    if (role === "petugas") redirect("/petugas");
    if (role === "pimpinan") redirect("/pimpinan");
    redirect("/");
  }
  return { id: user.id };
}

function firstError(error: { message: string } | null): string | undefined {
  if (!error) return undefined;
  if (/duplicate|already/i.test(error.message)) {
    return "Data sudah ada. Coba periksa kembali.";
  }
  return "Terjadi kesalahan pada server. Silakan coba lagi.";
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// ------------------------------------------------------------------
// FR-17 — KELOLA AKUN
// ------------------------------------------------------------------

/** Tambah akun baru (email + sandi via auth admin, role via profiles). */
export async function createUserAction(input: {
  email: string;
  fullName: string;
  role: UserRole;
  password: string;
}) {
  await requireAdmin();
  const email = input.email.trim();
  const fullName = input.fullName.trim();
  const password = input.password;
  const role = input.role;

  if (!isEmail(email)) return { error: "Email tidak valid." };
  if (!fullName) return { error: "Nama lengkap wajib diisi." };
  if (password.length < 6) return { error: "Sandi minimal 6 karakter." };
  if (!["masyarakat", "petugas", "pimpinan", "admin"].includes(role)) {
    return { error: "Role tidak valid." };
  }

  const admin = await createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) return { error: firstError(error) ?? "Gagal membuat akun." };
  if (!data.user) return { error: "Gagal membuat akun." };

  // Trigger handle_new_user hanya set role 'masyarakat'; sesuaikan di sini.
  const { error: upErr } = await admin
    .from("profiles")
    .update({ role, full_name: fullName })
    .eq("id", data.user.id);
  if (upErr) return { error: "Akun dibuat, tapi gagal mengatur role." };

  revalidatePath("/admin/users", "layout");
  return { success: `Akun ${email} berhasil dibuat.` };
}

/** Ubah role pengguna. Tidak boleh menurunkan role admin itu sendiri. */
export async function updateUserRoleAction(input: {
  userId: string;
  role: UserRole;
}) {
  const { id: currentId } = await requireAdmin();
  if (input.userId === currentId && input.role !== "admin") {
    return { error: "Anda tidak bisa menurunkan role akun sendiri." };
  }
  if (!["masyarakat", "petugas", "pimpinan", "admin"].includes(input.role)) {
    return { error: "Role tidak valid." };
  }

  const admin = await createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ role: input.role })
    .eq("id", input.userId);
  if (error) return { error: firstError(error) ?? "Gagal mengubah role." };

  revalidatePath("/admin/users", "layout");
  return { success: "Role akun diperbarui." };
}

/** Aktif/nonaktifkan akun (soft-toggle; data aduan tetap utuh). */
export async function toggleUserActiveAction(input: {
  userId: string;
  isActive: boolean;
}) {
  const { id: currentId } = await requireAdmin();
  if (input.userId === currentId && !input.isActive) {
    return { error: "Anda tidak bisa menonaktifkan akun sendiri." };
  }

  const admin = await createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ is_active: input.isActive })
    .eq("id", input.userId);
  if (error) return { error: firstError(error) ?? "Gagal memperbarui status." };

  revalidatePath("/admin/users", "layout");
  return {
    success: input.isActive ? "Akun diaktifkan kembali." : "Akun dinonaktifkan.",
  };
}

/**
 * Hapus akun PERMANEN (hard-delete auth.users). Cascade DB menghapus
 * profiles + seluruh aduan/riwayat milik user. Tak bisa menghapus diri sendiri.
 */
export async function deleteUserAction(input: { userId: string }) {
  const { id: currentId } = await requireAdmin();
  if (input.userId === currentId) {
    return { error: "Tidak bisa menghapus akun sendiri." };
  }

  const admin = await createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(input.userId);
  if (error) {
    console.error("deleteUserAction error:", error);
    return { error: firstError(error) ?? "Gagal menghapus akun." };
  }

  // ponytail: file foto di bucket complaint-photos milik user tak dibersihkan;
  // tambah cleanup storage bila sampah terakumulasi.
  revalidatePath("/admin/users", "layout");
  return { success: "Akun dihapus permanen." };
}

/** Reset sandi akun (admin menetapkan sandi baru). */
export async function resetUserPasswordAction(input: {
  userId: string;
  password: string;
}) {
  await requireAdmin();
  if (input.password.length < 6) {
    return { error: "Sandi baru minimal 6 karakter." };
  }

  const admin = await createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(input.userId, {
    password: input.password,
  });
  if (error) return { error: firstError(error) ?? "Gagal mereset sandi." };

  revalidatePath("/admin/users", "layout");
  return { success: "Sandi akun berhasil diganti." };
}

// ------------------------------------------------------------------
// FR-18 — DATA MASTER: KATEGORI
// ------------------------------------------------------------------

/** Simpan kategori baru / perbarui yang ada. Slug unik. */
export async function saveCategoryAction(input: {
  id?: string;
  slug: string;
  name: string;
  icon: string;
  description?: string;
  color?: string;
  isActive: boolean;
}) {
  await requireAdmin();
  const slug = input.slug.trim().toLowerCase();
  const name = input.name.trim();
  if (!slug || !name) return { error: "Slug dan nama kategori wajib diisi." };

  const supabase = await createClient();
  const payload = {
    slug,
    name,
    icon: input.icon.trim() || null,
    description: input.description?.trim() || null,
    color: input.color?.trim() || null,
    is_active: input.isActive,
  };

  if (input.id) {
    const { error } = await supabase
      .from("categories")
      .update(payload)
      .eq("id", input.id);
    if (error) return { error: firstError(error) ?? "Gagal menyimpan kategori." };
  } else {
    const { error } = await supabase.from("categories").insert(payload);
    if (error) return { error: firstError(error) ?? "Gagal menyimpan kategori." };
  }

  revalidatePath("/admin/master", "layout");
  revalidatePath("/masyarakat/baru", "layout");
  return { success: "Kategori disimpan." };
}

export async function toggleCategoryAction(input: {
  categoryId: string;
  isActive: boolean;
}) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ is_active: input.isActive })
    .eq("id", input.categoryId);
  if (error) return { error: firstError(error) ?? "Gagal memperbarui status." };

  revalidatePath("/admin/master", "layout");
  revalidatePath("/masyarakat/baru", "layout");
  return {
    success: input.isActive ? "Kategori diaktifkan." : "Kategori dinonaktifkan.",
  };
}

// ------------------------------------------------------------------
// FR-18 — DATA MASTER: PELAKSANA
// ------------------------------------------------------------------

export async function saveExecutorAction(input: {
  id?: string;
  name: string;
  categoryId?: string | null;
  isActive: boolean;
}) {
  await requireAdmin();
  const name = input.name.trim();
  if (name.length < 3) {
    return { error: "Nama pelaksana minimal 3 karakter." };
  }

  const supabase = await createClient();
  const payload = {
    name,
    category_id: input.categoryId?.trim() || null,
    is_active: input.isActive,
  };

  if (input.id) {
    const { error } = await supabase
      .from("executors")
      .update(payload)
      .eq("id", input.id);
    if (error) return { error: firstError(error) ?? "Gagal menyimpan pelaksana." };
  } else {
    const { error } = await supabase.from("executors").insert(payload);
    if (error) return { error: firstError(error) ?? "Gagal menyimpan pelaksana." };
  }

  revalidatePath("/admin/master", "layout");
  return { success: "Pelaksana disimpan." };
}

export async function toggleExecutorAction(input: {
  executorId: string;
  isActive: boolean;
}) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("executors")
    .update({ is_active: input.isActive })
    .eq("id", input.executorId);
  if (error) return { error: firstError(error) ?? "Gagal memperbarui status." };

  revalidatePath("/admin/master", "layout");
  return {
    success: input.isActive
      ? "Pelaksana diaktifkan."
      : "Pelaksana dinonaktifkan.",
  };
}

// ------------------------------------------------------------------
// FR-18 — PENGATURAN SITUS
// ------------------------------------------------------------------

/**
 * Upload logo situs ke bucket "site-assets". Dipakai service-role (bypass
 * RLS) sehingga cukup role admin (requireAdmin) — RLS storage opsional.
 * Menerima FormData berisi file. Mengembalikan nama file di bucket.
 */
export async function uploadLogoAction(
  formData: FormData
): Promise<{ path?: string; error?: string }> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "File logo tidak ditemukan." };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "Logo harus berupa gambar (JPG/PNG/WebP/SVG)." };
  }
  if (file.size > 2 * 1024 * 1024) {
    return { error: "Ukuran logo maksimal 2 MB." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const safeExt = ["jpg", "jpeg", "png", "webp", "svg"].includes(ext)
    ? ext
    : "png";
  const fileName = `logo-${Date.now()}.${safeExt}`;

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  // Upload langsung ke REST Storage dengan service-role key. (With raw fetch,
  // bukan client supabase-js — service-role mesti dipresentasikan dari key;
  // client ssr menyuntik sesi user sehingga storage kena RLS 'authenticated'.)
  const res = await fetch(
    `${base}/storage/v1/object/${ASSET_BUCKET}/${fileName}?upsert=true`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        apikey: key!,
        "Content-Type": file.type,
        "x-upsert": "true",
        "cache-control": "31536000",
      },
      body: file,
    }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("uploadLogoAction http", res.status, text);
    return { error: text ? `Gagal mengunggah logo: ${text}` : "Gagal mengunggah logo." };
  }

  return { path: fileName };
}

export async function saveSiteSettingsAction(input: {
  siteName: string;
  tagline?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  logoUrl?: string;
}) {
  await requireAdmin();
  if (!input.siteName.trim()) return { error: "Nama situs wajib diisi." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("site_settings")
    .update({
      site_name: input.siteName.trim(),
      tagline: input.tagline?.trim() || null,
      contact_phone: input.contactPhone?.trim() || null,
      contact_email: input.contactEmail?.trim() || null,
      contact_address: input.contactAddress?.trim() || null,
      logo_url: input.logoUrl ? input.logoUrl.trim() : null,
    })
    .eq("id", 1);
  if (error) return { error: firstError(error) ?? "Gagal menyimpan pengaturan." };

  revalidatePath("/", "layout");
  return { success: "Pengaturan situs disimpan." };
}