"use client";

import { useTheme } from "@/components/ui/ThemeProvider";
import { Sun, Moon, Laptop } from "lucide-react";

/**
 * Komponen Pengaturan Tema Mode Gelap & Terang untuk Halaman Profil
 * Berlaku di semua role (Masyarakat, Petugas, Pimpinan, Admin).
 */
export default function ThemeToggleSection() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="card p-6 border border-slate-200 dark:border-neutral-800 dark:bg-neutral-900 transition-colors">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
          {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </div>
        <div>
          <h2 className="text-base font-extrabold text-ink dark:text-white">
            Tema Tampilan (Mode Gelap / Terang)
          </h2>
          <p className="text-xs text-ink-muted dark:text-neutral-400 mt-0.5">
            Sesuaikan kenyamanan mata dengan memilih tema gelap, terang, atau mengikuti sistem perangkat.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setTheme("light")}
          className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 transition-all ${
            theme === "light"
              ? "border-brand-500 bg-brand-50/50 text-brand-700 ring-2 ring-brand-500/20 font-bold shadow-xs dark:bg-brand-950/40 dark:text-brand-300"
              : "border-slate-200 bg-white text-ink-soft hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-300"
          }`}
        >
          <Sun className="h-5 w-5" />
          <span className="text-xs">Mode Terang</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 transition-all ${
            theme === "dark"
              ? "border-brand-500 bg-brand-50/50 text-brand-700 ring-2 ring-brand-500/20 font-bold shadow-xs dark:bg-brand-950/40 dark:text-brand-300"
              : "border-slate-200 bg-white text-ink-soft hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-300"
          }`}
        >
          <Moon className="h-5 w-5" />
          <span className="text-xs">Mode Gelap</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme("system")}
          className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 transition-all ${
            theme === "system"
              ? "border-brand-500 bg-brand-50/50 text-brand-700 ring-2 ring-brand-500/20 font-bold shadow-xs dark:bg-brand-950/40 dark:text-brand-300"
              : "border-slate-200 bg-white text-ink-soft hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-300"
          }`}
        >
          <Laptop className="h-5 w-5" />
          <span className="text-xs">Sistem</span>
        </button>
      </div>
    </div>
  );
}