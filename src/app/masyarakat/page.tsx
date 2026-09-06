import { Home, MapPin } from "lucide-react";
import { getSession, getUserComplaints } from "@/lib/queries";
import DashboardOverview from "@/components/dashboard/DashboardOverview";

export default async function MasyarakatHomePage() {
  const { user, profile } = await getSession();
  const complaints = user ? await getUserComplaints(user.id) : [];

  return (
    <main className="flex-1 pb-16">
      {/* Greeting bar */}
      <div className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute inset-0 bg-glow" />
        <div className="container-page relative py-8">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700">
            <Home className="h-3.5 w-3.5" />
            Dashboard Warga
          </p>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Halo, {profile?.full_name?.split(" ")[0] || "Warga"}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Pantau dan kelola seluruh pengaduan yang kamu sampaikan.
          </p>
          {profile?.address && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-ink-faint">
              <MapPin className="h-3.5 w-3.5" />
              {profile.address}
            </p>
          )}
        </div>
      </div>

      <DashboardOverview complaints={complaints} />
    </main>
  );
}
