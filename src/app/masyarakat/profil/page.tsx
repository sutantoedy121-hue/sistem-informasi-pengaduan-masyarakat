import type { Metadata } from "next";
import ProfileSettingsClient from "@/components/profile/ProfileSettingsClient";
import { getSession } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Pengaturan Profil — SIPMA",
  robots: { index: false, follow: false },
};

/** /masyarakat/profil — halaman pengaturan untuk role masyarakat (token masuk via /masyarakat). */
export default async function MasyarakatProfilePage() {
  const { user, profile } = await getSession();
  if (!user || !profile) throw new Error("harus login");

  return (
    <ProfileSettingsClient
      email={user.email || ""}
      fullName={profile.full_name || ""}
      role={profile.role}
      provider={user.providers.includes("google") ? "google" : null}
    />
  );
}