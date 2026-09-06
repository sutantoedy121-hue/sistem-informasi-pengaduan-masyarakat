import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { getSiteSettings } from "@/lib/queries";
import { getAssetUrl } from "@/lib/storage";

const footerLinks = [
  {
    title: "Layanan",
    links: [
      { href: "/#beranda", label: "Beranda" },
      { href: "/#lacak", label: "Lacak Aduan" },
      { href: "/#kategori", label: "Kategori Aduan" },
      { href: "/#alur", label: "Alur Pengaduan" },
    ],
  },
  {
    title: "Informasi",
    links: [
      { href: "/#statistik", label: "Statistik Publik" },
      { href: "/#faq", label: "FAQ" },
      { href: "/#kontak", label: "Kontak" },
      { href: "/#privasi", label: "Kebijakan Privasi" },
    ],
  },
];

/**
 * Footer publik. Nama situs & kontak diambil dari `site_settings`
 * (single row, dikelola admin di /admin/settings), fallback ke nilai
 * statis bila belum ter-set.
 */
export default async function Footer() {
  const settings = await getSiteSettings();
  const siteName = settings?.site_name || "SIPMA";
  const tagline = settings?.tagline || "Sistem Informasi Pengaduan Masyarakat";
  const address =
    settings?.contact_address || "Jalan Pemuda No. 1, Kec. Bojonegoro, Kabupaten Bojonegoro";
  const phone = settings?.contact_phone || "(021) 1234-5678";
  const email = settings?.contact_email || "sipma@bojonegorokab.go.id";
  const logoUrl = getAssetUrl(settings?.logo_url);

  return (
    <footer className="border-t border-slate-200 bg-slate-50/60">
      <div className="container-page py-12 sm:py-14">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-[1.5fr_1fr_1fr] lg:gap-x-10">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`Logo ${siteName}`}
                  className="h-9 w-auto max-w-[140px] object-contain"
                />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
                  <span className="text-sm font-extrabold">
                    {siteName.charAt(0)}
                  </span>
                </div>
              )}
              <div className="flex flex-col leading-none">
                <span className="text-base font-extrabold tracking-tight text-ink">
                  {siteName}
                </span>
                <span className="text-[10px] font-medium text-ink-muted">
                  Kabupaten Bojonegoro
                </span>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-muted">
              {tagline}. Kanal resmi untuk menyampaikan
              dan memantau pengaduan warga secara transparan, cepat, dan akuntabel.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-ink-muted">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                <span>{address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-brand-600" />
                {phone}
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-brand-600" />
                <span className="break-all">{email}</span>
              </li>
            </ul>
          </div>

          {/* Link columns */}
          {footerLinks.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-ink">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-muted transition-colors hover:text-brand-700"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 sm:flex-row">
          <p className="text-xs text-ink-faint">
            © {new Date().getFullYear()} Pemerintah Kabupaten Bojonegoro. Semua hak cipta dilindungi.
          </p>
          <p className="text-xs text-ink-faint">
            Dibangun dengan Next.js · React · Tailwind CSS
          </p>
        </div>
      </div>
    </footer>
  );
}
