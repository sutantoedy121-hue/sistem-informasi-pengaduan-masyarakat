import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PimpinanHeader from "@/components/layout/PimpinanHeader";
import Footer from "@/components/layout/Footer";
import { getSession } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Panel Pimpinan — SIPMA",
  robots: { index: false, follow: false },
};

/**
 * Layout segmen /pimpinan: hanya role pimpinan yang boleh masuk.
 * Warga/petugas/admin dikirim ke panel masing-masing.
 */
export default async function PimpinanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getSession();

  if (!profile) redirect("/login?redirect=/pimpinan");
  if (profile.role === "masyarakat") redirect("/masyarakat");
  if (profile.role === "petugas") redirect("/petugas");
  if (profile.role === "admin") redirect("/admin");

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <PimpinanHeader
        fullName={profile.full_name || "Pimpinan"}
        email={user?.email || ""}
      />
      {children}
      <Footer />
    </div>
  );
}