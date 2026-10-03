"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShieldCheck, Ticket } from "lucide-react";
import AuthAwareCTA from "@/components/ui/AuthAwareCTA";
import OceanWaveHeroBackground from "@/components/ui/OceanWaveHeroBackground";

/** Teks heading dengan animasi ketik (typewriter), huruf muncul 1-per-1,
 * lalu jeda 10–15 detik, lalu ketik dari awal lagi. */
function TypewriterHeadline() {
  const text = "Laporkan Keluhanmu, dan lacak sampai tuntas";
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState<"typing" | "paused" | "deleting">("typing");

  useEffect(() => {
    if (phase === "typing") {
      // Ketik: bergerak maju, jeda random singkat per huruf.
      const t = window.setTimeout(() => {
        if (count >= text.length) setPhase("paused");
        else setCount((c) => c + 1);
      }, 90 + Math.random() * 60);
      return () => window.clearTimeout(t);
    }

    if (phase === "paused") {
      // Jeda 10–15 detik setelah semua huruf muncul.
      const t = window.setTimeout(() => setPhase("deleting"), 10000 + Math.random() * 5000);
      return () => window.clearTimeout(t);
    }

    // deleting: mundur cepat.
    const t = window.setTimeout(() => {
      if (count <= 0) setPhase("typing");
      else setCount((c) => c - 1);
    }, 40);
    return () => window.clearTimeout(t);
  }, [phase, count, text.length]);

  return (
    <div className="mt-5 flex min-h-[5.5rem] items-center justify-center sm:min-h-[7rem] lg:min-h-[8.5rem]">
      <h1 className="text-4xl font-extrabold leading-[1.15] tracking-tight text-ink sm:text-5xl lg:text-6xl">
        {text.slice(0, count)}
        <span className="animate-pulse-soft inline-block w-[0.08em] text-brand-600">|</span>
      </h1>
    </div>
  );
}

export default function Hero() {
  return (
    <section id="beranda" className="relative overflow-hidden bg-transparent">
      {/* Background Ombak 3D Fluid (Seperti inspirasi awan/ombak 3D di gambar referensi) */}
      <OceanWaveHeroBackground />

      <div className="container-page relative px-4 py-16 sm:px-6 md:py-24">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <span className="glass-pill text-xs font-bold text-pink-700 dark:text-pink-300 animate-fade-up">
            ✨ Layanan Pengaduan Digital Kabupaten Bojonegoro
          </span>

          <TypewriterHeadline />

          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-700 dark:text-neutral-200 sm:text-lg">
            SIPMA memberi kanal resmi untuk menyampaikan pengaduan, menerima
            nomor tiket otomatis, dan memantau status penanganan secara
            real-time, transparan, cepat, dan akuntabel.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <AuthAwareCTA />
            <Link href="/#lacak" className="btn-secondary w-full sm:w-auto shadow-sm">
              <Ticket className="h-4 w-4" />
              Lacak Tiket
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-sm font-medium text-slate-700 dark:text-neutral-300">
            <div className="glass-pill text-xs font-medium">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>100% Terbuka & Diverifikasi</span>
            </div>
            <div className="glass-pill text-xs font-medium">
              <span className="h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
              <span>Respon Petugas Lapangan Cepat</span>
            </div>
            <div className="glass-pill text-xs font-medium">
              <Ticket className="h-4 w-4 text-brand-500" />
              <span>Nomor Tiket Otomatis</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}