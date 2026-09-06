import AdminSettings from "@/components/dashboard/AdminSettings";
import { getSiteSettings } from "@/lib/queries";

export const metadata = {
  title: "Pengaturan Situs — Panel Admin",
};

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();
  return (
    <main className="flex-1 pb-16">
      <AdminSettings settings={settings} />
    </main>
  );
}