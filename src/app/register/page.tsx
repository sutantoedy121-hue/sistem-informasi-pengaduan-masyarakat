"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, Check, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { registerAction, type AuthState } from "@/app/(auth)/actions";
import GoogleSignInButton from "@/components/ui/GoogleSignInButton";

const benefits = [
  "Buat aduan dengan nomor tiket otomatis",
  "Lacak status penanganan real-time",
  "Terima notifikasi pembaruan aduan",
  "Lihat dokumentasi bukti penanganan",
];

export default function RegisterPage() {
  const [state, setState] = useState<AuthState>(undefined);
  const [pending, startTransition] = useTransition();
  const [showPwd, setShowPwd] = useState(false);
  const router = useRouter();

  const error = state?.error;
  const success = state?.success;

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await registerAction(undefined, formData);
      setState(result);
      if (result?.redirectTo) {
        router.refresh();
        router.push(result.redirectTo);
      }
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 sm:py-12">
      <div className="w-full max-w-5xl">
        <div className="card overflow-hidden shadow-card">
          <div className="grid md:grid-cols-2">
            {/* Left: benefits */}
            <div className="relative hidden flex-col justify-between bg-brand-600 p-8 text-white md:flex">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                  <ShieldCheck className="h-6 w-6" strokeWidth={2.5} />
                </div>
                <h2 className="mt-5 text-2xl font-extrabold leading-tight">
                  Bergabung sebagai warga aktif
                </h2>
                <p className="mt-2 text-sm text-brand-100">
                  SIPMA Kabupaten Bojonegoro memberi kamu kendali penuh atas setiap
                  pengaduan yang kamu ajukan.
                </p>

                <ul className="mt-6 space-y-3">
                  {benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                        <Check className="h-3 w-3" />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="mt-8 text-xs text-brand-100">
                © {new Date().getFullYear()} Kabupaten Bojonegoro
              </p>
            </div>

            {/* Right: form */}
            <div className="p-6 sm:p-8">
              <h1 className="text-2xl font-extrabold text-ink">Daftar Akun</h1>
              <p className="mt-1 text-sm text-ink-muted">
                Buat akun masyarakat untuk mulai mengajukan aduan.
              </p>

              {error && (
                <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              )}
              {success && (
                <div className="mt-5 rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-700">
                  {success}
                </div>
              )}

              <form action={onSubmit} className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-ink">
                      Nama Depan
                    </label>
                    <input id="firstName" name="firstName" type="text" required placeholder="Budi" className="input-field mt-1.5" />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-ink">
                      Nama Belakang
                    </label>
                    <input id="lastName" name="lastName" type="text" placeholder="Santoso" className="input-field mt-1.5" />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-ink">
                    Email
                  </label>
                  <input id="email" name="email" type="email" autoComplete="email" required placeholder="nama@email.com" className="input-field mt-1.5" />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-ink">
                    No. Telepon
                  </label>
                  <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="0812..." className="input-field mt-1.5" />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-ink">
                    Kata Sandi
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="password"
                      name="password"
                      type={showPwd ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      placeholder="Min. 6 karakter"
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

                <label className="flex items-start gap-2 text-xs text-ink-muted">
                  <input type="checkbox" required className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-300" />
                  Saya menyetujui ketentuan dan kebijakan privasi SIPMA.
                </label>

                <button type="submit" disabled={pending} className="btn-primary w-full">
                  {pending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Mendaftarkan...
                    </>
                  ) : (
                    "Daftar Sekarang"
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
                Sudah punya akun?{" "}
                <Link href="/login" className="font-semibold text-brand-600 hover:underline">
                  Masuk di sini
                </Link>
              </p>
            </div>
          </div>
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
