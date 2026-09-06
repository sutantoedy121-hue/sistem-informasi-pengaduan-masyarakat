"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Loader2, Send } from "lucide-react";
import { formatRelativeTimeID } from "@/lib/utils";
import type { ComplaintLogWithActor } from "@/lib/db-types";
import { addLeaderNoteAction } from "@/app/pimpinan/actions";

interface Props {
  complaintId: string;
  logs: ComplaintLogWithActor[];
}

/** Catatan/arahan pimpinan pada sebuah aduan (role pimpinan only). */
export default function LeaderNote({ complaintId, logs }: Props) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const comments = logs.filter((l) => l.action === "commented");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!note.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await addLeaderNoteAction(complaintId, note);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setNote("");
      router.refresh();
    });
  }

  return (
    <div>
      <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
        <MessageSquare className="h-4 w-4 text-brand-600" />
        Arahan Pimpinan
      </h2>
      <p className="mt-0.5 text-xs text-ink-muted">
        Catatan untuk petugas/penindak lanjut — tidak mengubah status aduan.
      </p>

      {/* Daftar arahan yang sudah ada */}
      {comments.length > 0 && (
        <ul className="mt-4 space-y-3">
          {comments.map((c) => (
            <li
              key={c.id}
              className="rounded-lg border border-brand-100 bg-brand-50/60 px-3.5 py-2.5"
            >
              <p className="text-sm leading-relaxed text-ink-soft">{c.result}</p>
              <p className="mt-1 text-xs text-ink-faint">
                {c.actor?.full_name ?? "Pimpinan"} · {formatRelativeTimeID(c.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {/* Form tambah arahan */}
      <form ref={formRef} onSubmit={handleSubmit} className="mt-4 space-y-2">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Tulis arahan untuk petugas, mis. prioritas ditangani pekan ini…"
          className="input-field w-full resize-none"
        />
        {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending || !note.trim()}
            className="btn-primary !py-2"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Kirim Arahan
          </button>
        </div>
      </form>
    </div>
  );
}