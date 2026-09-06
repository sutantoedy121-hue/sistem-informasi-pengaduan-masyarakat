"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { loginAction, type AuthState } from "@/app/(auth)/actions";
import GoogleSignInButton from "@/components/ui/GoogleSignInButton";

export default function LoginPage({ searchParams }: { searchParams: { redirect?: string; error?: string } }) {
  const [state, setState] = useState<AuthState>(undefined);
  const [pending, startTransition] = useTransition();
  const [showPwd, setShowPwd] = useState(false);
  const router = useRouter();
  const redirect = searchParams.redirect || "/";

  const callbackError = searchParams.error === "callback"
    ? "Sesi gagal dipulihkan. Silakan masuk kembali."
    : undefined;
  const error = state?.error || callbackError;
  const success = state?.success;

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await loginAction(undefined, formData);
      setState(result);
      if (result?.redirectTo) {
        router.refresh();
        router.push(result.redirectTo);
      }
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 sm:py-12">
      <div className="w-full max-w-md">
        <div className="card p-8 shadow-card">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
              <ShieldCheck className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold text-ink">Masuk ke SIPMA</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Selamat datang kembali. Silakan masuk untuk melanjutkan.
            </p>
          </div>

          {error && (
            <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-6 rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-700">
              {success}
            </div>
          )}

          <form action={onSubmit} className="mt-8 space-y-4">
            <input type="hidden" name="redirect" value={redirect} />
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="nama@email.com"
                className="input-field mt-1.5"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-ink">
                  Kata Sandi
                </label>
                <Link href="#" className="text-xs font-medium text-brand-600 hover:underline">
                  Lupa sandi?
                </Link>
              </div>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  name="password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="input-field pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-muted"
                  aria-label={showPwd ? "Sembunyikan sandi" : "Tampilkan sandi"}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={pending} className="btn-primary w-full">
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Masuk"
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-ink-faint">atau</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <GoogleSignInButton className="mt-4" />

          <p className="mt-6 text-center text-sm text-ink-muted">
            Belum punya akun?{" "}
            <Link href="/register" className="font-semibold text-brand-600 hover:underline">
              Daftar sekarang
            </Link>
          </p>
        </div>

        <Link
          href="/"
          className="mt-6 flex items-center justify-center gap-1.5 text-sm text-ink-muted hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke beranda
        </Link>
      </div>
    </main>
  );
}
