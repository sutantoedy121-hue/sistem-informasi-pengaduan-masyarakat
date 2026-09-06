"use client";

import { useEffect, useId, useState } from "react";
import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";
import { createClient } from "@/lib/supabase/client";
import { computePublicStats, type PublicComplaintStat } from "@/lib/public-stats";

const TILES: {
  label: string;
  icon: string;
  value: (s: ReturnType<typeof computePublicStats>) => string;
  sub: (s: ReturnType<typeof computePublicStats>) => string;
}[] = [
  { label: "Total Aduan", value: (s) => s.total.toLocaleString("id-ID"), sub: (s) => `${s.total} aduan`, icon: "Inbox" },
  { label: "Selesai Ditangani", value: (s) => s.selesai.toLocaleString("id-ID"), sub: (s) => `${s.penyelesaianPct}% tingkat penyelesaian · ${s.selesai} aduan`, icon: "CheckCircle2" },
  { label: "Sedang Diproses", value: (s) => s.sedangDiproses.toLocaleString("id-ID"), sub: (s) => `${s.sedangDiproses} aduan ditangani`, icon: "Loader" },
  { label: "Waktu Respons", value: () => "< 12 jam", sub: () => "target layanan", icon: "Timer" },
  { label: "Kepuasan Warga", value: (s) => s.avgRating === null ? "—" : `${s.avgRating.toLocaleString("id-ID")} / 5`, sub: (s) => s.ratedCount ? `dari ${s.ratedCount} penilaian` : "belum ada penilaian", icon: "Star" },
];

/**
 * Ringkasan kinerja pengaduan (4 tile) di halaman publik, live dari DB.
 * Angka dihitung klien dari COUNT complaints (anon read). Berlangganan
 * realtime perubahan tabel `complaints` → refetch ringan → angka update
 * tanpa refresh manual. Kanal unik via useId.
 */
export default function PublicStatsSection() {
  const channelId = useId();
  const [stats, setStats] = useState<ReturnType<typeof computePublicStats> | null>(null);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    async function refetch() {
      const { data } = await supabase
        .from("complaints")
        .select("status, created_at, accepted_at, rating");
      if (!mounted) return;
      setStats(computePublicStats((data ?? []) as unknown as PublicComplaintStat[]));
    }
    refetch();

    const channelName = "public-stats-" + channelId.replace(/[^a-zA-Z0-9_-]/g, "");
    const channel = supabase.channel(channelName);
    const onEvent = () => refetch();
    const cfg = { schema: "public", table: "complaints" } as const;
    channel.on("postgres_changes", { ...cfg, event: "INSERT" }, onEvent);
    channel.on("postgres_changes", { ...cfg, event: "UPDATE" }, onEvent);
    channel.on("postgres_changes", { ...cfg, event: "DELETE" }, onEvent);
    channel.subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  return (
    <section id="statistik" className="border-y border-slate-100 bg-slate-50/50">
      <div className="container-page py-14 md:py-16">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="section-eyebrow">Transparansi Publik</span>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Ringkasan kinerja pengaduan
          </h2>
          <p className="mt-3 text-base text-ink-muted">
            Data terkini yang dapat diakses publik untuk menjaga akuntabilitas
            layanan Kabupaten Bojonegoro.
          </p>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 sm:gap-5">
          {stats === null
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card-hover flex min-h-[150px] animate-pulse flex-col justify-between p-5 sm:p-6">
                  <div className="h-10 w-10 rounded-xl bg-slate-200" />
                  <div className="mt-4 space-y-2">
                    <div className="h-7 w-20 rounded bg-slate-200" />
                    <div className="h-3 w-24 rounded bg-slate-100" />
                  </div>
                </div>
              ))
            : TILES.map((t, i) => (
                <Reveal key={t.label} delay={i * 80} className="h-full">
                  <div className="card-hover group flex h-full min-w-0 flex-col justify-between p-5 sm:p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white sm:h-11 sm:w-11">
                      <Icon name={t.icon} className="h-5 w-5" />
                    </div>
                    <div className="mt-4 sm:mt-5">
                      <p className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                        {t.value(stats)}
                      </p>
                      <p className="mt-1 text-sm font-medium text-ink">{t.label}</p>
                      <p className="mt-0.5 text-xs text-ink-muted">{t.sub(stats)}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
        </div>
      </div>
    </section>
  );
}