"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export type AuthState = {
  error?: string;
  success?: string;
  redirectTo?: string;
} | undefined;

export async function loginAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const redirectPath = String(formData.get("redirect") || "/").trim();

  if (!email || !password) {
    return { error: "Email dan kata sandi wajib diisi." };
  }

  const supabase = await createClient();

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    return { error: "Email atau kata sandi salah. Silakan coba lagi." };
  }

  const userId = authData.user?.id;

  // Cegah akun nonaktif login (FR-17: nonaktifkan akun oleh admin).
  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_active")
      .eq("id", userId)
      .maybeSingle();
    if (profile && profile.is_active === false) {
      await supabase.auth.signOut();
      return { error: "Akun dinonaktifkan. Hubungi admin." };
    }
  }

  // Catat riwayat login (IP + perangkat) untuk panel admin (FR-17).
  // Non-fatal: gagal mencatat tidak menghalangi login.
  try {
    const hdrs = await headers();
    const ip =
      hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      hdrs.get("x-real-ip") ||
      "";
    const ua = hdrs.get("user-agent") || "";
    if (userId) {
      await supabase.from("login_logs").insert({
        user_id: userId,
        email,
        ip_address: ip || null,
        user_agent: ua || null,
      });
    }
  } catch {
    // abaikan
  }

  revalidatePath("/", "layout");

  // Arahkan ke panel sesuai role (default / untuk warga).
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  const homeByRole: Record<string, string> = {
    masyarakat: "/masyarakat",
    petugas: "/petugas",
    pimpinan: "/pimpinan",
    admin: "/admin",
  };
  const roleDefault = profile?.role ? homeByRole[profile.role] : undefined;
  return { redirectTo: roleDefault || redirectPath || "/" };
}

export async function registerAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "").trim();
  const fullName = [
    String(formData.get("firstName") || "").trim(),
    String(formData.get("lastName") || "").trim(),
  ]
    .filter(Boolean)
    .join(" ");
  const phone = String(formData.get("phone") || "").trim() || null;

  if (!email || !password) {
    return { error: "Email dan kata sandi wajib diisi." };
  }
  if (password.length < 6) {
    return { error: "Kata sandi minimal 6 karakter." };
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin") || "";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
        role: "masyarakat",
      },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: "Pendaftaran gagal. Email mungkin sudah terdaftar." };
  }

  // Jika email confirmation aktif, data.user eksis tapi session null.
  if (data.user && !data.session) {
    return {
      success:
        "Pendaftaran berhasil! Cek email kamu untuk verifikasi sebelum masuk.",
    };
  }

  revalidatePath("/", "layout");
  return { redirectTo: "/" };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  return { redirectTo: "/login" };
}

