"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { ComplaintStatus } from "@/lib/db-types";

export type ActionResult =
  | { error?: string }
  | { success?: string; redirectTo?: string }
  | undefined;

/** Ambil user & pastikan sudah login. Guard dipakai semua action di modul ini. */
async function requireAuth(): Promise<{ id: string } | never> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/masyarakat");
  return { id: user.id };
}

function firstError(error: { message: string } | null): string | undefined {
  if (!error) return undefined;
  if (/duplicate|already/i.test(error.message)) {
    return "Data sudah ada. Coba periksa kembali.";
  }
  return "Terjadi kesalahan pada server. Silakan coba lagi.";
}

/**
 * FR-03 — Buat aduan baru (Server Action tanpa foto, dipakai kalau upload
 * jalan duluan / file disimpan lewat komponen). Return ID aduan supaya
 * halaman "berhasil" bisa menampilkan nomor tiket.
 */
export async function submitComplaintAction(input: {
  categoryId: string;
  categoryNote?: string;
  title: string;
  description: string;
  location?: string;
  locationDetail?: string;
  regionId?: string;
  lat?: number | null;
  lng?: number | null;
  photoUrl?: string;
}) {
  const { id } = await requireAuth();
  const supabase = await createClient();

  const title = input.title.trim();
  const description = input.description.trim();
  const location = input.location?.trim() || null;
  const regionId = input.regionId?.trim() || null;
  const categoryId = input.categoryId.trim();
  const categoryNote = input.categoryNote?.trim() || null;

  // Validasi koordinat opsional: keduanya harus ada + dalam rentang.
  let lat: number | null = null;
  let lng: number | null = null;
  if (input.lat != null && input.lng != null) {
    lat = Number(input.lat);
    lng = Number(input.lng);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) lat = null;
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) lng = null;
  }

  if (!title || !description) {
    return { error: "Judul dan deskripsi aduan wajib diisi." };
  }
  if (!categoryId) {
    return { error: "Pilih kategori aduan terlebih dahulu." };
  }
  if (title.length > 120) {
    return { error: "Judul aduan maksimal 120 karakter." };
  }
  if (description.length > 2000) {
    return { error: "Deskripsi aduan maksimal 2000 karakter." };
  }
  // Kategori "Lainnya" wajib disertai catatan jenis keluhan.
  const { data: chosenCategory } = await supabase
    .from("categories")
    .select("slug")
    .eq("id", categoryId)
    .maybeSingle();
  if (chosenCategory?.slug === "lainnya" && !categoryNote) {
    return { error: "Tuliskan jenis keluhan (mis. Kabel Putus) untuk kategori Lainnya." };
  }
  if (categoryNote && categoryNote.length > 200) {
    return { error: "Catatan kategori maksimal 200 karakter." };
  }

  const { data, error } = await supabase
    .from("complaints")
    .insert({
      reporter_id: id,
      category_id: categoryId,
      region_id: regionId,
      title,
      description,
      location,
      location_detail: input.locationDetail?.trim() || null,
      category_note: categoryNote,
      lat,
      lng,
      photo_url: input.photoUrl?.trim() || null,
    })
    .select("id, ticket")
    .single();

  const errMsg = firstError(error);
  if (errMsg) return { error: errMsg };
  if (!data) return { error: "Aduan gagal dibuat. Silakan coba lagi." };

  return { success: "Aduan berhasil diajukan.", redirectTo: `/masyarakat/berhasil/${data.id}` };
}

/**
 * FR-06 — Konfirmasi penilaian penanganan selesai.
 * Hanya pelapor sendiri; hanya jika status aduan = selesai & belum dinilai.
 */
export async function rateComplaintAction(
  complaintId: string,
  rating: number,
  note: string
) {
  const { id } = await requireAuth();
  if (rating < 1 || rating > 5) {
    return { error: "Nilai penilaian harus antara 1 sampai 5." };
  }

  const supabase = await createClient();
  const { data: complaint, error: fetchErr } = await supabase
    .from("complaints")
    .select("reporter_id, status, rating")
    .eq("id", complaintId)
    .maybeSingle();

  if (fetchErr || !complaint) return { error: "Aduan tidak ditemukan." };
  if (complaint.reporter_id !== id) {
    return { error: "Kamu tidak berhak menilai aduan ini." };
  }
  if (complaint.status !== ("selesai" as ComplaintStatus)) {
    return { error: "Aduan belum selesai, belum bisa dinilai." };
  }
  if (complaint.rating != null) {
    return { error: "Aduan ini sudah pernah dinilai." };
  }

  const { error } = await supabase
    .from("complaints")
    .update({ rating, rating_note: note.trim() || null })
    .eq("id", complaintId);
  const errMsg = firstError(error);
  if (errMsg) return { error: errMsg };

  // Catat aksi penilaian ke log riwayat
  await supabase.from("complaint_logs").insert({
    complaint_id: complaintId,
    actor_id: id,
    action: "rated",
    status_to: "selesai",
    description: `Warga memberi penilaian ${rating} dari 5`,
    result: note.trim() || null,
  });

  return { success: "Terima kasih atas penilaianmu!" };
}

/**
 * FR-publik — Lacak aduan lewat nomor tiket (beranda). Mengembalikan
 * ringkasan publik (tanpa data reporter sensitif) untuk ditampilkan tanpa login.
 */
export async function trackComplaintAction(
  ticket: string
): Promise<
  | { ok: false; error: string }
  | {
      ok: true;
      data: {
        ticket: string;
        title: string;
        description: string;
        location: string | null;
        lat: number | null;
        lng: number | null;
        status: string;
        category: { name: string } | null;
      };
    }
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("complaints")
    .select("id, ticket, title, description, location, lat, lng, status, category:categories(name)")
    .eq("ticket", ticket.trim().toUpperCase())
    .maybeSingle();
  if (error || !data) {
    return { ok: false, error: "Nomor tiket tidak ditemukan atau sedang diproses." };
  }
  // Relasi to-one → objek tunggal; tetap tangani fallback bila berupa array.
  const cat = Array.isArray(data.category) ? data.category[0] : data.category;
  const categoryName = cat?.name ?? null;
  return {
    ok: true,
    data: {
      ticket: data.ticket,
      title: data.title,
      description: data.description,
      location: data.location,
      lat: data.lat,
      lng: data.lng,
      status: data.status,
      category: categoryName ? { name: categoryName } : null,
    },
  };
}

/** Tandai semua notifikasi user sudah dibaca. */
export async function markNotificationsReadAction() {
  await requireAuth();
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("is_read", false);
}
