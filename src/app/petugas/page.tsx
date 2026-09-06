import { ClipboardCheck } from "lucide-react";
import { getSession, getAllComplaints } from "@/lib/queries";
import PetugasDashboard from "@/components/dashboard/PetugasDashboard";

export default async function PetugasHomePage() {
  const { profile } = await getSession();
  const complaints = await getAllComplaints();
  const menunggu = complaints.filter((c) => c.status === "diajukan").length;

  return (
    <main className="flex-1 pb-16">
      {/* Greeting bar */}
      <div className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute inset-0 bg-glow" />
        <div className="container-page relative py-8">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700">
            <ClipboardCheck className="h-3.5 w-3.5" />
            Panel Petugas
          </p>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Halo, {profile?.full_name?.split(" ")[0] || "Petugas"} 👋
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Kelola verifikasi, penugasan, dan tindak lanjut seluruh aduan warga.
          </p>
          {menunggu > 0 && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              {menunggu} aduan menunggu verifikasi
            </p>
          )}
        </div>
      </div>

      <PetugasDashboard complaints={complaints} />
    </main>
  );
}