import type { Metadata } from "next";
import { redirect } from "next/navigation";
import MasyarakatHeader from "@/components/layout/MasyarakatHeader";
import Footer from "@/components/layout/Footer";
import { getSession } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Dashboard Masyarakat — SIPMA",
  robots: { index: false, follow: false },
};

/**
 * Layout segmen /masyarakat: semua halaman di sini butuh login & role
 * masyarakat. Header dashboard dirender di sini sekali.
 */
export default async function MasyarakatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getSession();

  // Belum login → middleware sudah arahkan ke /login. Role staf tidak punya
  // akses dashboard warga → pulangkan ke halaman masing-masing.
  if (!profile) redirect("/login?redirect=/masyarakat");
  if (profile.role !== "masyarakat") {
    if (profile.role === "petugas") redirect("/petugas");
    if (profile.role === "pimpinan") redirect("/pimpinan");
    if (profile.role === "admin") redirect("/admin");
    redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <MasyarakatHeader
        fullName={profile.full_name || "Warga"}
        email={user?.email || ""}
      />
      {children}
      <Footer />
    </div>
  );
}
