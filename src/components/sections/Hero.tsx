"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShieldCheck, Sparkles, Ticket } from "lucide-react";
import AuthAwareCTA from "@/components/ui/AuthAwareCTA";

/** Teks heading dengan animasi ketik (typewriter), huruf muncul 1-per-1,
 * lalu jeda 10–15 detik, lalu ketik dari awal lagi. */
function TypewriterHeadline() {
  const text = "Suarakan wargamu, lacak sampai tuntas";
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
    <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-6xl">
      {text.slice(0, count)}
      <span className="animate-pulse-soft inline-block w-[0.08em] text-brand-600">|</span>
    </h1>
  );
}

export default function Hero() {
  return (
    <section id="beranda" className="relative overflow-hidden bg-white">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]" />
      <div className="absolute inset-0 bg-glow" />
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl" />
      <div className="absolute top-40 -left-24 h-72 w-72 rounded-full bg-accent-100/50 blur-3xl" />

      <div className="container-page relative px-4 py-16 sm:px-6 md:py-24">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <span className="section-eyebrow animate-fade-up">
            <Sparkles className="h-3.5 w-3.5" />
            Layanan Pengaduan Digital Kabupaten Bojonegoro
          </span>

          <TypewriterHeadline />

          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
            SIPMA memberi kanal resmi untuk menyampaikan pengaduan, menerima
            nomor tiket otomatis, dan memantau status penanganan secara
            real-time — transparan, cepat, dan akuntabel.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <AuthAwareCTA />
            <Link href="/#lacak" className="btn-secondary w-full sm:w-auto">
              <Ticket className="h-4 w-4" />
              Lacak Tiket
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-ink-muted">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-accent-500" />
              Terverifikasi resmi pemerintah daerah
            </div>
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-brand-600" />
              Nomor tiket otomatis
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 animate-pulse-soft rounded-full bg-accent-500" />
              Notifikasi real-time
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}