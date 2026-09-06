import Link from "next/link";
import { CheckCircle2, ArrowRight, FileText } from "lucide-react";
import { getComplaintDetail, getSession } from "@/lib/queries";
import { categoryLabel } from "@/lib/utils";
import CopyTicketButton from "@/components/dashboard/CopyTicketButton";

interface Props {
  params: { id: string };
}

export const metadata = {
  title: "Aduan Terkirim — SIPMA",
};

/**
 * Konfirmasi aduan berhasil diajukan (FR-04). Menampilkan nomor tiket yang
 * dihasilkan trigger, plus tautan ke halaman detail untuk memantau progres.
 * Server component: detail dibaca langsung dari DB memakai id milik user.
 */
export default async function BerhasilAduanPage({ params }: Props) {
  const { user, profile } = await getSession();
  const complaint = await getComplaintDetail(params.id);

  if (!complaint || complaint.reporter_id !== user?.id) {
    return (
      <main className="flex-1">
        <div className="container-page py-16">
          <div className="card mx-auto max-w-lg p-8 text-center">
            <FileText className="mx-auto h-10 w-10 text-ink-faint" />
            <h1 className="mt-4 text-xl font-bold text-ink">
              Aduan tidak ditemukan
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              Nomor aduan ini tidak dikenali. Kembali ke daftar aduanmu.
            </p>
            <Link href="/masyarakat/aduan" className="btn-primary mt-6">
              Lihat Aduan Saya
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 pb-20">
      <div className="container-page py-10">
        <div className="mx-auto max-w-2xl">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-100 text-accent-600">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              Aduan Berhasil Diajukan
            </h1>
            <p className="mt-2 text-sm text-ink-muted sm:text-base">
              Terima kasih, {profile?.full_name?.split(" ")[0] || "Warga"}.
              Simpan nomor tiket berikut sebagai bukti resmi aduanmu.
            </p>
          </div>

          {/* Ticket */}
          <div className="card mt-8 overflow-hidden shadow-card">
            <div className="flex items-center justify-between gap-4 border-b border-dashed border-slate-200 bg-brand-600 px-6 py-6 text-white">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-brand-200">
                  No. Tiket
                </p>
                <p className="mt-1 font-mono text-lg font-bold tracking-wide break-all sm:text-2xl">
                  {complaint.ticket}
                </p>
              </div>
              <CopyTicketButton ticket={complaint.ticket} onDark />
            </div>
            <dl className="grid gap-x-6 gap-y-4 px-6 py-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-ink-faint">Judul</dt>
                <dd className="mt-0.5 text-sm font-semibold text-ink">
                  {complaint.title}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-ink-faint">Kategori</dt>
                <dd className="mt-0.5 text-sm font-semibold text-ink">
                  {categoryLabel(complaint.category, complaint.category_note)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-ink-faint">Status</dt>
                <dd className="mt-0.5 text-sm font-semibold text-ink">
                  Diajukan
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-ink-faint">
                  Dibuat Pada
                </dt>
                <dd className="mt-0.5 text-sm font-semibold text-ink">
                  {new Intl.DateTimeFormat("id-ID", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(complaint.created_at))}
                </dd>
              </div>
            </dl>
          </div>

          {/* Info lanjutan */}
          <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50/50 p-5 text-sm text-ink-soft">
            <p>
              Aduanmu akan ditindaklanjuti petugas <strong>paling lambat 1×24 jam</strong>.
              Pantau perkembangan status kapan saja lewat halaman detail, atau gunakan
              nomor tiket di atas di beranda SIPMA.
            </p>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
            <Link href="/masyarakat/aduan" className="btn-secondary">
              Ke Daftar Aduan
            </Link>
            <Link href={`/masyarakat/aduan/${complaint.id}`} className="btn-primary">
              Lihat Detail Progres
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
