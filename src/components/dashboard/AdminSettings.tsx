"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Loader2, CheckCircle2, ImagePlus, X, Check, Image as ImageIcon } from "lucide-react";
import type { SiteSettings, ComplaintStaffListItem } from "@/lib/db-types";
import { saveSiteSettingsAction, uploadLogoAction } from "@/app/admin/actions";
import { getAssetUrl, getPhotoUrls } from "@/lib/storage";
import { categoryLabel, formatDateID } from "@/lib/utils";

interface Props {
  settings: SiteSettings | null;
  availableComplaints?: ComplaintStaffListItem[];
}

/**
 * Panel admin: pengaturan situs (FR-18) — nama, tagline, kontak (tampil di
 * footer) + logo situs yang dipakai di header & footer + seleksi foto showcase landing page.
 */
export default function AdminSettings({ settings, availableComplaints = [] }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [logoPath, setLogoPath] = useState<string | null>(
    settings?.logo_url ?? null
  );
  const [showcaseEnabled, setShowcaseEnabled] = useState<boolean>(
    settings?.showcase_enabled ?? true
  );

  // Parse ID aduan yang dipilih untuk showcase
  const initialSelectedIds = (() => {
    if (!settings?.showcase_ids) return [];
    try {
      const parsed = JSON.parse(settings.showcase_ids);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();
  const [selectedShowcaseIds, setSelectedShowcaseIds] = useState<string[]>(initialSelectedIds);

  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function toggleSelectComplaint(id: string) {
    setSelectedShowcaseIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

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
        showcaseEnabled,
        showcaseIds: selectedShowcaseIds.length > 0 ? JSON.stringify(selectedShowcaseIds) : null,
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

          {/* Toggle Showcase Landing Page */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-ink">
                  Showcase Bukti Selesai di Beranda
                </span>
                <p className="mt-0.5 text-xs text-ink-muted">
                  Tampilkan galeri berjalan (running marquee) komparasi foto bukti selesai di landing page.
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={showcaseEnabled}
                  onChange={(e) => setShowcaseEnabled(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-brand-600 peer-checked:after:translate-x-full peer-checked:after:border-white" />
              </label>
            </div>

            {/* Pilihan Foto Aduan yang Ditampilkan */}
            {showcaseEnabled && (
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-brand-700">
                      Pilih Foto Aduan Petugas untuk Showcase ({selectedShowcaseIds.length} Dipilih)
                    </h4>
                    <p className="text-xs text-ink-muted mt-0.5">
                      Klik pada kartu laporan yang ingin Anda tampilkan di landing page (jika tidak ada yang dipilih, sistem otomatis menampilkan laporan terbaru).
                    </p>
                  </div>
                  {selectedShowcaseIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedShowcaseIds([])}
                      className="text-xs font-semibold text-rose-600 hover:underline shrink-0"
                    >
                      Reset Pilihan
                    </button>
                  )}
                </div>

                {availableComplaints.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
                    <ImageIcon className="h-8 w-8 text-slate-300 mx-auto" />
                    <p className="mt-2 text-xs font-semibold text-ink-muted">
                      Belum ada aduan selesai dengan foto bukti yang tersedia.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
                    {availableComplaints.map((c) => {
                      const photos = getPhotoUrls(c.photo_url);
                      const thumb = photos[0];
                      const isSelected = selectedShowcaseIds.includes(c.id);

                      return (
                        <div
                          key={c.id}
                          onClick={() => toggleSelectComplaint(c.id)}
                          className={`relative cursor-pointer rounded-xl border p-2 transition-all ${
                            isSelected
                              ? "border-brand-500 bg-brand-50/40 ring-2 ring-brand-500/20 shadow-sm"
                              : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-100/60"
                          }`}
                        >
                          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-slate-200">
                            {thumb ? (
                              <img
                                src={thumb}
                                alt={c.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-400">
                                <ImageIcon className="h-6 w-6" />
                              </div>
                            )}

                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white shadow">
                                <Check className="h-3.5 w-3.5 stroke-[3]" />
                              </div>
                            )}
                          </div>

                          <div className="mt-2">
                            <span className="block text-[10px] font-bold text-brand-700 truncate">
                              {categoryLabel(c.category, c.category_note)}
                            </span>
                            <p className="text-xs font-semibold text-ink line-clamp-1">
                              {c.title}
                            </p>
                            <span className="text-[10px] text-ink-muted block mt-0.5">
                              {c.location || "Bojonegoro"} · {formatDateID(c.completed_at || c.created_at)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
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