import { ShieldCheck } from "lucide-react";
import {
  formatDateID,
  formatDateTimeID,
  categoryLabel,
  regionLabel,
} from "@/lib/utils";
import { getPhotoUrl, getAssetUrl } from "@/lib/storage";
import { getSiteSettings } from "@/lib/queries";
import {
  labelStatus,
  labelAction,
} from "@/lib/report/labels";
import type { ComplaintDetail, ComplaintLogWithActor } from "@/lib/db-types";

interface Props {
  complaint: ComplaintDetail;
  logs: ComplaintLogWithActor[];
}

/**
 * Panel berisi salinan lengkap "Laporan Data Aduan".
 * Tak terlihat di layar (di-hidden via CSS), hanya tampil saat dicetak
 * (window.print dari tombol "Cetak / PDF" di ReportActions).
 * Satu-satunya elemen dengan id #report-print di halaman.
 */
export default async function ReportSection({ complaint: c, logs }: Props) {
  const photo = getPhotoUrl(c.photo_url);
  const region = regionLabel(c.region);
  const printedAt = new Date();
  const settings = await getSiteSettings(); // nama situs + logo untuk kop
  const logoUrl = getAssetUrl(settings?.logo_url);
  const siteName = settings?.site_name || "SIPMA";

  return (
    <div id="report-print" className="hidden">
      {/* Kop */}
      <div className="flex items-start justify-between gap-4 pb-4">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`Logo ${siteName}`}
              className="h-11 w-auto max-w-[140px] object-contain"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
              <ShieldCheck className="h-6 w-6" strokeWidth={2.5} />
            </div>
          )}
          <div>
            <p className="text-lg font-extrabold tracking-tight text-ink">{siteName}</p>
            <p className="text-xs text-ink-muted">Kabupaten Bojonegoro</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-ink">Laporan Data Aduan</p>
          <p className="font-mono text-xs text-ink-muted">No. Tiket: {c.ticket}</p>
        </div>
      </div>

      <hr className="mb-5 border-slate-200" />

      <section className="mb-5">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink">
          Data Aduan
        </h2>
        <dl className="mt-2 text-sm">
          <div className="flex border-b border-slate-100 py-1.5">
            <dt className="w-36 shrink-0 text-ink-muted">Judul</dt>
            <dd className="font-medium text-ink">{c.title}</dd>
          </div>
          <div className="flex border-b border-slate-100 py-1.5">
            <dt className="w-36 shrink-0 text-ink-muted">Status</dt>
            <dd className="font-medium text-ink">{labelStatus(c.status)}</dd>
          </div>
          <div className="flex border-b border-slate-100 py-1.5">
            <dt className="w-36 shrink-0 text-ink-muted">Kategori</dt>
            <dd className="font-medium text-ink">
              {categoryLabel(c.category, c.category_note)}
            </dd>
          </div>
          <div className="flex border-b border-slate-100 py-1.5">
            <dt className="w-36 shrink-0 text-ink-muted">Diajukan</dt>
            <dd className="font-medium text-ink">{formatDateTimeID(c.created_at)}</dd>
          </div>
          {c.accepted_at && (
            <div className="flex border-b border-slate-100 py-1.5">
              <dt className="w-36 shrink-0 text-ink-muted">Diterima</dt>
              <dd className="font-medium text-ink">{formatDateTimeID(c.accepted_at)}</dd>
            </div>
          )}
          {c.completed_at && (
            <div className="flex border-b border-slate-100 py-1.5">
              <dt className="w-36 shrink-0 text-ink-muted">Selesai</dt>
              <dd className="font-medium text-ink">{formatDateTimeID(c.completed_at)}</dd>
            </div>
          )}
          <div className="flex border-b border-slate-100 py-1.5">
            <dt className="w-36 shrink-0 text-ink-muted">Uraian</dt>
            <dd className="whitespace-pre-line font-normal text-ink">{c.description}</dd>
          </div>
        </dl>
      </section>

      <section className="mb-5">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink">
          Data Pelapor
        </h2>
        <dl className="mt-2 text-sm">
          <div className="flex border-b border-slate-100 py-1.5">
            <dt className="w-36 shrink-0 text-ink-muted">Nama</dt>
            <dd className="font-medium text-ink">{c.reporter?.full_name ?? "Warga"}</dd>
          </div>
          <div className="flex border-b border-slate-100 py-1.5">
            <dt className="w-36 shrink-0 text-ink-muted">Telepon</dt>
            <dd className="font-medium text-ink">{c.reporter?.phone ?? "-"}</dd>
          </div>
        </dl>
      </section>

      <section className="mb-5">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink">
          Lokasi
        </h2>
        <dl className="mt-2 text-sm">
          <div className="flex border-b border-slate-100 py-1.5">
            <dt className="w-36 shrink-0 text-ink-muted">Alamat</dt>
            <dd className="font-medium text-ink">{c.location || "-"}</dd>
          </div>
          {c.location_detail && (
            <div className="flex border-b border-slate-100 py-1.5">
              <dt className="w-36 shrink-0 text-ink-muted">Detail</dt>
              <dd className="font-medium text-ink">{c.location_detail}</dd>
            </div>
          )}
          {region && (
            <div className="flex border-b border-slate-100 py-1.5">
              <dt className="w-36 shrink-0 text-ink-muted">Wilayah</dt>
              <dd className="font-medium text-ink">{region}</dd>
            </div>
          )}
          {c.lat != null && c.lng != null && (
            <div className="flex border-b border-slate-100 py-1.5">
              <dt className="w-36 shrink-0 text-ink-muted">Koordinat</dt>
              <dd className="font-mono font-medium text-ink">
                {c.lat}, {c.lng}
              </dd>
            </div>
          )}
        </dl>
      </section>

      {photo && (
        <section className="mb-5">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink">
            Foto Aduan
          </h2>
          <img
            src={photo}
            alt="Foto aduan"
            className="mt-2 max-h-72 w-full max-w-md rounded-lg border border-slate-200 object-cover"
          />
        </section>
      )}

      <section>
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink">
          Riwayat Penanganan
        </h2>
        {logs.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">Belum ada riwayat penanganan.</p>
        ) : (
          <table className="mt-2 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-300 text-left">
                <th className="py-1.5 pr-2 font-semibold text-ink">Waktu</th>
                <th className="py-1.5 pr-2 font-semibold text-ink">Aksi</th>
                <th className="py-1.5 pr-2 font-semibold text-ink">Keterangan</th>
                <th className="py-1.5 font-semibold text-ink">Oleh</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-100 align-top">
                  <td className="py-1.5 pr-2 text-ink-muted">
                    {formatDateTimeID(log.created_at)}
                  </td>
                  <td className="py-1.5 pr-2 font-medium text-ink">
                    {labelAction(log.action)}
                  </td>
                  <td className="py-1.5 pr-2 text-ink-soft">
                    {log.description || log.result || ""}
                  </td>
                  <td className="py-1.5 text-ink-muted">
                    {log.actor?.full_name || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <hr className="my-6 border-slate-200" />
      <p className="text-xs text-ink-muted">
        Dokumen dicetak dari SIPMA — Kabupaten Bojonegoro pada{" "}
        {formatDateTimeID(printedAt)}. Nomor tiket ini dapat dipakai untuk
        melacak status penanganan aduan.
      </p>
    </div>
  );
}