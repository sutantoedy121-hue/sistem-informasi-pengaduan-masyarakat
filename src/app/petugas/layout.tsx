import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PetugasHeader from "@/components/layout/PetugasHeader";
import Footer from "@/components/layout/Footer";
import { getSession } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Panel Petugas — SIPMA",
  robots: { index: false, follow: false },
};

/**
 * Layout segmen /petugas: hanya staf (petugas/pimpinan/admin) yang boleh masuk.
 * Warga tanpa role dikirim kembali ke rancangan masing-masing.
 */
export default async function PetugasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getSession();

  if (!profile) redirect("/login?redirect=/petugas");
  if (profile.role === "masyarakat") redirect("/masyarakat");
  if (profile.role === "pimpinan") redirect("/pimpinan");
  // Super admin diperbolehkan mengakses panel petugas untuk keperluan monitoring & intervensi
  // (if profile.role === "admin" -> diperbolehkan masuk)

  return (
    <div className="flex min-h-screen flex-col bg-transparent relative">
      <PetugasHeader
        fullName={profile.full_name || "Petugas"}
        email={user?.email || ""}
      />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}