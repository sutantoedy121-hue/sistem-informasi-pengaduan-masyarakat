"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getAssetUrl } from "@/lib/storage";

interface Props {
  /** Label role di samping nama situs (Masyarakat, Petugas, Pimpinan, Admin). */
  roleLabel: string;
}

/**
 * Brand/logo untuk header panel (dipakai Masyarakat/Petugas/Pimpinan/Admin
 * header). Menampilkan logo situs dari `site_settings` bila diset admin,
 * fallback ke ikon bayangan bila belum ada.
 */
export default function PanelBrand({ roleLabel }: Props) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();
    async function loadLogo() {
      try {
        const { data } = await supabase
          .from("site_settings")
          .select("logo_url")
          .eq("id", 1)
          .maybeSingle();
        if (mounted && data?.logo_url) setLogoUrl(getAssetUrl(data.logo_url));
      } catch {
        /* abaikan — fallback ikon */
      }
    }
    loadLogo();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Link href="/" className="flex min-w-0 items-center gap-2.5">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt="Logo SIPMA"
          className="h-10 w-auto max-w-[120px] shrink-0 object-contain"
        />
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-soft">
          <ShieldCheck className="h-5 w-5" strokeWidth={2.5} />
        </div>
      )}
      <div className="flex min-w-0 flex-col leading-none">
        <span className="flex items-center gap-2 text-base font-extrabold tracking-tight text-ink">
          SIPMA
          <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-700">
            {roleLabel}
          </span>
        </span>
        <span className="truncate text-[10px] font-medium text-ink-muted">
          Kabupaten Bojonegoro
        </span>
      </div>
    </Link>
  );
}