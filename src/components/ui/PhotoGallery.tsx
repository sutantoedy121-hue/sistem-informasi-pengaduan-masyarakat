"use client";

import { useState } from "react";
import { getPhotoUrls } from "@/lib/storage";

interface Props {
  /** Nilai kolom `photo_url`: path tunggal atau JSON array path. */
  value: string | null | undefined;
  alt?: string;
  /** Grid kecil (thumbnail) atau tampilan besar (halaman detail). */
  variant?: "hero" | "thumb";
  className?: string;
}

/**
 * Galeri multi-foto. Menampilkan foto aduan/bukti (bisa > 1). Klik foto
 * membuka lightbox overlay. Mendukung data lama (path tunggal) & baru
 * (JSON array) lewat getPhotoUrls.
 */
export default function PhotoGallery({
  value,
  alt = "Foto aduan",
  variant = "hero",
  className = "",
}: Props) {
  const urls = getPhotoUrls(value);
  const [open, setOpen] = useState<number | null>(null);
  if (urls.length === 0) return null;

  if (variant === "thumb") {
    return (
      <div className={`flex gap-1.5 ${className}`}>
        {urls.slice(0, 3).map((u, i) => (
          <img
            key={u}
            src={u}
            alt={`${alt} ${i + 1}`}
            className="h-11 w-11 shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
          />
        ))}
        {urls.length > 3 && (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-bold text-ink-muted">
            +{urls.length - 3}
          </span>
        )}
      </div>
    );
  }

  const grid =
    urls.length === 1
      ? "grid-cols-1"
      : urls.length === 2
        ? "grid-cols-2"
        : "grid-cols-2 sm:grid-cols-3";

  return (
    <>
      <div className={`grid gap-2 ${grid} ${className}`}>
        {urls.map((u, i) => (
          <button
            key={u}
            type="button"
            onClick={() => setOpen(i)}
            className="overflow-hidden rounded-2xl ring-1 ring-slate-200 transition-transform hover:scale-[1.01]"
          >
            <img
              src={u}
              alt={`${alt} ${i + 1}`}
              className="aspect-video w-full object-cover"
            />
          </button>
        ))}
      </div>

      {open !== null && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/85 p-4"
          onClick={() => setOpen(null)}
        >
          <button
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl leading-none text-white backdrop-blur hover:bg-white/20"
            aria-label="Tutup"
          >
            ×
          </button>
          <img
            src={urls[open]}
            alt={`${alt} ${open + 1}`}
            className="max-h-[88vh] max-w-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}