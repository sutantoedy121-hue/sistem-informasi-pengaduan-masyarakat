import AdminSettings from "@/components/dashboard/AdminSettings";
import { getSiteSettings, getAllComplaints } from "@/lib/queries";

export const metadata = {
  title: "Pengaturan Situs — Panel Admin",
};

export default async function AdminSettingsPage() {
  const [settings, complaints] = await Promise.all([
    getSiteSettings(),
    getAllComplaints(),
  ]);

  // Hanya aduan yang selesai dan memiliki foto yang relevan untuk dipilih
  const completedComplaints = complaints.filter(
    (c) => (c.status === "selesai" || c.status === "diproses") && Boolean(c.photo_url)
  );

  return (
    <main className="flex-1 pb-16">
      <AdminSettings
        settings={settings}
        availableComplaints={completedComplaints}
      />
    </main>
  );
}