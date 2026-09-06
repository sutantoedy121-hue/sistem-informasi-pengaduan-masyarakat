import Link from "next/link";
import { ArrowRight, Headset } from "lucide-react";
import AuthAwareCTA from "@/components/ui/AuthAwareCTA";
import Reveal from "@/components/ui/Reveal";

export default function CTA() {
  return (
    <section id="kontak" className="bg-white">
      <div className="container-page py-14 md:py-20">
        <Reveal className="relative overflow-hidden rounded-3xl bg-brand-600 px-6 py-12 shadow-lift sm:px-14 sm:py-14">
          {/* Decorative shapes */}
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-brand-400/30 blur-3xl" />
          <div className="absolute inset-0 bg-grid opacity-[0.08]" />

          <div className="relative flex flex-col items-center text-center gap-8 lg:flex-row lg:items-center lg:text-left">
            <div className="max-w-2xl">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white lg:mx-0">
                <Headset className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-2xl font-extrabold leading-tight text-white sm:text-4xl">
                Punya keluhan? Sampaikan sekarang.
              </h2>
              <p className="mt-3 mx-auto max-w-xl text-base text-brand-100 lg:mx-0">
                Daftar akun SIPMA hanya butuh beberapa menit. Setiap aduan kamu
                akan tercatat resmi dengan nomor tiket dan dipantau hingga
                tuntas.
              </p>
            </div>

            <AuthAwareCTA
                className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col"
                variant="light"
              />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
