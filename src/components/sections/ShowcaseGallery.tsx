import { getCompletedComplaintsWithPhotos, getSiteSettings } from "@/lib/queries";
import ShowcaseCarouselClient from "@/components/sections/ShowcaseCarouselClient";

export default async function ShowcaseGallery() {
  const settings = await getSiteSettings();

  // Jika admin mematikan showcase_enabled, jangan tampilkan section ini
  if (settings?.showcase_enabled === false) return null;

  let selectedIds: string[] | undefined;
  if (settings?.showcase_ids) {
    try {
      const parsed = JSON.parse(settings.showcase_ids);
      if (Array.isArray(parsed) && parsed.length > 0) selectedIds = parsed;
    } catch {}
  }

  const completed = await getCompletedComplaintsWithPhotos(10, selectedIds);
  if (!completed || completed.length === 0) return null;

  return (
    <section className="relative overflow-hidden border-t border-slate-100 bg-white py-16 sm:py-24 dark:border-neutral-800 dark:bg-neutral-950 transition-colors">
      {/* Shadow Smoke Ambient Netral & Bersih */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-[350px] w-[650px] -translate-x-1/2 rounded-full bg-slate-200/40 blur-3xl dark:bg-neutral-800/30" />

      <div className="container-page relative">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-brand-200/80 bg-brand-50 px-3.5 py-1 text-xs font-bold text-brand-700 dark:border-brand-900/50 dark:bg-brand-950/60 dark:text-brand-300 shadow-2xs">
            Bukti Nyata Penanganan
          </span>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-4xl dark:text-white">
            Hasil Tindak Lanjut Terkini
          </h2>
          <p className="mt-2 text-sm text-ink-muted dark:text-neutral-400">
            Geser untuk melihat dokumentasi penanganan laporan masyarakat yang telah diselesaikan oleh dinas terkait.
          </p>
        </div>

        {/* 3D Curved Carousel Client */}
        <div className="pb-8">
          <ShowcaseCarouselClient initialItems={completed} />
        </div>
      </div>
    </section>
  );
}