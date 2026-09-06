"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { ComplaintStatus, UserRole } from "@/lib/db-types";

export type ActionResult =
  | { error?: string }
  | { success?: string; redirectTo?: string }
  | undefined;

/**
 * Ambil user & pastikan staf (petugas/pimpinan/admin). Guard dipakai semua
 * action di modul petugas. Redirect ke login bila belum login / bukan staf.
 */
async function requireStaff(): Promise<{ id: string } | never> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/petugas");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const role = profile?.role as UserRole | undefined;
  if (role !== "petugas" && role !== "pimpinan" && role !== "admin") {
    redirect("/masyarakat");
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

/** Ambil aduan + data pelapor; null bila tidak ada / RLS menolak. */
async function getComplaintForStaff(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("complaints")
    .select(
      "id, ticket, status, reporter_id, reporter:profiles(full_name, phone)"
    )
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const reporter = Array.isArray(data.reporter)
    ? data.reporter[0]
    : data.reporter;
  return {
    id: data.id,
    ticket: data.ticket,
    status: data.status as ComplaintStatus,
    reporter_id: data.reporter_id as string,
    reporterName: reporter?.full_name ?? null,
  };
}

/** Buat notifikasi baru untuk pelapor (FR-06A). */
async function notifyReporter(
  reporterId: string,
  complaintId: string,
  title: string,
  body: string
) {
  const supabase = await createClient();
  await supabase.from("notifications").insert({
    user_id: reporterId,
    complaint_id: complaintId,
    title,
    body,
  });
}

/**
 * FR-09 — Terima aduan: status diajukan → diterima.
 * Menulis complaint_logs + notifikasi ke pelapor.
 */
export async function acceptComplaintAction(complaintId: string) {
  const { id } = await requireStaff();
  const supabase = await createClient();
  const complaint = await getComplaintForStaff(complaintId);
  if (!complaint) return { error: "Aduan tidak ditemukan." };
  if (complaint.status !== ("diajukan" as ComplaintStatus)) {
    return { error: "Hanya aduan berstatus Diajukan yang bisa diterima." };
  }

  const { error } = await supabase
    .from("complaints")
    .update({
      status: "diterima" as ComplaintStatus,
      accepted_at: new Date().toISOString(),
    })
    .eq("id", complaintId);
  if (firstError(error)) return { error: firstError(error) };

  await supabase.from("complaint_logs").insert({
    complaint_id: complaintId,
    actor_id: id,
    action: "accepted",
    status_from: "diajukan",
    status_to: "diterima",
    description: "Aduan diterima oleh petugas",
  });
  await notifyReporter(
    complaint.reporter_id,
    complaintId,
    "Aduan Diterima",
    `Aduan nomor ${complaint.ticket} telah diterima dan siap ditindaklanjuti.`
  );

  return { success: "Aduan berhasil diterima." };
}

/**
 * FR-09 — Tolak aduan: status diajukan → ditolak (wajib alasan).
 * Menulis complaint_logs + notifikasi ke pelapor.
 */
export async function rejectComplaintAction(
  complaintId: string,
  reason: string
) {
  const { id } = await requireStaff();
  const cleanReason = reason.trim();
  if (cleanReason.length < 10) {
    return { error: "Alasan penolakan minimal 10 karakter." };
  }

  const supabase = await createClient();
  const complaint = await getComplaintForStaff(complaintId);
  if (!complaint) return { error: "Aduan tidak ditemukan." };
  if (complaint.status !== ("diajukan" as ComplaintStatus)) {
    return { error: "Hanya aduan berstatus Diajukan yang bisa ditolak." };
  }

  const { error } = await supabase
    .from("complaints")
    .update({ status: "ditolak" as ComplaintStatus })
    .eq("id", complaintId);
  if (firstError(error)) return { error: firstError(error) };

  await supabase.from("complaint_logs").insert({
    complaint_id: complaintId,
    actor_id: id,
    action: "rejected",
    status_from: "diajukan",
    status_to: "ditolak",
    description: "Aduan ditolak oleh petugas",
    result: cleanReason,
  });
  await notifyReporter(
    complaint.reporter_id,
    complaintId,
    "Aduan Ditolak",
    `Aduan nomor ${complaint.ticket} ditolak. Alasan: ${cleanReason}`
  );

  return { success: "Aduan ditolak." };
}

/**
 * FR-10 — Tugaskan aduan ke pelaksana + set status → diproses.
 * Bisa memilih pelaksana dari daftar (executorId) ATAU mengetik manual
 * (executorName); nama manual disimpan sebagai pelaksana baru dulu.
 * (Bila aduan belum diterima, status tetap lanjut ke diproses.)
 * Menulis complaint_logs + notifikasi ke pelapor.
 */
export async function assignComplaintAction(input: {
  complaintId: string;
  executorId?: string;
  executorName?: string;
  note?: string;
}) {
  const { id } = await requireStaff();
  const executorId = input.executorId?.trim() || "";
  const executorName = input.executorName?.trim() || "";
  const note = input.note?.trim() || undefined;

  if (!executorId && !executorName) {
    return { error: "Pilih atau ketik nama pelaksana terlebih dahulu." };
  }
  if (executorName.length > 0 && executorName.length < 3) {
    return { error: "Nama pelaksana manual minimal 3 karakter." };
  }

  const supabase = await createClient();
  const complaint = await getComplaintForStaff(input.complaintId);
  if (!complaint) return { error: "Aduan tidak ditemukan." };

  let targetId: string;
  let resolvedName: string;

  if (executorId) {
    // Pelaksana dari daftar
    const { data: executor } = await supabase
      .from("executors")
      .select("name")
      .eq("id", executorId)
      .maybeSingle();
    if (!executor) return { error: "Pelaksana tidak ditemukan." };
    targetId = executorId;
    resolvedName = executor.name;
  } else {
    // Pelaksana ketik manual → buat baris baru di tabel executors
    const { data: created, error: insErr } = await supabase
      .from("executors")
      .insert({ name: executorName })
      .select("id")
      .single();
    if (insErr || !created) {
      return { error: firstError(insErr) ?? "Gagal menyimpan pelaksana baru." };
    }
    targetId = created.id;
    resolvedName = executorName;
  }

  const { error } = await supabase
    .from("complaints")
    .update({
      executor_id: targetId,
      status: "diproses" as ComplaintStatus,
    })
    .eq("id", input.complaintId);
  if (firstError(error)) return { error: firstError(error) };

  await supabase.from("complaint_logs").insert({
    complaint_id: input.complaintId,
    actor_id: id,
    action: "assigned",
    status_to: "diproses" as ComplaintStatus,
    description: "Aduan ditugaskan kepada pelaksana",
    result: note || resolvedName,
  });
  await notifyReporter(
    complaint.reporter_id,
    input.complaintId,
    "Aduan Sedang Diproses",
    `Aduan nomor ${complaint.ticket} diteruskan ke ${resolvedName} dan sedang diproses.`
  );

  return { success: "Aduan berhasil ditugaskan ke pelaksana." };
}

/**
 * FR-11 — Catat tindak lanjut/progres. Opsional dr gayain foto bukti.
 * Status aduan dipindah ke diproses bila masih diajukan/diterima.
 * Menulis complaint_logs + notifikasi ke pelapor.
 */
export async function progressComplaintAction(input: {
  complaintId: string;
  description: string;
  photoUrl?: string | null;
}) {
  const { id } = await requireStaff();
  const description = input.description.trim();
  if (description.length < 10) {
    return { error: "Uraian tindak lanjut minimal 10 karakter." };
  }

  const supabase = await createClient();
  const complaint = await getComplaintForStaff(input.complaintId);
  if (!complaint) return { error: "Aduan tidak ditemukan." };

  const nextStatus:
    | ComplaintStatus
    | undefined =
    complaint.status === "diajukan" || complaint.status === "diterima"
      ? "diproses"
      : undefined;

  if (nextStatus) {
    const { error } = await supabase
      .from("complaints")
      .update({ status: nextStatus })
      .eq("id", input.complaintId);
    if (firstError(error)) return { error: firstError(error) };
  }

  await supabase.from("complaint_logs").insert({
    complaint_id: input.complaintId,
    actor_id: id,
    action: "progress",
    status_to: nextStatus,
    description,
    photo_url: input.photoUrl?.trim() || null,
  });
  await notifyReporter(
    complaint.reporter_id,
    input.complaintId,
    "Ada Perkembangan Baru",
    `Aduan nomor ${complaint.ticket} mendapatkan pembaruan dari petugas.`
  );

  return { success: "Tindak lanjut berhasil dicatat." };
}

/**
 * Selesai — status → selesai (bisa dari diterima/diproses).
 * Opsional foto bukti hasil. Menulis complaint_logs + notifikasi ke pelapor.
 */
export async function completeComplaintAction(input: {
  complaintId: string;
  note: string;
  photoUrl?: string | null;
}) {
  const { id } = await requireStaff();
  const note = input.note.trim();
  if (note.length < 10) {
    return { error: "Ringkasan hasil penanganan minimal 10 karakter." };
  }

  const supabase = await createClient();
  const complaint = await getComplaintForStaff(input.complaintId);
  if (!complaint) return { error: "Aduan tidak ditemukan." };
  if (complaint.status === "selesai") {
    return { error: "Aduan ini sudah berstatus Selesai." };
  }

  const { error } = await supabase
    .from("complaints")
    .update({
      status: "selesai" as ComplaintStatus,
      completed_at: new Date().toISOString(),
    })
    .eq("id", input.complaintId);
  if (firstError(error)) return { error: firstError(error) };

  await supabase.from("complaint_logs").insert({
    complaint_id: input.complaintId,
    actor_id: id,
    action: "completed",
    status_to: "selesai" as ComplaintStatus,
    description: "Penanganan aduan selesai",
    result: note,
    photo_url: input.photoUrl?.trim() || null,
  });
  await notifyReporter(
    complaint.reporter_id,
    input.complaintId,
    "Aduan Selesai",
    `Aduan nomor ${complaint.ticket} telah selesai ditangani. Silakan beri penilaian.`
  );

  return { success: "Aduan ditandai selesai." };
}