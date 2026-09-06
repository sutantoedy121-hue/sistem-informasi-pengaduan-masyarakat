"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}

/**
 * Paginasi angka ringkas: halaman aktif, prev/next, dan nomor halaman
 * (max 7 slot). Dipakai daftar admin (users & login logs) agar baris
 * tidak menumpuk panjang.
 */
export default function Pagination({ page, pageCount, onChange }: Props) {
  if (pageCount <= 1) return null;

  const pages: number[] = [];
  const clamp = (n: number) => Math.min(Math.max(n, 1), pageCount);
  for (let i = 1; i <= pageCount; i++) {
    if (
      i === 1 ||
      i === pageCount ||
      Math.abs(i - page) <= 2
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== 0) {
      pages.push(0); // ellipsis marker
    }
  }

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3.5"
      aria-label="Navigasi halaman"
    >
      <span className="text-xs text-ink-muted">
        Halaman {page} dari {pageCount}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-ink-muted transition-colors hover:border-brand-200 hover:text-brand-700 disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-ink-muted"
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p, i) =>
          p === 0 ? (
            <span
              key={`e-${i}`}
              className="px-1 text-xs text-ink-faint"
              aria-hidden
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors",
                p === page
                  ? "bg-brand-600 text-white shadow-soft"
                  : "border border-slate-200 text-ink-muted hover:border-brand-200 hover:text-brand-700"
              )}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= pageCount}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-ink-muted transition-colors hover:border-brand-200 hover:text-brand-700 disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-ink-muted"
          aria-label="Halaman berikutnya"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}