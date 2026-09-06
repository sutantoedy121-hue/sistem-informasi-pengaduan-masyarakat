"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/db-types";

export type ActionResult =
  | { error?: string }
  | { success?: string; redirectTo?: string }
  | undefined;

/**
 * Ambil user & pastikan role = pimpinan. Guard semua action modul pimpinan.
 * Redirect ke login bila belum login; petugas → /petugas; lain → /masyarakat.
 */
async function requirePimpinan(): Promise<{ id: string } | never> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/pimpinan");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const role = profile?.role as UserRole | undefined;
  if (role !== "pimpinan") {
    if (role === "petugas") redirect("/petugas");
    redirect("/masyarakat");
  }
  return { id: user.id };
}

/**
 * Arahan pimpinan pada sebuah aduan (FR-15/16, monitoring).
 * Disimpan sebagai entri complaint_logs action 'commented' — TIDAK mengubah
 * status aduan. Petugas melihatnya di riwayat penanganan pada panel petugas.
 */
export async function addLeaderNoteAction(complaintId: string, note: string) {
  const { id } = await requirePimpinan();
  const clean = note.trim();
  if (clean.length < 5) {
    return { error: "Arahan minimal 5 karakter." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("complaint_logs").insert({
    complaint_id: complaintId,
    actor_id: id,
    action: "commented",
    status_from: null,
    status_to: null,
    description: null,
    result: clean,
  });
  if (error) {
    return { error: "Terjadi kesalahan pada server. Silakan coba lagi." };
  }

  return { success: "Arahan terkirim ke petugas." };
}