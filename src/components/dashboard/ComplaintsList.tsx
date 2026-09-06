"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { Search, MapPin } from "lucide-react";
import { cn, categoryLabel } from "@/lib/utils";
import type { ComplaintWithCategory } from "@/lib/db-types";
import StatusBadge from "@/components/ui/StatusBadge";

type FilterValue = "semua" | "diproses" | "selesai" | "ditolak";

const filters: { value: FilterValue; label: string; active: (s: string) => boolean }[] = [
  { value: "semua", label: "Semua", active: () => true },
  {
    value: "diproses",
    label: "Berjalan",
    active: (s) => ["diajukan", "diterima", "diproses"].includes(s),
  },
  { value: "selesai", label: "Selesai", active: (s) => s === "selesai" },
  { value: "ditolak", label: "Ditolak", active: (s) => s === "ditolak" },
];

export default function ComplaintsList({ complaints }: { complaints: ComplaintWithCategory[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFilter =
    (searchParams.get("filter") as FilterValue | null) || "semua";
  const [filter, setFilter] = useState<FilterValue>(initialFilter);
  const [q, setQ] = useState("");

  const setFilterValue = useCallback(
    (value: FilterValue) => {
      setFilter(value);
      const next = new URLSearchParams(searchParams);
      if (value === "semua") next.delete("filter");
      else next.set("filter", value);
      router.replace(`/masyarakat/aduan?${next.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const visible = useMemo(() => {
    const query = q.trim().toLowerCase();
    return complaints.filter((c) => {
      const f = filters.find((x) => x.value === filter)!;
      const matchStatus = f.active(c.status);
      if (!matchStatus) return false;
      if (!query) return true;
      return (
        c.title.toLowerCase().includes(query) ||
        c.ticket.toLowerCase().includes(query) ||
        (c.location ?? "").toLowerCase().includes(query)
      );
    });
  }, [complaints, filter, q]);

  const counts = useMemo(
    () =>
      filters.reduce<Record<string, number>>((acc, f) => {
        acc[f.value] = complaints.filter((c) => f.active(c.status)).length;
        return acc;
      }, {}),
    [complaints]
  );

  return (
    <div className="container-page py-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
            Aduan Saya
          </h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            {complaints.length} aduan telah kamu ajukan.
          </p>
        </div>
        <Link href="/masyarakat/baru" className="btn-primary !py-2.5 text-sm sm:shrink-0">
          Buat Aduan Baru
        </Link>
      </div>

      {/* Search */}
      <div className="relative mt-6 max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari judul / nomor tiket / lokasi..."
          className="input-field pl-10"
        />
      </div>

      {/* Filter pills */}
      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilterValue(f.value)}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
              filter === f.value
                ? "bg-brand-600 text-white shadow-soft"
                : "border border-slate-200 bg-white text-ink-muted hover:border-brand-200 hover:text-brand-700"
            )}
          >
            {f.label}
            <span
              className={cn(
                "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]",
                filter === f.value ? "bg-white/20" : "bg-slate-100"
              )}
            >
              {counts[f.value]}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 shadow-soft">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-ink-faint">
              <Search className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-base font-bold text-ink">Tidak ada aduan</h3>
            <p className="mt-1 max-w-xs text-sm text-ink-muted">
              {complaints.length === 0
                ? "Kamu belum pernah mengajukan aduan. Yuk sampaikan masalah di sekitarmu."
                : "Tidak ada hasil untuk filter/pencarian ini."}
            </p>
            {complaints.length === 0 && (
              <Link href="/masyarakat/baru" className="btn-primary mt-5 !py-2.5 text-sm">
                Buat Aduan Pertama
              </Link>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {visible.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/masyarakat/aduan/${c.id}`}
                  className="flex flex-wrap items-center gap-3 px-5 py-4 transition-colors hover:bg-brand-50/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {c.title}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
                      <span className="font-mono">{c.ticket}</span>
                      {c.category?.name && (
                        <span className="text-brand-600">
                          {categoryLabel(c.category, c.category_note)}
                        </span>
                      )}
                      {c.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {c.location}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="shrink-0">
                    <StatusBadge status={c.status} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
