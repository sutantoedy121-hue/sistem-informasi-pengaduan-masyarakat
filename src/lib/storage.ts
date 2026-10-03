/** Helper akses file foto di Supabase Storage (bucket "complaint-photos"). */

export const STORAGE_BUCKET = "complaint-photos";
/** Bucket publik untuk aset situs (logo, dll), dikelola di pengaturan situs. */
export const ASSET_BUCKET = "site-assets";
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

/**
 * Ubah path storage (mis. "<uid>/<file>.jpg") menjadi URL publik.
 * Bucket bersifat public sehingga URL langsung bisa ditampilkan via <img>.
 */
export function getPhotoUrl(
  path: string | null | undefined
): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
}

/**
 * Kolom `photo_url` menyimpan satu path (data lama) ATAU array path dalam
 * bentuk JSON string (data baru, multi-foto). Fungsi ini menormalkan
 * keduanya menjadi array path (tanpa URL).
 */
export function parsePhotoPaths(
  value: string | null | undefined
): string[] {
  if (!value) return [];
  const trimmed = value.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter((p): p is string => typeof p === "string" && p.length > 0);
      }
    } catch {
      /* bukan JSON valid — perlakukan sebagai path tunggal */
    }
  }
  return [trimmed];
}

/** Semua URL publik dari nilai `photo_url` (mendukung multi-foto). */
export function getPhotoUrls(value: string | null | undefined): string[] {
  return parsePhotoPaths(value)
    .map((p) => getPhotoUrl(p))
    .filter((u): u is string => Boolean(u));
}

/**
 * URL publik untuk aset situs (logo). Path relative dianggap nama file di
 * bucket ASSET_BUCKET; URL absolut dipakai apa adanya.
 */
export function getAssetUrl(
  path: string | null | undefined
): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/${ASSET_BUCKET}/${path}`;
}
