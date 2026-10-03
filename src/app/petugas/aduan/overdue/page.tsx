import { getAllComplaints } from "@/lib/queries";
import StaffComplaintsList from "@/components/dashboard/StaffComplaintsList";
import { AlertTriangle, Clock } from "lucide-react";

export const metadata = {
  title: "Aduan Perlu Atensi (>7 Hari) — Panel Petugas",
};

export default async function PetugasOverduePage() {
  const all = await getAllComplaints();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const overdue = all.filter(
    (c) =>
      c.status === "diajukan" &&
      Date.now() - new Date(c.created_at).getTime() >= SEVEN_DAYS_MS
  );

  return (
    <main className="flex-1 pb-16">
      <div className="container-page pt-6">
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/70 p-4 text-sm text-red-900 shadow-soft">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-red-950">
              Antrean Prioritas: Laporan Belum Direspon &gt; 1 Minggu
            </h2>
            <p className="mt-0.5 text-xs text-red-800">
              Daftar aduan warga berstatus <b>Diajukan</b> yang telah melebihi batas SLA 7 hari kerja.
              Segera verifikasi atau tindak lanjuti laporan di bawah ini.
            </p>
          </div>
        </div>
      </div>
      <StaffComplaintsList complaints={overdue} />
    </main>
  );
}