"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Search, Ticket, ArrowRight, CheckCircle2, AlertCircle, Loader2, MapPin } from "lucide-react";
import { trackComplaintAction } from "@/app/masyarakat/actions";

type TrackResult =
  | { ok: true; data: { ticket: string; title: string; description: string; location: string | null; lat: number | null; lng: number | null; status: string; category: { name: string } | null } }
  | { ok: false; error: string };

const STATUS_LABEL: Record<string, string> = {
  diajukan: "Diajukan",
  diterima: "Diterima",
  ditolak: "Ditolak",
  diproses: "Diproses",
  selesai: "Selesai",
};

const STATUS_BADGE: Record<string, string> = {
  diajukan: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  diterima: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  ditolak: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  diproses: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
  selesai: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
};

export default function TrackTicket() {
  const [ticket, setTicket] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ticket.trim()) return;
    startTransition(async () => {
      setResult(await trackComplaintAction(ticket.trim()));
    });
  }

  return (
    <section id="lacak" className="relative overflow-hidden bg-white">
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]" />
      <div className="container-page relative py-14 md:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="card overflow-hidden shadow-card">
            <div className="grid gap-0 md:grid-cols-5">
              {/* Left: copy */}
              <div className="md:col-span-2 bg-brand-600 px-6 py-7 text-white md:p-8">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                  <Ticket className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-2xl font-extrabold leading-tight md:mt-5">
                  Lacak status aduanmu
                </h2>
                <p className="mt-2 text-sm text-brand-100">
                  Masukkan nomor tiket yang kamu terima saat mengajukan aduan
                  untuk melihat progres penanganan secara real-time.
                </p>
                <Link
                  href="/register"
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:gap-2.5 transition-all md:mt-6"
                >
                  Belum punya tiket? Buat aduan
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Right: form */}
              <div className="px-6 py-7 md:col-span-3 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-4">
                <label htmlFor="ticket" className="block text-sm font-medium text-ink">
                  Nomor Tiket
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                  <input
                    id="ticket"
                    type="text"
                    value={ticket}
                    onChange={(e) => {
                      setTicket(e.target.value);
                      setResult(null);
                    }}
                    placeholder="Contoh: SIPMA-2026-09-0142"
                    className="input-field pl-10 font-mono"
                  />
                </div>

                <button type="submit" disabled={pending} className="btn-primary w-full">
                  {pending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  {pending ? "Mencari..." : "Lacak Aduan"}
                </button>
                </form>

                {/* Result */}
                {result?.ok && (
                  <div className="mt-5 animate-fade-in rounded-xl border border-accent-200 bg-accent-50 p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-accent-600" />
                      <p className="text-sm font-semibold text-accent-700">
                        Tiket ditemukan
                      </p>
                    </div>
                    <dl className="mt-3 space-y-2.5 text-sm">
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <dt className="shrink-0 text-ink-muted">Judul</dt>
                        <dd className="font-medium text-ink">{result.data.title}</dd>
                      </div>
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <dt className="shrink-0 text-ink-muted">Kategori</dt>
                        <dd className="font-medium text-ink">{result.data.category?.name || "—"}</dd>
                      </div>
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <dt className="shrink-0 text-ink-muted">Status</dt>
                        <dd>
                          <span className={`badge ${STATUS_BADGE[result.data.status] || STATUS_BADGE.diajukan}`}>
                            {STATUS_LABEL[result.data.status] || result.data.status}
                          </span>
                        </dd>
                      </div>
                      {result.data.location && (
                        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                          <dt className="shrink-0 text-ink-muted">Lokasi</dt>
                          <dd className="font-medium text-ink">{result.data.location}</dd>
                        </div>
                      )}
                      {result.data.lat != null && result.data.lng != null && (
                        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                          <dt className="shrink-0 text-ink-muted">Peta</dt>
                          <dd>
                            <a
                              href={`https://www.google.com/maps?q=${result.data.lat},${result.data.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline"
                            >
                              <MapPin className="h-3.5 w-3.5" />
                              Buka di peta →
                            </a>
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}

                {result && !result.ok && (
                  <div className="mt-5 animate-fade-in flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    {result.error}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}