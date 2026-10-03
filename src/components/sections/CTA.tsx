import Link from "next/link";
import { ArrowRight, Headset } from "lucide-react";
import AuthAwareCTA from "@/components/ui/AuthAwareCTA";
import Reveal from "@/components/ui/Reveal";

export default function CTA() {
  return (
    <section id="kontak" className="relative bg-transparent">
      <div className="container-page py-14 md:py-20">
        <Reveal className="glass-card relative overflow-hidden bg-gradient-to-br from-pink-600/90 via-rose-500/90 to-pink-700/90 px-6 py-12 shadow-2xl sm:px-14 sm:py-16 text-white border border-white/30 backdrop-blur-2xl">
          {/* Decorative iridescent shapes */}
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/20 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-pink-300/30 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col items-center text-center gap-8">
            <div className="max-w-2xl text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-white/20 text-white backdrop-blur-md border border-white/40 shadow-inner">
                <Headset className="h-7 w-7" />
              </div>
              <h2 className="mt-5 text-2xl font-black leading-tight text-white sm:text-4xl">
                Punya keluhan? Sampaikan sekarang.
              </h2>
              <p className="mt-3 mx-auto max-w-xl text-base text-pink-100">
                Daftar akun SIPMA hanya butuh beberapa menit. Setiap aduan kamu
                akan tercatat resmi dengan nomor tiket dan dipantau hingga
                tuntas.
              </p>
            </div>

            <AuthAwareCTA
              className="flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row"
              variant="light"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
