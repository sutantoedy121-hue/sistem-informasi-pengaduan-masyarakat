import type { Metadata } from "next";
import "./globals.css";

// Font Nippo dimuat dari Fontshare CDN (gratis, tanpa API key).
// Family name di CSS Fontshare: "Nippo".
export const metadata: Metadata = {
  title: "SIPMA — Sistem Informasi Pengaduan Masyarakat Kabupaten Bojonegoro",
  description:
    "Lapor, lacak, dan selesaikan pengaduan warga Kabupaten Bojonegoro secara transparan dan akuntabel.",
  keywords: ["SIPMA", "pengaduan masyarakat", "kabupaten", "Bojonegoro"],
  authors: [{ name: "Pemerintah Kabupaten Bojonegoro" }],
  openGraph: {
    title: "SIPMA — Pengaduan Masyarakat Kabupaten Bojonegoro",
    description:
      "Kanal pengaduan daring yang transparan dengan nomor tiket dan pelacakan status real-time.",
    type: "website",
    locale: "id_ID",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <head>
        <link
          rel="preconnect"
          href="https://api.fontshare.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://api.fontshare.com/v2/css?f[]=nippo@400,500,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-white">{children}</body>
    </html>
  );
}
