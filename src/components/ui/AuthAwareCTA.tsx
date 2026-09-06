"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Tombol CTA beranda yang sadar status login.
 * - Sudah login  → "Buat Aduan" menuju /masyarakat/baru, plus "Dashboard Saya".
 * - Belum login → "Daftar & Buat Aduan" menuju /register, plus "Masuk".
 * - `variant="light"` untuk dipakai di atas latar gelap (CTA section).
 */
export default function AuthAwareCTA({
  className,
  variant = "inline",
}: {
  className?: string;
  variant?: "inline" | "light";
}) {
  const [user, setUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ? { email: data.user.email || "" } : null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ? { email: session.user.email || "" } : null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (variant === "light") {
    return (
      <div className={className}>
        {user ? (
          <Link
            href="/masyarakat/baru"
            className="btn bg-white text-brand-700 shadow-soft hover:bg-brand-50 active:scale-[0.98] w-full sm:w-auto"
          >
            Buat Aduan
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <>
            <Link
              href="/register"
              className="btn bg-white text-brand-700 shadow-soft hover:bg-brand-50 active:scale-[0.98] w-full sm:w-auto"
            >
              Daftar & Buat Aduan
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="btn border border-white/30 bg-white/10 text-white hover:bg-white/20 w-full sm:w-auto"
            >
              Sudah punya akun? Masuk
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {user ? (
        <Link href="/masyarakat/baru" className="btn-primary group w-full sm:w-auto">
          Buat Aduan
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : (
        <Link href="/register" className="btn-primary group w-full sm:w-auto">
          Buat Aduan Sekarang
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}