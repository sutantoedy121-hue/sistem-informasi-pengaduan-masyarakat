import { getAllComplaints } from "@/lib/queries";
import StaffComplaintsList from "@/components/dashboard/StaffComplaintsList";

export default async function PetugasAduanListPage() {
  const complaints = await getAllComplaints();

  return (
    <main className="flex-1 pb-16">
      <StaffComplaintsList complaints={complaints} />
    </main>
  );
}