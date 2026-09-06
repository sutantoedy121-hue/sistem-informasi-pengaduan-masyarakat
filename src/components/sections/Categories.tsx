import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";
import { getSession } from "@/lib/queries";
import { categories } from "@/lib/data";

export default async function Categories() {
  // Sadar status login: yang sudah login langsung ke form aduan (kategori terpilih),
  // yang belum login ke daftar akun (kategori dipertahankan lewat query param).
  const { user } = await getSession();
  const base = user ? "/masyarakat/baru" : "/register";

  return (
    <section id="kategori" className="bg-white">
      <div className="container-page py-14 md:py-20">
        <Reveal className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-end sm:gap-0 sm:text-left">
          <div className="max-w-2xl sm:flex-1">
            <span className="section-eyebrow">Kategori Aduan</span>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-4xl md:mt-4">
              Pilih kategori sesuai keperluan
            </h2>
            <p className="mt-3 text-base text-ink-muted">
              Setiap aduan dikategorikan untuk mempercepat penanganan oleh unit
              kerja yang tepat.
            </p>
          </div>
          <Link href={base} className="btn-secondary w-full shrink-0 sm:w-auto">
            {user ? "Buat Aduan" : "Daftar & Buat Aduan"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 md:mt-12 lg:gap-5">
          {categories.map((cat, i) => (
            <Reveal key={cat.id} delay={i * 60} className="h-full">
              <Link
                href={`${base}?kategori=${cat.slug}`}
                className="card-hover group flex h-full min-w-0 flex-col p-5 sm:p-6"
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${cat.color}`}
                  >
                    <Icon name={cat.icon} className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="mt-5 text-lg font-bold text-ink group-hover:text-brand-700">
                  {cat.name}
                </h3>
                <p className="mt-1 text-sm text-ink-muted">{cat.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 opacity-0 transition-all group-hover:opacity-100">
                  Ajukan kategori ini
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
