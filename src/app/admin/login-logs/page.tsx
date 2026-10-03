import AdminLoginLogs from "@/components/dashboard/AdminLoginLogs";
import { getAdminLoginLogs, getAdminUserList, getBlockedIps } from "@/lib/queries";

export const metadata = {
  title: "Keamanan & Log — Panel Super Admin",
};

export default async function AdminLoginLogsPage() {
  const [logs, users, blockedIps] = await Promise.all([
    getAdminLoginLogs(),
    getAdminUserList(),
    getBlockedIps(),
  ]);
  return (
    <main className="flex-1 pb-16">
      <AdminLoginLogs logs={logs} users={users} blockedIps={blockedIps} />
    </main>
  );
}