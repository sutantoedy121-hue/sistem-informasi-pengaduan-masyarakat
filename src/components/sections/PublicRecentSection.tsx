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
    <section id="aduan-terbaru" className="relative bg-transparent">
      <div className="container-page py-14 md:py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="section-eyebrow">Aduan Terbaru</span>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-4xl md:mt-4">
            Transparansi pengaduan warga
          </h2>
          <p className="mt-3 text-base text-ink-muted">
            Lihat sebagian aduan terkini yang masuk dan progresnya. Menyegarkan sendiri secara realtime.
          </p>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mt-12 lg:gap-6">
          {items === null
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass-card flex min-h-[140px] animate-pulse flex-col justify-between p-6">
                  <div className="h-6 w-24 rounded-full bg-slate-200/60 dark:bg-slate-700/60" />
                  <div className="space-y-2">
                    <div className="h-5 w-3/4 rounded bg-slate-200/60 dark:bg-slate-700/60" />
                    <div className="h-4 w-1/2 rounded bg-slate-100/60 dark:bg-slate-800/60" />
                  </div>
                </div>
              ))
            : items.map((item, i) => {
                const meta = statusMeta[item.status];
                const cat = firstCategory(item.category);
                return (
                  <Reveal key={item.id} delay={i * 60} className="h-full">
                    <div className="glass-card-hover group flex h-full flex-col justify-between p-6 sm:p-7">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`badge border border-white/50 ${meta?.badge ?? "bg-slate-100 text-slate-700"}`}
                          >
                            {meta?.label ?? item.status}
                          </span>
                          <span className="text-xs font-medium text-ink-faint">
                            {formatRelativeTimeID(item.created_at)}
                          </span>
                        </div>
                        <h3 className="mt-4 text-base font-bold text-ink group-hover:text-brand-600 transition-colors">
                          {item.title}
                        </h3>
                      </div>

                      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-white/60 dark:border-white/10 text-xs text-ink-muted">
                        <span className="font-semibold text-brand-700 dark:text-brand-300">
                          {categoryLabel(cat, item.category_note)}
                        </span>
                        {item.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-pink-500" />
                            {item.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </Reveal>
                );
              })}
        </div>
      </div>
    </section>
  );
}