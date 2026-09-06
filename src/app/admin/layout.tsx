import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminHeader from "@/components/layout/AdminHeader";
import Footer from "@/components/layout/Footer";
import { getSession } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Panel Admin — SIPMA",
  robots: { index: false, follow: false },
};

/**
 * Layout segmen /admin: hanya role admin yang boleh masuk.
 * Warga/petugas/pimpinan dikirim ke panel masing-masing.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getSession();

  if (!profile) redirect("/login?redirect=/admin");
  if (profile.role === "masyarakat") redirect("/masyarakat");
  if (profile.role === "petugas") redirect("/petugas");
  if (profile.role === "pimpinan") redirect("/pimpinan");

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <AdminHeader
        fullName={profile.full_name || "Admin"}
        email={user?.email || ""}
      />
      {children}
      <Footer />
    </div>
  );
}