"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Inbox, LogOut, ShieldCheck, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const primaryTabs = [
  {
    href: "/petugas",
    label: "Ringkasan",
    icon: LayoutDashboard,
    isActive: (p: string) => p === "/petugas",
  },
  {
    href: "/petugas/aduan",
    label: "Semua Aduan",
    icon: Inbox,
    isActive: (p: string) => p.startsWith("/petugas/aduan"),
  },
];

interface Props {
  fullName: string;
  email: string;
}

/** Shell header panel petugas: brand, info akun, navigasi tab. */
export default function PetugasHeader({ fullName, email }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-lg">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        {/* Brand */}
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-soft">
            <ShieldCheck className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div className="flex min-w-0 flex-col leading-none">
            <span className="flex items-center gap-2 text-base font-extrabold tracking-tight text-ink">
              SIPMA
              <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-700">
                Petugas
              </span>
            </span>
            <span className="truncate text-[10px] font-medium text-ink-muted">
              Kabupaten Bojonegoro
            </span>
          </div>
        </Link>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <UserCircle className="h-5 w-5" />
            </div>
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="max-w-[160px] truncate text-xs font-semibold text-ink">
                {fullName}
              </span>
              <span className="max-w-[160px] truncate text-[10px] text-ink-muted">
                {email}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn-ghost !px-3 !py-2 text-xs"
            aria-label="Keluar"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden lg:inline">Keluar</span>
          </button>
        </div>

        {/* Mobile logout */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={handleLogout}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-ink-muted transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            aria-label="Keluar"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tab nav */}
      <nav className="container-page">
        <div className="-mb-px flex gap-1 overflow-x-auto">
          {primaryTabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-3 text-sm font-semibold transition-colors",
                tab.isActive(pathname)
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-ink-muted hover:border-slate-300 hover:text-ink"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}