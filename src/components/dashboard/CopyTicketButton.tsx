"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  ticket: string;
  /** true bila tombol ditaruh di atas latar gelap (mis. header brand). */
  onDark?: boolean;
  className?: string;
}

/**
 * Tombol salin nomor tiket. Mengganti label Salin → Tersalin sesaat
 * setelah berhasil menyalin ke clipboard.
 */
export default function CopyTicketButton({ ticket, onDark = false, className }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(ticket);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard tidak tersedia — abaikan
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Salin nomor tiket"
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors",
        onDark
          ? "bg-white/15 text-white backdrop-blur hover:bg-white/25"
          : "border border-slate-200 bg-white text-ink hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700",
        className
      )}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          Tersalin
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Salin
        </>
      )}
    </button>
  );
}
