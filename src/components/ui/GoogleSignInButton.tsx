"use client";

import { useState } from "react";
import { Chrome } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Tombol "Masuk dengan Google".
 * Memicu OAuth flow Supabase (provider Google) lalu redirect ke /auth/callback.
 * BUTUH konfigurasi di Supabase Dashboard → Authentication → Providers → Google
 * (lihat supabase/google-login-setup.md). Jika provider belum diaktifkan,
 * Supabase akan mengembalikan error "provider is not enabled".
 */
export default function GoogleSignInButton({
  className,
}: {
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogle() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
      }
      // sukses → browser dialihkan ke Google; komponen tak perlu setState lagi.
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memulai masuk Google.");
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading}
        className="btn-ghost w-full justify-center gap-2 border border-slate-200 bg-white text-ink hover:bg-slate-50"
      >
        <Chrome className="h-4 w-4 text-brand-600" />
        {loading ? "Menyambungkan ke Google..." : "Masuk dengan Google"}
      </button>
      {error && (
        <p className="mt-2 text-xs text-rose-600">{error}</p>
      )}
    </div>
  );
}