"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, useRef, useCallback } from "react";
import {
  AlertCircle,
  Camera,
  Info,
  Loader2,
  LocateFixed,
  MapPin,
  Send,
} from "lucide-react";
import type { Category } from "@/lib/db-types";
import { submitComplaintAction, type ActionResult } from "@/app/masyarakat/actions";
import PhotoUpload from "@/components/forms/PhotoUpload";
import LocationPicker from "@/components/forms/LocationPicker";
import { categoryLabel } from "@/lib/utils";

interface Props {
  categories: Category[];
}

export default function NewComplaintForm({ categories }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedSlug = searchParams.get("kategori") || "";
  const preselected =
    categories.find((c) => c.slug === preselectedSlug)?.id || "";

  const [categoryId, setCategoryId] = useState(preselected);
  const [categoryNote, setCategoryNote] = useState("");
  const [title, setTitle] = useState("");
  const selectedCategory = categories.find((c) => c.id === categoryId);
  const isLainnya = selectedCategory?.slug === "lainnya";
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [locationDetail, setLocationDetail] = useState("");
  const [locationCoord, setLocationCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const handleLocationChange = useCallback(
    (value: { lat: number; lng: number; address: string }) => {
      setLocation(value.address);
      setLocationCoord({ lat: value.lat, lng: value.lng });
    },
    []
  );

  async function onSubmit(formData: FormData) {
    // Ambil file dari FormData lalu kirim ke server action
    startTransition(async () => {
      const result: ActionResult = await submitComplaintAction({
        categoryId,
        categoryNote: isLainnya ? categoryNote : undefined,
        title,
        description,
        location,
        locationDetail,
        lat: locationCoord?.lat,
        lng: locationCoord?.lng,
        photoUrl: photoPath || undefined,
      });
      if (result && "error" in result) {
        setError(result.error || "Terjadi kesalahan.");
        setSuccess(null);
        return;
      }
      setError(null);
      if (result && "success" in result) setSuccess(result.success || "Berhasil.");
      const redirectTo = result && "redirectTo" in result ? result.redirectTo : undefined;
      if (redirectTo) {
        router.refresh();
        router.push(redirectTo);
      }
    });
  }

  return (
    <form ref={formRef} action={onSubmit} className="mt-6 space-y-6">
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-700">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      {/* Kategori */}
      <div className="card p-6">
        <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-50 text-[11px] font-extrabold text-brand-700">
            1
          </span>
          Kategori Aduan
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryId(c.id)}
              className={`rounded-xl border p-4 text-left transition-all ${
                categoryId === c.id
                  ? "border-brand-500 bg-brand-50/70 ring-1 ring-brand-300"
                  : "border-slate-200 hover:border-brand-200 hover:bg-brand-50/30"
              }`}
            >
              <span
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-extrabold ${
                  c.color || "bg-brand-50 text-brand-700"
                }`}
              >
                {c.name.charAt(0)}
              </span>
              <span className="mt-2 block text-xs font-semibold text-ink">
                {c.name}
              </span>
              {c.description && (
                <span className="mt-0.5 line-clamp-2 block text-[11px] leading-relaxed text-ink-muted">
                  {c.description}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Catatan untuk kategori Lainnya */}
        {isLainnya && (
          <div className="mt-4">
            <label
              htmlFor="categoryNote"
              className="block text-sm font-medium text-ink"
            >
              Jenis Keluhan <span className="text-rose-500">*</span>
            </label>
            <input
              id="categoryNote"
              type="text"
              value={categoryNote}
              onChange={(e) => setCategoryNote(e.target.value)}
              maxLength={200}
              required
              placeholder="Tuliskan jenis keluhanmu, contoh: Kabel Putus"
              className="input-field mt-1.5"
            />
            <p className="mt-1 text-right text-xs text-ink-faint">
              {categoryNote.length}/200
            </p>
          </div>
        )}
      </div>

      {/* Detail aduan */}
      <div className="card p-6">
        <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-50 text-[11px] font-extrabold text-brand-700">
            2
          </span>
          Detail Aduan
        </h2>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-ink">
              Judul Aduan <span className="text-rose-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              required
              placeholder="Ringkas masalah yang kamu alami, contoh: Jalan berlubang di depan SDN Banjarejo 1 Bojonegoro"
              className="input-field mt-1.5"
            />
            <p className="mt-1 text-right text-xs text-ink-faint">
              {title.length}/120
            </p>
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-ink"
            >
              Deskripsi Lengkap <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              required
              rows={5}
              placeholder="Jelaskan kronologi, kondisi di lapangan, dan hal lain yang membantu petugas menindaklanjuti."
              className="input-field mt-1.5 resize-y"
            />
            <p className="mt-1 text-right text-xs text-ink-faint">
              {description.length}/2000
            </p>
          </div>

          {/* Lokasi via peta */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-ink">
              <LocateFixed className="h-4 w-4" />
              Titik Lokasi <span className="font-normal text-ink-faint">(disarankan)</span>
            </label>
            <p className="mb-2 mt-0.5 text-xs text-ink-muted">
              Ketuk peta untuk menaruh titik, atau tekan “Gunakan lokasi saya”.
              Alamat otomatis terbaca dari titik tersebut (bisa diedit).
            </p>
            <LocationPicker onChange={handleLocationChange} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-ink">
                <MapPin className="mr-1 inline h-3.5 w-3.5" />
                Alamat Lengkap
              </label>
              <input
                id="location"
                name="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Alamat hasil titik di peta, bisa diedit manual."
                className="input-field mt-1.5"
              />
            </div>
            <div>
              <label htmlFor="locationDetail" className="block text-sm font-medium text-ink">
                <MapPin className="mr-1 inline h-3.5 w-3.5" />
                Detail Lokasi <span className="font-normal text-ink-faint">(opsional)</span>
              </label>
              <input
                id="locationDetail"
                name="locationDetail"
                type="text"
                value={locationDetail}
                onChange={(e) => setLocationDetail(e.target.value)}
                maxLength={200}
                placeholder="Contoh: depan toko Madura, dekat masjid"
                className="input-field mt-1.5"
              />
              <p className="mt-1 text-right text-xs text-ink-faint">
                {locationDetail.length}/200
              </p>
            </div>
          </div>

          {/* Foto */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-ink">
              <Camera className="h-4 w-4" />
              Foto Bukti <span className="font-normal text-ink-faint">(opsional, disarankan)</span>
            </label>
            <div className="mt-1.5">
              <PhotoUpload onUploaded={(path) => setPhotoPath(path)} />
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary"
          disabled={pending}
        >
          Batal
        </button>
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Mengirim aduan...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Kirim Aduan
            </>
          )}
        </button>
      </div>
    </form>
  );
}
