"use client";

import { useRef, useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  onUploaded: (path: string | null) => void;
}

/**
 * Drop-zone upload foto ke Supabase Storage (bucket complaint-photos).
 * RLS membatasi path upload ke "<user.id>/...". Hasil upload berupa path
 * storage (mis. "<user.id>/<file>.jpg") yang diteruskan ke parent.
 */
export default function PhotoUpload({ onUploaded }: Props) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined | null) {
    if (!file) return;
    // Hanya gambar
    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar (JPG/PNG/WebP).");
      return;
    }
    // Batas 5 MB
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran foto maksimal 5 MB.");
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi tidak ditemukan. Silakan masuk ulang.");

      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)
        ? ext
        : "jpg";
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1e6)}.${safeExt}`;
      // Prefix path harus UID user (sesuai RLS: storage.foldername(name)[1] = auth.uid())
      const filePath = `${user.id}/${fileName}`;

      const { error: upErr } = await supabase.storage
        .from("complaint-photos")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });
      if (upErr) throw upErr;

      // Preview lokal tidak butuh URL publik; cukup object URL.
      setPreview(URL.createObjectURL(file));
      onUploaded(filePath);
    } catch (e) {
      console.error("Upload gagal:", e);
      setError(
        "Foto gagal diunggah. Periksa koneksi lalu coba lagi."
      );
    } finally {
      setUploading(false);
    }
  }

  function clearPhoto() {
    setPreview(null);
    onUploaded(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      {preview ? (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200">
          <img
            src={preview}
            alt="Pratinjau foto aduan"
            className="h-48 w-full object-cover"
          />
          <button
            type="button"
            onClick={clearPhoto}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70"
            aria-label="Hapus foto"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center transition-colors hover:border-brand-300 hover:bg-brand-50/40 disabled:opacity-60"
        >
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
              <span className="text-sm font-medium text-ink-muted">
                Mengunggah...
              </span>
            </>
          ) : (
            <>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <ImagePlus className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-ink">
                Klik untuk unggah foto
              </span>
              <span className="text-xs text-ink-faint">
                JPG / PNG / WebP · maks. 5 MB
              </span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {error && (
        <p className="mt-2 text-xs font-medium text-rose-600">{error}</p>
      )}
    </div>
  );
}
