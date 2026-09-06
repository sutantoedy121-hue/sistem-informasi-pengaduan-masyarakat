import { BarChart3 } from "lucide-react";
import { getSession, getAllComplaints } from "@/lib/queries";
import { computeStats } from "@/lib/pimpinan/stats";
import PimpinanDashboard from "@/components/dashboard/PimpinanDashboard";

export default async function PimpinanHomePage() {
  const { profile } = await getSession();
  const complaints = await getAllComplaints();
  const stats = computeStats(complaints);

  return (
    <main className="flex-1 pb-16">
      {/* Greeting bar */}
      <div className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute inset-0 bg-glow" />
        <div className="container-page relative py-8">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700">
            <BarChart3 className="h-3.5 w-3.5" />
            Panel Pimpinan
          </p>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Halo, {profile?.full_name?.split(" ")[0] || "Pimpinan"} 👋
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Pantau kinerja penanganan aduan warga Kabupaten Bojonegoro.
          </p>
          {stats.total > 0 && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Tingkat penyelesaian {stats.tingkatPenyelesaian}%
            </p>
          )}
        </div>
      </div>

      <PimpinanDashboard complaints={complaints} stats={stats} />
    </main>
  );
}