"use client";

import { useEffect, useId, useState } from "react";
import { MapPin, RefreshCcw, OctagonAlert } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { statusMeta } from "@/lib/data";
import { formatRelativeTimeID, categoryLabel } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { ComplaintStatus } from "@/lib/db-types";

interface RecentItem {
  id: string;
  title: string;
  status: ComplaintStatus;
  created_at: string;
  location: string | null;
  category_note: string | null;
  category: { name: string } | { name: string }[] | null;
}

/** supabase join pakai array objeek utk relasi 1→1 saat alias kategori. */
function firstCategory(
  c: { name: string } | { name: string }[] | null
): { name: string } | null {
  if (!c) return null;
  return Array.isArray(c) ? c[0] ?? null : c;
}

/**
 * Aduan terbaru (4) di halaman publik — hanya nama pengaduan (tanpa nomor
 * tiket, privat). Live dari DB: berlangganan realtime `complaints` →
 * refetch kecil → daftar update sendiri. Kanal unik via useId.
 */
export default function PublicRecentSection() {
  const channelId = useId();
  const [items, setItems] = useState<RecentItem[] | null>(null);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    async function refetch() {
      const { data } = await supabase
        .from("complaints")
        .select(
          "id, title, status, created_at, location, category_note, category:categories(name)"
        )
        .order("created_at", { ascending: false })
        .limit(4);
      if (!mounted) return;
      setItems((data ?? []) as unknown as RecentItem[]);
    }
    refetch();

    const channelName = "public-recent-" + channelId.replace(/[^a-zA-Z0-9_-]/g, "");
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
    <section id="aduan-terbaru" className="bg-white">
      <div className="container-page py-14 md:py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="section-eyebrow">Aduan Terbaru</span>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-4xl md:mt-4">
            Transparansi pengaduan warga
          </h2>
          <p className="mt-3 text-base text-ink-muted">
            Lihat sebagian aduan terkini yang masuk dan progresnya. Menyegarkan sendiri.
          </p>
        </Reveal>

        <Reveal
          className="mt-10 overflow-hidden rounded-2xl border border-slate-200 shadow-soft md:mt-12"
          delay={80}
        >
          <div className="hidden grid-cols-12 gap-4 border-b border-slate-200 bg-slate-50/80 px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-ink-muted md:grid">
            <div className="col-span-5">Aduan</div>
            <div className="col-span-3">Kategori</div>
            <div className="col-span-2">Lokasi</div>
            <div className="col-span-2">Status</div>
          </div>

          {items === null ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-muted">
              <RefreshCcw className="h-4 w-4 animate-spin" />
              Memuat aduan terbaru…
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
              <OctagonAlert className="h-8 w-8 text-ink-faint" />
              <p className="text-sm font-medium text-ink">Belum ada aduan</p>
              <p className="text-xs text-ink-muted">Aduan warga akan muncul di sini.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((c) => {
                const meta = statusMeta[c.status] ?? statusMeta.diajukan;
                return (
                  <div
                    key={c.id}
                    className="group flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-brand-50/40 sm:px-6 md:grid md:grid-cols-12 md:gap-4"
                  >
                    <div className="md:col-span-5">
                      <p className="font-semibold text-ink group-hover:text-brand-700">
                        {c.title}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-faint">
                        {formatRelativeTimeID(c.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:hidden">
                      <span className="badge bg-brand-50 text-brand-700">
                        {categoryLabel(firstCategory(c.category), c.category_note)}
                      </span>
                      {c.location && (
                        <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                          <MapPin className="h-3.5 w-3.5 text-ink-faint" />
                          {c.location}
                        </span>
                      )}
                    </div>
                    <div className="col-span-3 hidden items-center md:flex">
                      <span className="badge bg-brand-50 text-brand-700">
                        {categoryLabel(firstCategory(c.category), c.category_note)}
                      </span>
                    </div>
                    <div className="col-span-2 hidden items-center text-sm text-ink-muted md:flex">
                      <MapPin className="mr-1.5 h-3.5 w-3.5 text-ink-faint" />
                      {c.location || "-"}
                    </div>
                    <div className="col-span-2 flex items-center md:flex">
                      <span className={`badge ${meta.badge}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}