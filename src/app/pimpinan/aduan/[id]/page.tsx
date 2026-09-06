import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  FileText,
  Phone,
} from "lucide-react";
import {
  getComplaintDetail,
  getComplaintLogs,
} from "@/lib/queries";
import { getPhotoUrl } from "@/lib/storage";
import { formatDateTimeID, categoryLabel, regionLabel } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";
import ComplaintTimeline from "@/components/dashboard/ComplaintTimeline";
import CopyTicketButton from "@/components/dashboard/CopyTicketButton";
import LeaderNote from "@/components/dashboard/LeaderNote";

interface Props {
  params: { id: string };
}

export const metadata = {
  title: "Detail Aduan — Panel Pimpinan",
};

/** Detail aduan read-only untuk pimpinan (monitoring, bukan penanganan). */
export default async function PimpinanDetailAduanPage({ params }: Props) {
  const complaint = await getComplaintDetail(params.id);
  if (!complaint) notFound();

  const logs = await getComplaintLogs(complaint.id);
  const photo = getPhotoUrl(complaint.photo_url);

  return (
    <main className="flex-1 pb-20">
      <div className="container-page py-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/pimpinan"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-brand-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Panel Pimpinan
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
            <StatusBadge
              status={complaint.status}
              className="shrink-0 self-start sm:self-auto"
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {/* Kolom utama */}
            <div className="space-y-6 lg:col-span-2">
              {photo && (
                <a href={photo} target="_blank" rel="noreferrer">
                  <img
                    src={photo}
                    alt="Foto aduan"
                    className="aspect-video w-full rounded-2xl object-cover shadow-soft ring-1 ring-slate-200"
                  />
                </a>
              )}

              <div className="card p-6">
                <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
                  <FileText className="h-4 w-4 text-brand-600" />
                  Detail Aduan
                </h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                  {complaint.description}
                </p>
              </div>

              <div className="card p-6">
                <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
                  <MapPin className="h-4 w-4 text-brand-600" />
                  Riwayat Penanganan
                </h2>
                <div className="mt-4">
                  <ComplaintTimeline logs={logs} />
                </div>
              </div>

              {/* Arahan pimpinan */}
              <div className="card p-6">
                <LeaderNote complaintId={complaint.id} logs={logs} />
              </div>
            </div>

            {/* Sidebar info */}
            <aside className="space-y-6">
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
                        <User className="h-3.5 w-3.5" />
                        Pelapor
                      </dt>
                      <dd className="text-right font-medium text-ink">
                        {complaint.reporter?.full_name ?? "Warga"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="flex items-center gap-1.5 text-ink-muted">
                        <Phone className="h-3.5 w-3.5" />
                        Telepon
                      </dt>
                      <dd className="text-right font-medium text-ink">
                        {complaint.reporter?.phone ?? "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="flex items-center gap-1.5 text-ink-muted">
                        <MapPin className="h-3.5 w-3.5" />
                        Wilayah
                      </dt>
                      <dd className="text-right font-medium text-ink">
                        {regionLabel(complaint.region) ?? "—"}
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
                    {complaint.completed_at && (
                      <div className="flex justify-between gap-3">
                        <dt className="text-ink-muted">Selesai</dt>
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
    </main>
  );
}