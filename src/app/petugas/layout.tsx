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
  if (profile.role === "admin") redirect("/admin");

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <PetugasHeader
        fullName={profile.full_name || "Petugas"}
        email={user?.email || ""}
      />
      {children}
      <Footer />
    </div>
  );
}