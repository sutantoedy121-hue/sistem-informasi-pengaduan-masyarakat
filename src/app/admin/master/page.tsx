import AdminMaster from "@/components/dashboard/AdminMaster";
import { getAllCategories, getAllExecutors } from "@/lib/queries";

export const metadata = {
  title: "Data Master — Panel Admin",
};

export default async function AdminMasterPage() {
  const [categories, executors] = await Promise.all([
    getAllCategories(),
    getAllExecutors(),
  ]);
  return (
    <main className="flex-1 pb-16">
      <AdminMaster categories={categories} executors={executors} />
    </main>
  );
}