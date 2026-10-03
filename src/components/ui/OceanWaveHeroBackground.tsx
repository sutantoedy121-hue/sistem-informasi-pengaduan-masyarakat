"use client";

/**
 * Modern Shadow Smoke Hero Background.
 * Desain bersih & mewah dengan subtle shadow smoke gradient,
 * menggantikan ombak penuh agar tampilan terlihat profesional dan konsisten.
 */
export default function OceanWaveHeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-white dark:bg-neutral-950 transition-colors" aria-hidden="true">
      {/* 1. Subtle Radial Smoke Glow (Netral & Mewah) */}
      <div className="absolute -top-32 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-slate-100/90 blur-3xl dark:bg-neutral-900/50" />
      <div className="absolute top-24 left-1/3 h-72 w-72 rounded-full bg-slate-200/50 blur-3xl dark:bg-neutral-900/40" />

      {/* 2. Grid Pattern Sangat Halus */}
      <div className="absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(ellipse_at_top,black_40%,transparent_75%)] dark:opacity-20" />
    </div>
  );
}