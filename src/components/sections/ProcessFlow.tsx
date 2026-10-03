import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";
import { processSteps } from "@/lib/data";

export default function ProcessFlow() {
  return (
    <section id="alur" className="relative overflow-hidden bg-white/40 dark:bg-slate-900/40 border-y border-white/60 dark:border-white/10 backdrop-blur-md">
      <div className="container-page py-14 md:py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="section-eyebrow">Alur Pengaduan</span>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-4xl md:mt-4">
            Dari pengajuan hingga selesai
          </h2>
          <p className="mt-3 text-base text-ink-muted">
            Proses transparan dengan dokumentasi setiap tahap, agar setiap aduan
            tertangani secara akuntabel.
          </p>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 items-stretch gap-4 md:mt-14 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6">
          {processSteps.map((step, i) => (
            <Reveal key={step.step} delay={i * 90} className="relative h-full">
              <div className="glass-card-hover flex h-full min-w-0 flex-col p-6 sm:p-7">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-400 text-white shadow-md border border-white/40">
                    <Icon name={step.icon} className="h-5 w-5" />
                  </div>
                  <span className="text-3xl font-black text-slate-300 dark:text-slate-700">
                    {step.step}
                  </span>
                </div>
                <h3 className="mt-5 text-base font-bold text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {step.description}
                </p>
              </div>

              {/* Connector arrow (mobile & desktop) */}
              {i < processSteps.length - 1 && (
                <>
                  {/* Vertikal (mobile) */}
                  <div className="absolute -bottom-2 left-1/2 z-10 -translate-x-1/2 lg:hidden">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full glass-pill text-xs font-bold text-brand-600 shadow-sm">
                      ↓
                    </div>
                  </div>
                  {/* Horizontal (desktop lg) */}
                  <div className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 lg:block">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full glass-pill text-xs font-bold text-brand-600 shadow-sm">
                      →
                    </div>
                  </div>
                </>
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
