import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  FileText,
  Star,
} from "lucide-react";
import { notFound } from "next/navigation";
import {
  getComplaintDetail,
  getComplaintLogs,
  getSession,
} from "@/lib/queries";
import { getPhotoUrl } from "@/lib/storage";
import { formatDateID, formatDateTimeID, categoryLabel } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";
import ComplaintTimeline from "@/components/dashboard/ComplaintTimeline";
import RatingSection from "@/components/dashboard/RatingSection";
import CopyTicketButton from "@/components/dashboard/CopyTicketButton";
import ReportActions from "@/components/dashboard/ReportActions";
import ReportSection from "@/components/dashboard/ReportSection";

interface Props {
  params: { id: string };
}

export const metadata = {
  title: "Detail Aduan — SIPMA",
};

const STATUS_STEP: Record<string, number> = {
  diajukan: 1,
  diterima: 2,
  ditolak: -1,
  diproses: 3,
  selesai: 4,
};

const PROGRESS_STEPS = ["Diajukan", "Diterima", "Diproses", "Selesai"];

export default async function DetailAduanPage({ params }: Props) {
  const { user } = await getSession();
  const complaint = await getComplaintDetail(params.id);
  if (!complaint) notFound();
  if (complaint.reporter_id !== user?.id) notFound(); // hanya pelapor & staf

  const logs = await getComplaintLogs(complaint.id);
  const photo = getPhotoUrl(complaint.photo_url);
  const canRate =
    complaint.status === "selesai" && complaint.rating == null;
  const step = STATUS_STEP[complaint.status] ?? 0;

  return (
    <main className="flex-1 pb-20">
      <div className="container-page py-8">
        <div className="mx-auto max-w-4xl">
          {/* Back + header */}
          <Link
            href="/masyarakat/aduan"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-brand-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Aduan Saya
          </Link>

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
            <StatusBadge status={complaint.status} className="shrink-0 self-start sm:self-auto" />
          </div>

          {/* Aksi laporan (cetak/PDF & unduh Excel) */}
          <div className="no-print mt-4 flex flex-wrap gap-2">
            <ReportActions complaint={complaint} logs={logs} className="flex-row justify-start" />
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

              {/* Progres */}
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
                    <MapPin className="h-4 w-4 text-brand-600" />
                    Progres Penanganan
                  </h2>
                  {complaint.rating && (
                    <span className="badge bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                      {complaint.rating}/5
                    </span>
                  )}
                </div>
                <ComplaintTimeline logs={logs} />
              </div>

              {/* Rating */}
              {(canRate || complaint.rating != null) && (
                <RatingSection
                  complaintId={complaint.id}
                  alreadyRated={complaint.rating != null}
                />
              )}
            </div>

            {/* Sidebar info */}
            <aside className="space-y-6">
              <div className="card overflow-hidden">
                {/* Progress tracker */}
                {step > 0 ? (
                  <div className="p-6">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-ink-faint">
                      Alur Status
                    </h3>
                    <ol className="mt-4 space-y-4">
                      {PROGRESS_STEPS.map((label, i) => {
                        const done = step > i + 1;
                        const current = step === i + 1;
                        const skipped =
                          complaint.status === "ditolak" && i >= 1;
                        return (
                          <li key={label} className="flex items-center gap-3">
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${
                                skipped
                                  ? "bg-slate-100 text-slate-400"
                                  : done || current
                                    ? "bg-brand-600 text-white ring-4 ring-brand-100"
                                    : "bg-slate-100 text-slate-400"
                              }`}
                            >
                              {done ? "✓" : current ? "•" : ""}
                            </span>
                            <span
                              className={`text-sm ${
                                current
                                  ? "font-semibold text-ink"
                                  : done
                                    ? "font-medium text-ink"
                                    : "text-ink-faint"
                              }`}
                            >
                              {label}
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                    {complaint.status === "ditolak" && (
                      <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
                        Aduan ditolak petugas. Lihat alasan pada riwayat di bawah.
                      </p>
                    )}
                  </div>
                ) : null}

                {/* Info */}
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
                        <dt className="flex items-center gap-1.5 text-ink-muted">
                          <User className="h-3.5 w-3.5" />
                          Detail Lokasi
                        </dt>
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

              {/* Kutipan penilaian */}
              {complaint.rating_note && (
                <div className="card p-5">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-faint">
                    <Star className="h-3.5 w-3.5 text-amber-400" />
                    Catatan penilaianmu
                  </h3>
                  <p className="mt-2 text-sm italic text-ink-soft">
                    “{complaint.rating_note}”
                  </p>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>

      {/* Panel cetak: hanya tampil saat print */}
      <ReportSection complaint={complaint} logs={logs} />
    </main>
  );
}
