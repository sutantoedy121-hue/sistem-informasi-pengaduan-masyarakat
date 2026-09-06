"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star, Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { rateComplaintAction } from "@/app/masyarakat/actions";

interface Props {
  complaintId: string;
  alreadyRated: boolean;
}

const RATING_LABELS = [
  "Sangat buruk",
  "Buruk",
  "Cukup",
  "Baik",
  "Sangat baik",
];

/**
 * FR-06 — Konfirmasi & penilaian penanganan selesai.
 * Tampil hanya saat status aduan = selesai dan pelapor belum menilai.
 */
export default function RatingSection({ complaintId, alreadyRated }: Props) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      setError("Pilih bintang 1–5 untuk menilai penanganan.");
      return;
    }
    startTransition(async () => {
      const result = await rateComplaintAction(complaintId, rating, note);
      if (result && "error" in result) {
        setError(result.error || "Terjadi kesalahan.");
        return;
      }
      setError(null);
      setSuccess(true);
      router.refresh();
    });
  }

  if (alreadyRated || success) {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Terima kasih atas penilaianmu! 🙏
            </p>
            <p className="mt-0.5 text-sm text-emerald-700">
              Umpan balikmu membantu pemerintah daerah meningkatkan kualitas penanganan
              aduan warga.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6"
    >
      <h3 className="flex items-center gap-2 text-base font-bold text-ink">
        <Star className="h-5 w-5 text-amber-400" />
        Beri Penilaian Penanganan
      </h3>
      <p className="mt-1 text-sm text-ink-muted">
        Aduanmu sudah selesai ditangani. Seberapa puas kamu dengan hasilnya?
      </p>

      {/* Star input */}
      <div className="mt-4 flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-y-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              disabled={pending}
              onClick={() => setRating(value)}
              onMouseEnter={() => setHover(value)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${value} bintang`}
              className="p-0.5 transition-transform hover:scale-110 disabled:opacity-60"
            >
              <Star
                className={cn(
                  "h-7 w-7 sm:h-8 sm:w-8 transition-colors",
                  (hover || rating) >= value
                    ? "fill-amber-400 text-amber-400"
                    : "fill-slate-100 text-slate-300"
                )}
              />
            </button>
          ))}
          <span className="ml-2 text-sm font-semibold text-ink sm:ml-3">
            {rating ? RATING_LABELS[rating - 1] : "Pilih bintang"}
          </span>
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Ceritakan pengalamanmu (opsional)..."
          className="input-field mt-2 resize-y"
          disabled={pending}
        />

        {error && (
          <p className="flex items-center gap-1.5 text-xs font-medium text-rose-600">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </p>
        )}

        <div className="flex justify-end">
          <button type="submit" disabled={pending} className="btn-primary !py-2.5 text-sm">
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Mengirim...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Kirim Penilaian
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
