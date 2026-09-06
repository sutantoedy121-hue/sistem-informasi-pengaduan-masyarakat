import { CheckCircle2, Circle, MessageSquare, X } from "lucide-react";
import { formatRelativeTimeID, cn } from "@/lib/utils";
import { getPhotoUrl } from "@/lib/storage";
import type { ComplaintLogWithActor } from "@/lib/db-types";

const ACTION_META: Record<string, { label: string; sub?: (l: ComplaintLogWithActor) => string }> = {
  created: { label: "Aduan diajukan" },
  accepted: { label: "Aduan diterima" },
  rejected: { label: "Aduan ditolak" },
  assigned: {
    label: "Ditugaskan ke pelaksana",
    sub: (l) => l.result ?? l.description ?? "",
  },
  progress: { label: "Tindak lanjut" },
  completed: { label: "Penanganan selesai" },
  reopened: { label: "Aduan dibuka kembali" },
  rated: { label: "Penilaian warga" },
  commented: { label: "Arahan pimpinan" },
};

interface Props {
  logs: ComplaintLogWithActor[];
}

/** Timeline vertikal riwayat penanganan aduan (FR-06B). */
export default function ComplaintTimeline({ logs }: Props) {
  if (logs.length === 0) {
    return (
      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-sm text-ink-muted">
        Belum ada riwayat. Aduan menunggu diterima petugas.
      </div>
    );
  }

  return (
    <ol className="relative space-y-6 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-px before:bg-slate-200">
      {logs.map((log) => {
        const meta = ACTION_META[log.action];
        if (!meta) return null;
        const actorName = log.actor?.full_name;
        const photo = getPhotoUrl(log.photo_url);
        const title = meta.label;

        return (
          <li key={log.id} className="relative flex gap-4">
            {/* Node */}
            <div className="relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center">
              {log.action === "rejected" ? (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                  <X className="h-4 w-4" strokeWidth={2.5} />
                </span>
              ) : log.action === "completed" ? (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              ) : log.action === "commented" ? (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <MessageSquare className="h-3.5 w-3.5" />
                </span>
              ) : (
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full",
                    log.action === "created"
                      ? "bg-brand-100 text-brand-700"
                      : "bg-slate-100 text-slate-500"
                  )}
                >
                  <Circle className="h-3.5 w-3.5" />
                </span>
              )}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <p className="text-sm font-semibold text-ink">{title}</p>
                <span className="text-xs text-ink-faint">
                  {formatRelativeTimeID(log.created_at)}
                </span>
              </div>

              {meta.sub && (
                <p className="mt-0.5 text-sm text-ink-muted">
                  {meta.sub(log)}
                </p>
              )}
              {(log.description || log.result) && log.action !== "created" && (
                <p
                  className={cn(
                    "mt-1 rounded-lg px-3 py-2 text-sm leading-relaxed text-ink-soft",
                    log.action === "commented" ? "bg-indigo-50/70" : "bg-slate-50"
                  )}
                >
                  {log.result || log.description}
                </p>
              )}
              {actorName && log.action !== "created" && (
                <p className="mt-1 text-xs text-ink-faint">
                  oleh <span className="font-medium">{actorName}</span>
                </p>
              )}
              {photo && (
                <a
                  href={photo}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block"
                >
                  <img
                    src={photo}
                    alt="Dokumentasi penanganan"
                    className="h-28 w-full max-w-xs rounded-xl object-cover ring-1 ring-slate-200 transition-transform hover:scale-[1.02]"
                  />
                </a>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
