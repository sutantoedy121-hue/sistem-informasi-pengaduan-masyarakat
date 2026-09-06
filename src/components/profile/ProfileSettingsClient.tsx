"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ArrowLeft,
  AtSign,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
  User,
  UserCircle,
} from "lucide-react";
import type { UserRole } from "@/lib/db-types";
import {
  updateProfileAction,
  changePasswordAction,
  type AuthState,
} from "@/app/(auth)/actions";

const ROLE_LABEL: Record<UserRole, string> = {
  masyarakat: "Masyarakat",
  petugas: "Petugas",
  pimpinan: "Pimpinan",
  admin: "Admin",
};

const ROLE_HOME: Record<UserRole, string> = {
  masyarakat: "/masyarakat",
  petugas: "/petugas",
  pimpinan: "/pimpinan",
  admin: "/admin",
};

interface Props {
  email: string;
  fullName: string;
  role: UserRole;
  provider: string | null;
}

/**
 * Pengaturan profil untuk semua role. Dua kartu:
 * 1. Profil — ubah nama lengkap (umum; berguna untuk akun Google yang awalnya
 *    memakai nama dari Google).
 * 2. Keamanan — ganti kata sandi (masukkan sandi lama → sandi baru → konfirmasi).
 *    Akun yang login via Google tidak punya kata sandi, blok ini disembunyikan.
 */
export default function ProfileSettingsClient({
  email,
  fullName,
  role,
  provider,
}: Props) {
  const router = useRouter();
  const home = ROLE_HOME[role] || "/";

  const [nameState, setNameState] = useState<AuthState>(undefined);
  const [namePending, startNameTransition] = useTransition();

  const [pwdState, setPwdState] = useState<AuthState>(undefined);
  const [pwdPending, startPwdTransition] = useTransition();
  const [showPwd, setShowPwd] = useState<Record<string, boolean>>({});

  const isOAuth = provider === "google";
  const profileError = nameState?.error;
  const profileSuccess = nameState?.success;
  const pwdError = pwdState?.error;
  const pwdSuccess = pwdState?.success;

  const togglePwd = (key: string) =>
    setShowPwd((s) => ({ ...s, [key]: !s[key] }));

  function onNameSubmit(formData: FormData) {
    startNameTransition(async () => {
      const result = await updateProfileAction(undefined, formData);
      setNameState(result);
      if (!result?.error) router.refresh();
    });
  }

  function onPwdSubmit(formData: FormData) {
    startPwdTransition(async () => {
      const result = await changePasswordAction(undefined, formData);
      setPwdState(result);
      if (result?.error) {
        (formData as FormData).set("currentPassword", "");
        (formData as FormData).set("newPassword", "");
        (formData as FormData).set("confirmPassword", "");
      } else {
        // Ganti sandi sukses → bersihkan form + revalidate
        router.refresh();
      }
    });
  }

  return (
    <main className="flex-1 pb-16">
      <div className="container-page py-8">
        <div className="mx-auto max-w-2xl">
          <Link
            href={home}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-brand-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke {role === "masyarakat" ? "Dashboard" : "Panel"}
          </Link>

          <div className="mt-4">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              Pengaturan Profil
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              Kelola nama dan keamanan akunmu.
            </p>
          </div>

          {/* Kartu info akun */}
          <div className="card mt-6 flex items-center gap-4 p-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
              <UserCircle className="h-8 w-8" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-extrabold text-ink">
                {fullName || "Pengguna"}
              </p>
              <p className="flex items-center gap-1.5 text-sm text-ink-muted">
                <AtSign className="h-3.5 w-3.5" />
                <span className="truncate">{email}</span>
              </p>
            </div>
            <span className="ml-auto shrink-0 badge bg-brand-50 text-brand-700 ring-1 ring-brand-100">
              <ShieldCheck className="h-3 w-3" />
              {ROLE_LABEL[role]}
            </span>
          </div>

          {/* Kartu: ubah nama */}
          <div className="card mt-6 p-6">
            <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
              <User className="h-4 w-4 text-brand-600" />
              Nama Lengkap
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              {isOAuth
                ? "Nama kamu diambil dari akun Google. Ubah di sini bila ingin memakai nama lain."
                : "Nama yang ditampilkan pada aduan & riwayat."}
            </p>

            {profileSuccess && (
              <div className="mt-4 rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-700">
                {profileSuccess}
              </div>
            )}
            {profileError && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {profileError}
              </div>
            )}

            <form action={onNameSubmit} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-ink"
                >
                  Nama Lengkap
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  maxLength={80}
                  defaultValue={fullName}
                  className="input-field mt-1.5"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={namePending}
                  className="btn-primary"
                >
                  {namePending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Nama"
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Kartu: ganti kata sandi (sembunyikan utk akun Google) */}
          {!isOAuth && (
            <div className="card mt-6 p-6">
              <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
                <KeyRound className="h-4 w-4 text-brand-600" />
                Ganti Kata Sandi
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                Masukkan kata sandi saat ini, lalu buat kata sandi baru.
              </p>

              {pwdSuccess && (
                <div className="mt-4 rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-700">
                  {pwdSuccess}
                </div>
              )}
              {pwdError && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {pwdError}
                </div>
              )}

              <form action={onPwdSubmit} className="mt-4 space-y-4">
                <div>
                  <label
                    htmlFor="currentPassword"
                    className="block text-sm font-medium text-ink"
                  >
                    Kata Sandi Saat Ini
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="currentPassword"
                      name="currentPassword"
                      type={showPwd.current ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      placeholder="••••••••"
                      className="input-field pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => togglePwd("current")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-muted"
                      aria-label={showPwd.current ? "Sembunyikan sandi" : "Tampilkan sandi"}
                    >
                      {showPwd.current ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="newPassword"
                      className="block text-sm font-medium text-ink"
                    >
                      Kata Sandi Baru
                    </label>
                    <div className="relative mt-1.5">
                      <input
                        id="newPassword"
                        name="newPassword"
                        type={showPwd.new ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        minLength={6}
                        placeholder="Min. 6 karakter"
                        className="input-field pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => togglePwd("new")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-muted"
                        aria-label={showPwd.new ? "Sembunyikan sandi" : "Tampilkan sandi"}
                      >
                        {showPwd.new ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-ink"
                    >
                      Konfirmasi Sandi Baru
                    </label>
                    <div className="relative mt-1.5">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPwd.confirm ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        minLength={6}
                        placeholder="Ulangi sandi baru"
                        className="input-field pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => togglePwd("confirm")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-muted"
                        aria-label={showPwd.confirm ? "Sembunyikan sandi" : "Tampilkan sandi"}
                      >
                        {showPwd.confirm ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={pwdPending}
                    className="btn-primary"
                  >
                    {pwdPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Mengubah...
                      </>
                    ) : (
                      "Ganti Kata Sandi"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {isOAuth && (
            <div className="mt-6 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink-muted">
              <Mail className="h-4 w-4 shrink-0 text-brand-600" />
              Kamu masuk memakai <span className="font-semibold">Google</span> —
              kata sandi dikelola akun Google-mu.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}