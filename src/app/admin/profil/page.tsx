import type { Metadata } from "next";
import ProfileSettingsClient from "@/components/profile/ProfileSettingsClient";
import { getSession } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Akun Saya — SIPMA",
  robots: { index: false, follow: false },
};

/** /admin/profil — pengaturan untuk role admin (token masuk via /admin). */
export default async function AdminProfilePage() {
  const { user, profile } = await getSession();
  if (!user || !profile) throw new Error("harus login");

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