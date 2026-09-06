import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";
import { processSteps } from "@/lib/data";

export default function ProcessFlow() {
  return (
    <section id="alur" className="relative overflow-hidden bg-slate-50/60 border-y border-slate-100">
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
              <div className="card-hover flex h-full min-w-0 flex-col p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
                    <Icon name={step.icon} className="h-5 w-5" />
                  </div>
                  <span className="text-2xl font-extrabold text-slate-200">
                    {step.step}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-bold text-ink">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                  {step.description}
                </p>
              </div>

              {/* Connector arrow (mobile & desktop) */}
              {i < processSteps.length - 1 && (
                <>
                  {/* Vertikal (mobile) */}
                  <div className="absolute -bottom-2 left-1/2 z-10 -translate-x-1/2 lg:hidden">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm">
                      ↓
                    </div>
                  </div>
                  {/* Horizontal (desktop lg) */}
                  <div className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 lg:block">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm">
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
