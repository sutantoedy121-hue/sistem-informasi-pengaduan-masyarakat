"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Loader2, CheckCircle2, ImagePlus, X } from "lucide-react";
import type { SiteSettings } from "@/lib/db-types";
import { saveSiteSettingsAction, uploadLogoAction } from "@/app/admin/actions";
import { getAssetUrl } from "@/lib/storage";

interface Props {
  settings: SiteSettings | null;
}

/**
 * Panel admin: pengaturan situs (FR-18) — nama, tagline, kontak (tampil di
 * footer) + logo situs yang dipakai di header & footer. Upload logo lewat
 * server action service-role ke bucket publik "site-assets".
 */
export default function AdminSettings({ settings }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [logoPath, setLogoPath] = useState<string | null>(
    settings?.logo_url ?? null
  );
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleLogoFile(file: File | undefined | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Logo harus berupa gambar (JPG/PNG/WebP/SVG).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Ukuran logo maksimal 2 MB.");
      return;
    }

    setError(null);
    setSuccess(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const result = await uploadLogoAction(fd);
      if (result && "error" in result) {
        setError(result.error || "Logo gagal diunggah.");
        return;
      }
      if (!result?.path) throw new Error("upload empty");
      setLogoPath(result.path);
    } catch (e) {
      console.error("Upload logo gagal:", e);
      setError("Logo gagal diunggah. Periksa koneksi lalu coba lagi.");
    } finally {
      setUploading(false);
    }
  }

  function clearLogo() {
    setLogoPath(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function submit(formData: FormData) {
    startTransition(async () => {
      setError(null);
      setSuccess(null);
      const result = await saveSiteSettingsAction({
        siteName: String(formData.get("siteName") || ""),
        tagline: String(formData.get("tagline") || "") || undefined,
        contactPhone: String(formData.get("contactPhone") || "") || undefined,
        contactEmail: String(formData.get("contactEmail") || "") || undefined,
        contactAddress: String(formData.get("contactAddress") || "") || undefined,
        logoUrl: logoPath ?? undefined,
      });
      if (result && "error" in result) {
        setError(result.error || "Terjadi kesalahan.");
        return;
      }
      setSuccess(result && "success" in result ? result.success : "Tersimpan.");
      router.refresh();
    });
  }

  const logoUrl = getAssetUrl(logoPath);

  return (
    <div className="container-page py-8">
      <div className="mx-auto max-w-2xl">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
            Pengaturan Situs
          </h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            Nama, tagline, kontak, dan logo tampil di beranda publik &amp; footer.
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {success}
          </div>
        )}

        <form action={submit} className="mt-6 space-y-4">
          {/* Logo */}
          <div className="rounded-2xl border border-slate-200 p-5">
            <label className="block text-sm font-medium text-ink">
              Logo Situs
            </label>
            <p className="mt-0.5 text-xs text-ink-muted">
              Ditampilkan di header &amp; footer. PNG/SVG dengan latar transparan
              disarankan, maks. 2 MB.
            </p>
            <div className="mt-3">
              {logoUrl ? (
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <img
                    src={logoUrl}
                    alt="Pratinjau logo"
                    className="h-12 w-auto max-w-[220px] object-contain"
                  />
                  <button
                    type="button"
                    onClick={clearLogo}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-muted hover:text-rose-700"
                  >
                    <X className="h-3.5 w-3.5" />
                    Hapus logo
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-8 text-center transition-colors hover:border-brand-300 hover:bg-brand-50/40 disabled:opacity-60"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
                      <span className="text-sm font-medium text-ink-muted">
                        Mengunggah...
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                        <ImagePlus className="h-5 w-5" />
                      </span>
                      <span className="text-sm font-semibold text-ink">
                        Klik untuk unggah logo
                      </span>
                      <span className="text-xs text-ink-faint">
                        JPG / PNG / WebP / SVG · maks. 2 MB
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                handleLogoFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>

          <div>
            <label htmlFor="siteName" className="block text-sm font-medium text-ink">
              Nama Situs <span className="text-rose-500">*</span>
            </label>
            <input
              id="siteName"
              name="siteName"
              type="text"
              required
              maxLength={60}
              defaultValue={settings?.site_name ?? "SIPMA"}
              className="input-field mt-1.5"
            />
          </div>
          <div>
            <label htmlFor="tagline" className="block text-sm font-medium text-ink">
              Tagline
            </label>
            <input
              id="tagline"
              name="tagline"
              type="text"
              maxLength={120}
              defaultValue={settings?.tagline ?? ""}
              className="input-field mt-1.5"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="contactPhone" className="block text-sm font-medium text-ink">
                Telepon Kontak
              </label>
              <input
                id="contactPhone"
                name="contactPhone"
                type="text"
                maxLength={30}
                defaultValue={settings?.contact_phone ?? ""}
                className="input-field mt-1.5"
              />
            </div>
            <div>
              <label htmlFor="contactEmail" className="block text-sm font-medium text-ink">
                Email Kontak
              </label>
              <input
                id="contactEmail"
                name="contactEmail"
                type="email"
                maxLength={80}
                defaultValue={settings?.contact_email ?? ""}
                className="input-field mt-1.5"
              />
            </div>
          </div>
          <div>
            <label htmlFor="contactAddress" className="block text-sm font-medium text-ink">
              Alamat
            </label>
            <textarea
              id="contactAddress"
              name="contactAddress"
              rows={3}
              maxLength={200}
              defaultValue={settings?.contact_address ?? ""}
              className="input-field mt-1.5 resize-y"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button type="submit" disabled={pending || uploading} className="btn-primary">
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Pengaturan"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}