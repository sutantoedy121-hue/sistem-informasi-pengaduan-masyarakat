"use client";

import { useState, useEffect } from "react";
import { getPhotoUrls } from "@/lib/storage";
import { categoryLabel, formatDateID } from "@/lib/utils";
import { CheckCircle2, ChevronLeft, ChevronRight, MapPin, Calendar } from "lucide-react";
import type { ComplaintWithCategory } from "@/lib/db-types";

interface Props {
  initialItems: ComplaintWithCategory[];
}

/**
 * 3D Curved Coverflow Carousel (Client Component).
 * Render interaktif 3D dengan rotasi perspektif, depth scaling, dan navigasi smooth.
 */
export default function ShowcaseCarouselClient({ initialItems }: Props) {
  const [items] = useState<ComplaintWithCategory[]>(initialItems);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (items.length > 0) {
      setActiveIndex(Math.floor(items.length / 2));
    }
  }, [items]);

  // Auto slide lembut setiap 4.5 detik
  useEffect(() => {
    if (items.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [items.length, isPaused]);

  if (items.length === 0) return null;

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative mt-12 flex h-[380px] sm:h-[440px] items-center justify-center [perspective:1200px]"
    >
      {items.map((c, index) => {
        const offset = index - activeIndex;
        const absOffset = Math.abs(offset);
        const photos = getPhotoUrls(c.photo_url);
        const thumb = photos[0];

        // Transformasi 3D Coverflow
        const isCenter = offset === 0;
        const translateX = offset * 220; // Jarak horizontal
        const translateZ = -absOffset * 140; // Kedalaman mundur ke belakang
        const rotateY = offset * -25; // Sudut putar 3D
        const opacity = Math.max(0, 1 - absOffset * 0.32);
        const zIndex = 20 - absOffset;

        if (absOffset > 3) return null;

        return (
          <div
            key={c.id}
            onClick={() => setActiveIndex(index)}
            style={{
              transform: `translate3d(${translateX}px, 0, ${translateZ}px) rotateY(${rotateY}deg)`,
              zIndex,
              opacity,
            }}
            className={`absolute top-0 w-[270px] sm:w-[320px] md:w-[360px] cursor-pointer select-none rounded-3xl border transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${
              isCenter
                ? "border-brand-300 bg-white p-4 shadow-2xl ring-4 ring-brand-500/15 dark:border-neutral-700 dark:bg-neutral-900 dark:ring-brand-400/10"
                : "border-slate-200/80 bg-white/90 p-3 shadow-lg blur-[0.5px] hover:blur-none dark:border-neutral-800 dark:bg-neutral-900/80"
            }`}
          >
            {/* Gambar Bukti dengan Badge Status 3D */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-neutral-800">
              {thumb ? (
                <img
                  src={thumb}
                  alt={c.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-400">
                  No Photo
                </div>
              )}

              <div className="absolute top-2.5 left-2.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/90 px-2.5 py-1 text-[11px] font-bold text-white shadow-md backdrop-blur-md">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Selesai
                </span>
              </div>

              <div className="absolute bottom-2.5 right-2.5">
                <span className="rounded-lg bg-black/60 px-2 py-1 font-mono text-[10px] font-bold text-white backdrop-blur-md">
                  {c.ticket}
                </span>
              </div>
            </div>

            {/* Deskripsi & Meta Aduan */}
            <div className="mt-3.5 px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                {categoryLabel(c.category, c.category_note)}
              </span>
              <h3 className="mt-1 line-clamp-1 text-sm sm:text-base font-extrabold text-ink dark:text-white">
                {c.title}
              </h3>
              <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-ink-muted dark:text-neutral-400">
                <span className="inline-flex items-center gap-1 truncate max-w-[140px]">
                  <MapPin className="h-3 w-3 shrink-0 text-brand-500" />
                  {c.location || "Kab. Bojonegoro"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3 shrink-0" />
                  {formatDateID(c.completed_at || c.created_at)}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Navigation Controls */}
      <div className="absolute -bottom-12 flex items-center gap-3">
        <button
          onClick={() => setActiveIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-ink shadow-sm transition-all hover:scale-105 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800"
          aria-label="Sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1.5 px-2">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? "w-7 bg-brand-600 dark:bg-brand-400 shadow-xs"
                  : "w-2 bg-slate-300 hover:bg-slate-400 dark:bg-neutral-700"
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => setActiveIndex((prev) => (prev + 1) % items.length)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-ink shadow-sm transition-all hover:scale-105 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800"
          aria-label="Selanjutnya"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}