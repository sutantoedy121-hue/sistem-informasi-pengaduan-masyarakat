import AdminLoginLogs from "@/components/dashboard/AdminLoginLogs";
import { getAdminLoginLogs, getAdminUserList } from "@/lib/queries";

export const metadata = {
  title: "Riwayat Login — Panel Admin",
};

export default async function AdminLoginLogsPage() {
  const [logs, users] = await Promise.all([getAdminLoginLogs(), getAdminUserList()]);
  return (
    <main className="flex-1 pb-16">
      <AdminLoginLogs logs={logs} users={users} />
    </main>
  );
}