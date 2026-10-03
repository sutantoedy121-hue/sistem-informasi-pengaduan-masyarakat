"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, User, AlertTriangle } from "lucide-react";
import { cn, categoryLabel, formatRelativeTimeID } from "@/lib/utils";
import type { ComplaintStaffListItem } from "@/lib/db-types";
import StatusBadge from "@/components/ui/StatusBadge";
import Pagination from "@/components/ui/Pagination";

const PAGE_SIZE = 10;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

type FilterValue =
  | "semua"
  | "overdue"
  | "diajukan"
  | "diterima"
  | "diproses"
  | "selesai"
  | "ditolak";

const filters: { value: FilterValue; label: string; active: (c: ComplaintStaffListItem) => boolean }[] = [
  { value: "semua", label: "Semua", active: () => true },
  {
    value: "overdue",
    label: "Perlu Atensi (>7 Hari)",
    active: (c) =>
      c.status === "diajukan" &&
      Date.now() - new Date(c.created_at).getTime() >= SEVEN_DAYS_MS,
  },
  { value: "diajukan", label: "Menunggu Diterima", active: (c) => c.status === "diajukan" },
  { value: "diterima", label: "Diterima", active: (c) => c.status === "diterima" },
  { value: "diproses", label: "Diproses", active: (c) => c.status === "diproses" },
  { value: "selesai", label: "Selesai", active: (c) => c.status === "selesai" },
  { value: "ditolak", label: "Ditolak", active: (c) => c.status === "ditolak" },
];

export default function StaffComplaintsList({
  complaints,
}: {
  complaints: ComplaintStaffListItem[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFilter =
    (searchParams?.get("filter") as FilterValue | null) || "semua";
  const [filter, setFilter] = useState<FilterValue>(initialFilter);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [filter, q]);

  const setFilterValue = useCallback(
    (value: FilterValue) => {
      setFilter(value);
      const next = new URLSearchParams(searchParams ? searchParams.toString() : "");
      if (value === "semua") next.delete("filter");
      else next.set("filter", value);
      router.replace(`/petugas/aduan?${next.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return complaints.filter((c) => {
      const f = filters.find((x) => x.value === filter)!;
      if (!f.active(c)) return false;
      // Output hasil pencarian hanya aktif jika mengetik minimal 3 huruf
      if (query.length < 3) return true;
      return (
        c.title.toLowerCase().includes(query) ||
        c.ticket.toLowerCase().includes(query) ||
        (c.location ?? "").toLowerCase().includes(query) ||
        (c.reporter?.full_name ?? "").toLowerCase().includes(query)
      );
    });
  }, [complaints, filter, q]);

  const visible = useMemo(() => {
    return filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filtered, page]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);

  const counts = useMemo(
    () =>
      filters.reduce<Record<string, number>>((acc, f) => {
        acc[f.value] = complaints.filter((c) => f.active(c)).length;
        return acc;
      }, {}),
    [complaints]
  );

  return (
    <div className="container-page py-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
          Semua Aduan
        </h1>
        <p className="mt-0.5 text-sm text-ink-muted">
          {complaints.length} aduan masuk dari seluruh warga.
        </p>
      </div>

      {/* Search */}
      <div className="relative mt-6 max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari judul / tiket / lokasi / pelapor (min. 3 huruf)..."
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
            <h3 className="mt-4 text-base font-bold text-ink">
              Tidak ada aduan
            </h3>
            <p className="mt-1 max-w-xs text-sm text-ink-muted">
              {complaints.length === 0
                ? "Belum ada aduan yang masuk ke panel petugas."
                : "Tidak ada hasil untuk filter/pencarian ini."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {visible.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/petugas/aduan/${c.id}`}
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
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {c.reporter?.full_name ?? "Warga"}
                      </span>
                      <span>{formatRelativeTimeID(c.created_at)}</span>
                    </p>
                  </div>
                  <span className="shrink-0">
                    <StatusBadge status={c.status} />
                  </span>
                  {c.status === "diajukan" &&
                    Date.now() - new Date(c.created_at).getTime() >=
                      SEVEN_DAYS_MS && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600 ring-1 ring-red-200">
                        <AlertTriangle className="h-3 w-3" />
                        &gt;7 hari
                      </span>
                    )}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {pageCount > 1 && (
          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        )}
      </div>
    </div>
  );
}