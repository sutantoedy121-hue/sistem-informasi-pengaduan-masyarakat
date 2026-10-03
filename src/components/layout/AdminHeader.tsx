"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Inbox,
  Palette,
  ScrollText,
  Settings,
  LogOut,
  UserCircle,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import PanelBrand from "@/components/layout/PanelBrand";
import NotificationBell from "@/components/dashboard/NotificationBell";

const primaryTabs = [
  {
    href: "/admin",
    label: "Ringkasan",
    icon: LayoutDashboard,
    isActive: (p: string) => p === "/admin",
  },
  {
    href: "/admin/aduan",
    label: "Semua Aduan",
    icon: Inbox,
    isActive: (p: string) => p.startsWith("/admin/aduan"),
  },
  {
    href: "/admin/users",
    label: "Kelola Akun",
    icon: Users,
    isActive: (p: string) => p.startsWith("/admin/users"),
  },
  {
    href: "/admin/master",
    label: "Data Master",
    icon: Palette,
    isActive: (p: string) => p.startsWith("/admin/master"),
  },
  {
    href: "/admin/login-logs",
    label: "Keamanan & Log",
    icon: ScrollText,
    isActive: (p: string) => p.startsWith("/admin/login-logs"),
  },
  {
    href: "/admin/settings",
    label: "Pengaturan Situs",
    icon: Settings,
    isActive: (p: string) => p.startsWith("/admin/settings"),
  },
  {
    href: "/admin/profil",
    label: "Akun Saya",
    icon: UserCircle,
    isActive: (p: string) => p === "/admin/profil",
  },
];

interface Props {
  fullName: string;
  email: string;
}

/** Shell header panel admin: brand, info akun, navigasi tab. */
export default function AdminHeader({ fullName, email }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-2xs">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        {/* Brand */}
        <PanelBrand roleLabel="Admin" />

        {/* Desktop actions: Role Switching & Account */}
        <div className="hidden items-center gap-2 md:flex">
          {/* Role Impersonation Switcher (Pintas Intip Petugas & Pimpinan) */}
          <div className="flex items-center rounded-full border border-white/80 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 p-1 text-xs backdrop-blur-md">
            <span className="px-2 text-[10px] font-bold uppercase text-ink-muted">Lihat Panel:</span>
            <Link
              href="/petugas"
              className="rounded-full px-2.5 py-1 font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:text-brand-700 hover:shadow-2xs transition-all"
            >
              Petugas
            </Link>
            <Link
              href="/pimpinan"
              className="rounded-full px-2.5 py-1 font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:text-brand-700 hover:shadow-2xs transition-all"
            >
              Pimpinan
            </Link>
          </div>

          <NotificationBell />

          <Link
            href="/admin/profil"
            className="flex items-center gap-2 rounded-full border border-white/80 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 py-1 pl-1 pr-3 transition-colors hover:border-pink-300 hover:bg-white"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300">
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
          </Link>
          <button
            onClick={handleLogout}
            className="btn-ghost !px-3 !py-2 text-xs"
            aria-label="Keluar"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden lg:inline">Keluar</span>
          </button>
        </div>

        {/* Mobile: pengaturan akun + logout */}
        <div className="flex items-center gap-1.5 md:hidden">
          <Link
            href="/admin/profil"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-ink-muted transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
            aria-label="Pengaturan akun"
          >
            <UserCircle className="h-4 w-4" />
          </Link>
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
                tab.isActive(pathname || "")
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-ink-muted hover:border-slate-300 hover:text-ink"
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span className="whitespace-nowrap">{tab.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}