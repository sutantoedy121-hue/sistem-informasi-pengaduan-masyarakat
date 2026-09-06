import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  FileText,
  Phone,
  Star,
} from "lucide-react";
import {
  getComplaintDetail,
  getComplaintLogs,
  getExecutors,
} from "@/lib/queries";
import { getPhotoUrl } from "@/lib/storage";
import { formatDateID, formatDateTimeID, categoryLabel, regionLabel } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";
import ComplaintTimeline from "@/components/dashboard/ComplaintTimeline";
import StaffActions from "@/components/dashboard/StaffActions";
import CopyTicketButton from "@/components/dashboard/CopyTicketButton";
import ReportActions from "@/components/dashboard/ReportActions";
import ReportSection from "@/components/dashboard/ReportSection";

interface Props {
  params: { id: string };
}

export const metadata = {
  title: "Detail Aduan — Panel Petugas",
};

export default async function PetugasDetailAduanPage({ params }: Props) {
  const complaint = await getComplaintDetail(params.id);
  if (!complaint) notFound();

  const logs = await getComplaintLogs(complaint.id);
  const executors = await getExecutors();
  const photo = getPhotoUrl(complaint.photo_url);

  return (
    <main className="flex-1 pb-20">
      <div className="container-page py-8">
        <div className="mx-auto max-w-5xl">
          {/* Back */}
          <Link
            href="/petugas/aduan"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-brand-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Semua Aduan
          </Link>

          {/* Header */}
          <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                {complaint.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="font-mono text-sm text-ink-faint">
                  No. Tiket:{" "}
                  <span className="font-semibold text-ink">{complaint.ticket}</span>
                </span>
                <CopyTicketButton ticket={complaint.ticket} />
              </div>
            </div>
            <StatusBadge
              status={complaint.status}
              className="shrink-0 self-start sm:self-auto"
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {/* Kolom utama */}
            <div className="space-y-6 lg:col-span-2">
              {/* Foto */}
              {photo && (
                <a href={photo} target="_blank" rel="noreferrer">
                  <img
                    src={photo}
                    alt="Foto aduan"
                    className="aspect-video w-full rounded-2xl object-cover shadow-soft ring-1 ring-slate-200"
                  />
                </a>
              )}

              {/* Deskripsi */}
              <div className="card p-6">
                <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
                  <FileText className="h-4 w-4 text-brand-600" />
                  Detail Aduan
                </h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                  {complaint.description}
                </p>
              </div>

              {/* Info pelapor (hanya untuk staf) */}
              <div className="card p-6">
                <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
                  <User className="h-4 w-4 text-brand-600" />
                  Data Pelapor
                </h2>
                <dl className="mt-3 space-y-2.5 text-sm">
                  <div className="flex items-center gap-2 text-ink-muted">
                    <User className="h-3.5 w-3.5" />
                    <span className="w-24 shrink-0 text-ink-faint">Nama</span>
                    <span className="font-medium text-ink">
                      {complaint.reporter?.full_name ?? "Warga"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-ink-muted">
                    <Phone className="h-3.5 w-3.5" />
                    <span className="w-24 shrink-0 text-ink-faint">Telepon</span>
                    <span className="font-medium text-ink">
                      {complaint.reporter?.phone ?? "—"}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-ink-muted">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span className="w-24 shrink-0 text-ink-faint">Wilayah</span>
                    <span className="font-medium text-ink">
                      {regionLabel(complaint.region) ?? "—"}
                    </span>
                  </div>
                </dl>
              </div>

              {/* Progres */}
              <div className="card p-6">
                <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
                  <MapPin className="h-4 w-4 text-brand-600" />
                  Riwayat Penanganan
                </h2>
                {complaint.rating != null && (
                  <span className="badge mt-2 bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    Nilai warga: {complaint.rating}/5
                  </span>
                )}
                <div className="mt-4">
                  <ComplaintTimeline logs={logs} />
                </div>
              </div>
            </div>

            {/* Sidebar info */}
            <aside className="space-y-6">
              {/* Aksi petugas */}
              <div className="card p-5">
                <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
                  <Star className="h-4 w-4 text-brand-600" />
                  Aksi Petugas
                </h2>
                <p className="mt-1 text-xs text-ink-muted">
                  Status saat ini: <b>{statusLabel(complaint.status)}</b>
                </p>
                <div className="mt-4">
                  <StaffActions
                    complaintId={complaint.id}
                    ticket={complaint.ticket}
                    status={complaint.status}
                    executors={executors}
                  />
                </div>
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="mb-2 text-xs font-semibold text-ink-muted">
                    Laporan untuk tim pelaksana
                  </p>
                  <ReportActions complaint={complaint} logs={logs} />
                </div>
              </div>

              {/* Info aduan */}
              <div className="card overflow-hidden">
                <div className="border-t border-slate-100 px-6 py-5">
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="flex items-center gap-1.5 text-ink-muted">
                        <FileText className="h-3.5 w-3.5" />
                        Kategori
                      </dt>
                      <dd className="text-right font-medium text-ink">
                        {categoryLabel(complaint.category, complaint.category_note)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="flex items-center gap-1.5 text-ink-muted">
                        <MapPin className="h-3.5 w-3.5" />
                        Lokasi
                      </dt>
                      <dd className="text-right font-medium text-ink">
                        {complaint.location || "—"}
                        {complaint.lat != null && complaint.lng != null && (
                          <a
                            href={`https://www.google.com/maps?q=${complaint.lat},${complaint.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 block text-xs font-semibold text-brand-600 hover:underline"
                          >
                            Buka di peta →
                          </a>
                        )}
                      </dd>
                    </div>
                    {complaint.location_detail && (
                      <div className="flex justify-between gap-3">
                        <dt className="text-ink-muted">Detail Lokasi</dt>
                        <dd className="text-right font-medium text-ink">
                          {complaint.location_detail}
                        </dd>
                      </div>
                    )}
                    <div className="flex justify-between gap-3">
                      <dt className="flex items-center gap-1.5 text-ink-muted">
                        <Calendar className="h-3.5 w-3.5" />
                        Diajukan
                      </dt>
                      <dd className="text-right font-medium text-ink">
                        {formatDateTimeID(complaint.created_at)}
                      </dd>
                    </div>
                    {complaint.executor?.name && (
                      <div className="flex justify-between gap-3">
                        <dt className="text-ink-muted">Pelaksana</dt>
                        <dd className="text-right font-medium text-ink">
                          {complaint.executor.name}
                        </dd>
                      </div>
                    )}
                    {complaint.target_date && (
                      <div className="flex justify-between gap-3">
                        <dt className="text-ink-muted">Target selesai</dt>
                        <dd className="text-right font-medium text-ink">
                          {formatDateID(complaint.target_date)}
                        </dd>
                      </div>
                    )}
                    {complaint.completed_at && (
                      <div className="flex justify-between gap-3">
                        <dt className="text-ink-muted">Selesai pada</dt>
                        <dd className="text-right font-medium text-ink">
                          {formatDateTimeID(complaint.completed_at)}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Panel cetak: hanya tampil saat print */}
      <ReportSection complaint={complaint} logs={logs} />
    </main>
  );
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    diajukan: "Diajukan",
    diterima: "Diterima",
    diproses: "Diproses",
    selesai: "Selesai",
    ditolak: "Ditolak",
  };
  return map[status] ?? status;
}