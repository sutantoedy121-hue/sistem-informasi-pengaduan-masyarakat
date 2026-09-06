"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, LogOut, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { getAssetUrl } from "@/lib/storage";
import { useRouter } from "next/navigation";
import NotificationBell from "@/components/dashboard/NotificationBell";

const navLinks = [
  { href: "/#beranda", label: "Beranda" },
  { href: "/#lacak", label: "Lacak Aduan" },
  { href: "/#kategori", label: "Kategori" },
  { href: "/#alur", label: "Alur" },
  { href: "/#statistik", label: "Statistik" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    async function loadLogo() {
      try {
        const { data } = await supabase
          .from("site_settings")
          .select("site_name, logo_url")
          .eq("id", 1)
          .maybeSingle();
        if (data?.logo_url) setLogoUrl(getAssetUrl(data.logo_url));
      } catch {
        // abaikan
      }
    }
    loadLogo();
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      setUser(
        u
          ? {
              email: u.email || "",
              name: (u.user_metadata?.full_name as string) || u.email || "",
            }
          : null
      );
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user;
      setUser(
        u
          ? {
              email: u.email || "",
              name: (u.user_metadata?.full_name as string) || u.email || "",
            }
          : null
      );
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.refresh();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-lg">
      <nav className="container-page flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo SIPMA"
              className="h-9 w-auto max-w-[140px] object-contain"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-soft">
              <span className="text-sm font-extrabold">S</span>
            </div>
          )}
          <div className="flex flex-col leading-none">
            <span className="text-base font-extrabold tracking-tight text-ink">
              SIPMA
            </span>
            <span className="text-[10px] font-medium text-ink-muted">
              Kabupaten Bojonegoro
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-brand-50 hover:text-brand-700"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <div className="flex items-center gap-2">
              <NotificationBell />
              <Link href="/masyarakat" className="btn-ghost gap-2">
                <UserCircle className="h-4 w-4" />
                <span className="max-w-[140px] truncate">{user.name}</span>
              </Link>
              <button onClick={handleLogout} className="btn-secondary">
                <LogOut className="h-4 w-4" />
                Keluar
              </button>
            </div>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Masuk
              </Link>
              <Link href="/register" className="btn-primary">
                Buat Aduan
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-ink md:hidden"
          aria-label="Buka menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          "overflow-hidden border-t border-slate-200/70 bg-white md:hidden",
          open ? "max-h-[26rem]" : "max-h-0"
        )}
      >
        <div className="container-page flex flex-col gap-1 py-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-base font-medium text-ink-soft hover:bg-brand-50 hover:text-brand-700"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-2">
            {user ? (
              <>
                <div className="flex items-center gap-2">
                  <NotificationBell />
                  <Link
                    href="/masyarakat/profil"
                    className="btn-secondary w-full justify-start"
                    onClick={() => setOpen(false)}
                  >
                    <UserCircle className="h-4 w-4" />
                    Pengaturan Profil
                  </Link>
                </div>
                <button
                  onClick={() => { handleLogout(); setOpen(false); }}
                  className="btn-secondary w-full"
                >
                  <LogOut className="h-4 w-4" />
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link href="/register" className="btn-primary w-full" onClick={() => setOpen(false)}>
                  Buat Aduan
                </Link>
                <Link href="/login" className="btn-secondary w-full" onClick={() => setOpen(false)}>
                  Masuk
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
