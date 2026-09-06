import Link from "next/link";
import { Users, Palette, ScrollText, Settings, ShieldCheck } from "lucide-react";
import { getSession, getAllComplaints, getAdminUserList } from "@/lib/queries";
import { computeStats } from "@/lib/pimpinan/stats";

const quickLinks = [
  {
    href: "/admin/users",
    label: "Kelola Akun",
    desc: "Tambah, ubah role, dan kelola status akun",
    icon: Users,
  },
  {
    href: "/admin/master",
    label: "Data Master",
    desc: "Kategori, pelaksana, dan wilayah",
    icon: Palette,
  },
  {
    href: "/admin/login-logs",
    label: "Riwayat Login",
    desc: "Aktivitas masuk & IP perangkat",
    icon: ScrollText,
  },
  {
    href: "/admin/settings",
    label: "Pengaturan Situs",
    desc: "Nama situs, tagline, dan kontak",
    icon: Settings,
  },
];

export default async function AdminHomePage() {
  const { profile } = await getSession();
  const [users, complaints] = await Promise.all([
    getAdminUserList(),
    getAllComplaints(),
  ]);
  const stats = computeStats(complaints);

  const byRole = (role: string) => users.filter((u) => u.role === role).length;
  const nonaktif = users.filter((u) => !u.isActive).length;

  const tiles = [
    { label: "Total Pengguna", value: users.length, cls: "bg-brand-50 text-brand-700" },
    { label: "Admin", value: byRole("admin"), cls: "bg-violet-50 text-violet-700" },
    { label: "Petugas & Pimpinan", value: byRole("petugas") + byRole("pimpinan"), cls: "bg-blue-50 text-blue-700" },
    { label: "Warga (Masyarakat)", value: byRole("masyarakat"), cls: "bg-emerald-50 text-emerald-700" },
  ];

  return (
    <main className="flex-1 pb-16">
      {/* Greeting bar */}
      <div className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute inset-0 bg-glow" />
        <div className="container-page relative py-8">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Panel Admin
          </p>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Halo, {profile?.full_name?.split(" ")[0] || "Admin"}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Kelola pengguna, data master, dan konfigurasi Sistem SIPMA Kabupaten
            Bojonegoro.
          </p>
          {nonaktif > 0 && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              {nonaktif} akun nonaktif
            </p>
          )}
        </div>
      </div>

      <div className="container-page py-8">
        {/* Stat tiles — mobile: scroll horizontal agar tiap tile lega; lg: 4 kolom */}
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-4 lg:gap-4 lg:overflow-visible lg:pb-0">
          {tiles.map((t) => (
            <div
              key={t.label}
              className="card w-[46vw] min-w-[160px] max-w-[210px] shrink-0 snap-start p-4 sm:p-5 lg:w-auto lg:min-w-0 lg:max-w-none"
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.cls}`}>
                <Users className="h-5 w-5" />
              </span>
              <p className="mt-4 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                {t.value}
              </p>
              <p className="mt-0.5 text-xs font-medium text-ink-muted sm:text-sm">
                {t.label}
              </p>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="card-hover group flex flex-col p-5"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                <l.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-ink group-hover:text-brand-700">
                {l.label}
              </h3>
              <p className="mt-0.5 text-sm text-ink-muted">{l.desc}</p>
            </Link>
          ))}
        </div>

        {/* Statistik aduan singkat */}
        <div className="mt-6 card p-5">
          <h2 className="text-sm font-bold text-ink">Ringkasan Aduan</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            {complaints.length} aduan · {stats.selesai} selesai ·{" "}
            {stats.tingkatPenyelesaian}% tingkat penyelesaian
          </p>
        </div>
      </div>
    </main>
  );
}