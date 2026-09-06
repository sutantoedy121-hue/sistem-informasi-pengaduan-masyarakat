import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ProfileSettingsClient from "@/components/profile/ProfileSettingsClient";
import { getSession } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Pengaturan Profil — SIPMA",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Halaman pengaturan profil — memakai satu route /profil untuk semua role.
 * Middleware tak melindungi /profil (bukan panel), jadi guard di sini:
 * belum login → ke /login; sudah login → jalankan client yang menyesuaikan
 * tombol "kembali" & penampilan per role. Role staf tak bisa pakai /masyarakat/profil.
 */
export default async function ProfilePage() {
  const { user, profile } = await getSession();
  if (!user || !profile) redirect("/login?redirect=/profil");

  return (
    <ProfileSettingsClient
      email={user.email || ""}
      fullName={profile.full_name || ""}
      phone={profile.phone}
      role={profile.role}
      provider={user.providers.includes("google") ? "google" : null}
    />
  );
}