import AdminUsers from "@/components/dashboard/AdminUsers";
import { getAdminUserList } from "@/lib/queries";

export const metadata = {
  title: "Kelola Akun — Panel Admin",
};

export default async function AdminUsersPage() {
  const users = await getAdminUserList();
  return (
    <main className="flex-1 pb-16">
      <AdminUsers users={users} />
    </main>
  );
}