"use client";

import { useRef, useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  /** Dipanggil dengan daftar path storage (urut sesuai upload). */
  onUploaded: (paths: string[]) => void;
  /** Batas jumlah foto (default 5). */
  max?: number;
}

const MAX_SIZE = 5 * 1024 * 1024;
const SAFE_EXT = ["jpg", "jpeg", "png", "webp", "gif"];

type Item = { path: string; url: string };

/**
 * Drop-zone upload foto ke Supabase Storage (bucket complaint-photos).
 * Mendukung banyak foto sekaligus (input multiple). RLS membatasi path
 * upload ke "<user.id>/...". Hasil = array path storage.
 */
export default function PhotoUpload({ onUploaded, max = 5 }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function emit(next: Item[]) {
    setItems(next);
    onUploaded(next.map((i) => i.path));
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    const room = max - items.length;
    if (room <= 0) {
      setError(`Maksimal ${max} foto.`);
      return;
    }
    const chosen = files.slice(0, room);

    for (const f of chosen) {
      if (!f.type.startsWith("image/")) {
        setError("File harus berupa gambar (JPG/PNG/WebP).");
        return;
      }
      if (f.size > MAX_SIZE) {
        setError("Ukuran tiap foto maksimal 5 MB.");
        return;
      }
    }

    setError(null);
    setUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi tidak ditemukan. Silakan masuk ulang.");

      const uploaded = await Promise.all(
        chosen.map(async (file) => {
          const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
          const safeExt = SAFE_EXT.includes(ext) ? ext : "jpg";
          const fileName = `${Date.now()}-${Math.round(Math.random() * 1e6)}.${safeExt}`;
          const filePath = `${user.id}/${fileName}`;

          const { error: upErr } = await supabase.storage
            .from("complaint-photos")
            .upload(filePath, file, {
              cacheControl: "3600",
              upsert: false,
              contentType: file.type,
            });
          if (upErr) throw upErr;
          return { path: filePath, url: URL.createObjectURL(file) };
        })
      );

      emit([...items, ...uploaded]);
    } catch (e) {
      console.error("Upload gagal:", e);
      setError("Sebagian foto gagal diunggah. Periksa koneksi lalu coba lagi.");
    } finally {
      setUploading(false);
    }
  }

  function removeAt(idx: number) {
    emit(items.filter((_, i) => i !== idx));
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      {/* Grid Foto yang telah dipilih/diunggah */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map((it, i) => (
            <div
              key={it.path}
              className="group relative aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm"
            >
              <img
                src={it.url}
                alt={`Foto ${i + 1}`}
                className="h-full w-full object-cover"
              />
              <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                Foto {i + 1}
              </span>
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white shadow hover:bg-rose-700"
                aria-label={`Hapus foto ${i + 1}`}
                title="Hapus foto ini"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {/* Tombol Tambah Foto Lagi (model slot card di sebelah foto yang sudah ada) */}
          {items.length < max && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex aspect-video flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-brand-300 bg-brand-50/50 p-2 text-center text-brand-700 transition-colors hover:border-brand-400 hover:bg-brand-50 disabled:opacity-60"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-[11px] font-medium">Mengunggah...</span>
                </>
              ) : (
                <>
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-xs font-bold">+ Tambah Foto</span>
                  <span className="text-[10px] text-brand-600">
                    ({items.length}/{max})
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Tombol Utama ketika belum ada foto sama sekali */}
      {items.length === 0 && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center transition-colors hover:border-brand-300 hover:bg-brand-50/40 disabled:opacity-60"
        >
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
              <span className="text-sm font-medium text-ink-muted">Mengunggah...</span>
            </>
          ) : (
            <>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <ImagePlus className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-ink">
                Klik untuk unggah foto (bisa lebih dari 1)
              </span>
              <span className="text-xs text-ink-faint">
                Bisa pilih banyak sekaligus atau tambah bertahap · Maks. {max} foto (JPG/PNG/WebP maks. 5 MB)
              </span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
}
