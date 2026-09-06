import { getSession, getUserComplaints } from "@/lib/queries";
import ComplaintsList from "@/components/dashboard/ComplaintsList";

export default async function AduanListPage() {
  const { user } = await getSession();
  const complaints = user ? await getUserComplaints(user.id) : [];

  return (
    <main className="flex-1 pb-16">
      <ComplaintsList complaints={complaints} />
    </main>
  );
}
