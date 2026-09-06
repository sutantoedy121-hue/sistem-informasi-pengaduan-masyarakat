"use client";

/**
 * LocationPicker — tampilkan titik lokasi via iframe Google Maps (read-only),
 * lokasi diisi lewat:
 *   - tombol "Gunakan lokasi saya" (geolocation browser)
 *   - input koordinat lat/lng (fallback bila GPS tak tersedia / ingin manual)
 * Alamat dibalikkan (reverse-geocode) via Nominatim OpenStreetMap.
 *
 * iframe Google Maps embed TIDAK butuh API key:
 *   https://maps.google.com/maps?q=<lat>,<lng>&z=15&output=embed
 */
import { useCallback, useState } from "react";
import { LocateFixed, Loader2, MapPin, ExternalLink, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ZOOM = 16;

interface Props {
  initialLat?: number | null;
  initialLng?: number | null;
  onChange: (value: { lat: number; lng: number; address: string }) => void;
}

export default function LocationPicker({ initialLat, initialLng, onChange }: Props) {
  const [lat, setLat] = useState<number | null>(initialLat ?? null);
  const [lng, setLng] = useState<number | null>(initialLng ?? null);
  const [address, setAddress] = useState("");
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPoint = lat != null && lng != null;
  const mapSrc = hasPoint
    ? `https://maps.google.com/maps?q=${lat},${lng}&z=${ZOOM}&output=embed`
    : null;
  const mapsLink = hasPoint
    ? `https://www.google.com/maps?q=${lat},${lng}`
    : null;

  // Reverse geocode dari titik; update alamat + notify parent.
  const geocode = useCallback(
    async (la: number, ln: number) => {
      setGeocoding(true);
      setError(null);
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${la}&lon=${ln}&accept-language=id`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("gagal");
        const data = (await res.json()) as { display_name?: string };
        const text = data.display_name ?? "";
        // Hapus ", Indonesia" ganda di akhir
        const cleaned = text.replace(/,\s*Indonesia\s*$/gi, "").trim();
        setAddress(cleaned);
        onChange({ lat: la, lng: ln, address: cleaned });
      } catch {
        setError("Alamat tidak terbaca dari titik ini.");
        setAddress("");
        onChange({ lat: la, lng: ln, address: "" });
      } finally {
        setGeocoding(false);
      }
    },
    [onChange]
  );

  function updatePoint(la: number, ln: number) {
    setLat(la);
    setLng(ln);
    void geocode(la, ln);
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Browser ini tidak mendukung deteksi lokasi.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocating(false);
        updatePoint(latitude, longitude);
      },
      () => {
        setLocating(false);
        setError("Lokasi tidak bisa dideteksi. Izin lokasi mungkin ditolak.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function handleCoordChange(setter: (n: number | null) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value.trim();
      if (v === "") {
        setter(null);
        return;
      }
      const num = Number(v);
      setter(Number.isFinite(num) ? num : null);
    };
  }

  // Tombol "Pakai koordinat ini": bila keduanya valid → reverse geocode + peta.
  function confirmManualPoint() {
    if (lat != null && lng != null) updatePoint(lat, lng);
  }

  function clear() {
    setLat(null);
    setLng(null);
    setAddress("");
    setError(null);
    onChange({ lat: 0, lng: 0, address: "" });
  }

  return (
    <div>
      {/* Peta / placeholder */}
      <div className="relative">
        {mapSrc ? (
          <iframe
            title="Peta lokasi"
            src={mapSrc}
            width="100%"
            className="h-64 w-full rounded-2xl border border-slate-200 shadow-soft sm:h-72"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        ) : (
          <div className="flex h-64 w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center sm:h-72">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <MapPin className="h-5 w-5" />
            </span>
            <p className="max-w-xs px-6 text-sm text-ink-muted">
              Belum ada titik. Tekan{" "}
              <span className="font-semibold text-ink">Gunakan lokasi saya</span>{" "}
              atau isi koordinat di bawah.
            </p>
          </div>
        )}
      </div>

      {/* Aksi: GPS + hapus */}
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="btn-primary !px-3.5 !py-2 text-xs"
        >
          {locating ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Mendeteksi...
            </>
          ) : (
            <>
              <LocateFixed className="h-3.5 w-3.5" />
              Gunakan lokasi saya
            </>
          )}
        </button>

        {hasPoint && (
          <>
            {mapsLink && (
              <a
                href={mapsLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Buka di Google Maps
              </a>
            )}
            <button
              type="button"
              onClick={clear}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50"
            >
              <X className="h-3.5 w-3.5" />
              Hapus titik
            </button>
          </>
        )}
      </div>

      {/* Input koordinat manual */}
      <div className="mt-2.5 grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="loc-lat" className="block text-xs font-medium text-ink-muted">
            Latitude (lintang)
          </label>
          <div className="relative mt-1">
            <input
              id="loc-lat"
              type="text"
              inputMode="decimal"
              value={lat?.toFixed(6) ?? ""}
              onChange={handleCoordChange(setLat)}
              placeholder="-7.1497"
              className="input-field !px-3 !py-2 !text-xs font-mono"
            />
          </div>
        </div>
        <div>
          <label htmlFor="loc-lng" className="block text-xs font-medium text-ink-muted">
            Longitude (bujur)
          </label>
          <div className="relative mt-1">
            <input
              id="loc-lng"
              type="text"
              inputMode="decimal"
              value={lng?.toFixed(6) ?? ""}
              onChange={handleCoordChange(setLng)}
              placeholder="111.8814"
              className="input-field !px-3 !py-2 !text-xs font-mono"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={confirmManualPoint}
          className="col-span-2 btn-secondary !py-2 text-xs"
        >
          Pakai koordinat ini
        </button>
      </div>

      {/* Alamat hasil */}
      <div className="mt-2.5 flex items-start gap-1.5 text-sm">
        <MapPin
          className={cn(
            "mt-2.5 h-4 w-4 shrink-0",
            address ? "text-brand-600" : "text-ink-faint"
          )}
        />
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Alamat hasil dari titik (bisa diedit manual)."
          className="input-field !p-2.5 !text-sm"
          aria-label="Alamat lokasi"
        />
      </div>

      {geocoding && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-muted">
          <Loader2 className="h-3 w-3 animate-spin text-brand-600" />
          Membaca alamat dari titik...
        </p>
      )}
      {error && (
        <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>
      )}
    </div>
  );
}