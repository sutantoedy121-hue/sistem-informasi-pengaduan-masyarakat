import { getActiveCategories, getSession } from "@/lib/queries";
import NewComplaintForm from "@/components/forms/NewComplaintForm";

export const metadata = {
  title: "Buat Aduan Baru — SIPMA",
};

export default async function BuatAduanPage() {
  const { profile } = await getSession();
  const categories = await getActiveCategories();

  return (
    <main className="flex-1 pb-20">
      <div className="container-page py-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Formulir Aduan
              </p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                Sampaikan Aduan Baru
              </h1>
              <p className="mt-1 text-sm text-ink-muted">
                Lengkapi informasi di bawah. Petugas akan memverifikasi aduanmu
                dan kamu akan menerima nomor tiket otomatis.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700 ring-1 ring-accent-200">
              Pengadu: {profile?.full_name?.split(" ")[0] || "Warga"}
            </span>
          </div>

          {categories.length === 0 ? (
            <div className="card mt-6 p-8 text-center text-sm text-ink-muted">
              Kategori aduan belum tersedia. Silakan coba lagi beberapa saat lagi.
            </div>
          ) : (
            <NewComplaintForm categories={categories} />
          )}
        </div>
      </div>
    </main>
  );
}
