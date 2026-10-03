import AdminComplaintsManager from "@/components/dashboard/AdminComplaintsManager";
import { getAllComplaints } from "@/lib/queries";

export const metadata = {
  title: "Kontrol Aduan — Panel Super Admin",
};

export default async function AdminAduanPage() {
  const complaints = await getAllComplaints();
  return (
    <main className="flex-1 pb-16">
      <AdminComplaintsManager initialComplaints={complaints} />
    </main>
  );
}