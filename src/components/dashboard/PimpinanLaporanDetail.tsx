"use client";

import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { Search, FileText } from "lucide-react";
import { formatDateTimeID } from "@/lib/utils";
import type { ComplaintStaffListItem } from "@/lib/db-types";
import StatusBadge from "@/components/ui/StatusBadge";
import Pagination from "@/components/ui/Pagination";

const PAGE_SIZE = 10;

export default function PimpinanLaporanDetail({
  complaints,
}: {
  complaints: ComplaintStaffListItem[];
}) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [q]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (query.length < 3) return complaints;
    return complaints.filter(
      (c) =>
        c.title.toLowerCase().includes(query) ||
        c.ticket.toLowerCase().includes(query) ||
        (c.category?.name ?? "").toLowerCase().includes(query)
    );
  }, [complaints, q]);

  const visible = useMemo(() => {
    return filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filtered, page]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <div className="card mt-6 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-brand-600" />
          <h2 className="text-sm font-bold text-ink">Detail Aduan</h2>
        </div>
        <div className="relative w-full max-w-xs sm:w-auto">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari judul / tiket (min. 3 huruf)..."
            className="input-field !py-1.5 pl-8 text-xs"
          />
        </div>
      </div>
      {visible.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-ink-muted">
          Tidak ada aduan yang sesuai.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {visible.map((c) => (
            <li key={c.id}>
              <Link
                href={`/pimpinan/aduan/${c.id}`}
                className="flex flex-wrap items-center gap-3 px-5 py-4 transition-colors hover:bg-brand-50/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{c.title}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    <span className="font-mono">{c.ticket}</span> ·{" "}
                    {c.category?.name ?? "Tanpa kategori"} ·{" "}
                    {formatDateTimeID(c.created_at)}
                  </p>
                </div>
                <StatusBadge status={c.status} className="shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      {pageCount > 1 && (
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      )}
    </div>
  );
}