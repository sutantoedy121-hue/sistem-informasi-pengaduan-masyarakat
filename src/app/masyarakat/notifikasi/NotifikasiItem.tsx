"use client";

import Link from "next/link";
import { useTransition } from "react";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTimeID } from "@/lib/utils";
import {
  markSingleNotificationReadAction,
} from "@/app/masyarakat/actions";

interface NotifItem {
  id: string;
  complaint_id: string | null;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
}

export default function NotifikasiItem({ n }: { n: NotifItem }) {
  const [, startTransition] = useTransition();

  function handleClick() {
    if (!n.is_read) {
      startTransition(() => {
        markSingleNotificationReadAction(n.id);
      });
    }
  }

  function handleMarkRead(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(() => {
      markSingleNotificationReadAction(n.id);
    });
  }

  return (
    <li className="group relative">
      <Link
        href={
          n.complaint_id
            ? `/masyarakat/aduan/${n.complaint_id}`
            : "/masyarakat"
        }
        onClick={handleClick}
        className={cn(
          "flex items-start gap-4 py-4 pl-5 pr-14 transition-colors hover:bg-brand-50/40",
          !n.is_read && "bg-brand-50/30"
        )}
      >
        {/* Indikator baca/belum */}
        <span
          className={cn(
            "mt-2 h-2.5 w-2.5 shrink-0 rounded-full ring-2 transition-colors",
            n.is_read
              ? "bg-slate-200 ring-slate-100"
              : "bg-brand-500 ring-brand-100"
          )}
        />

        {/* Konten */}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-sm leading-snug",
              n.is_read
                ? "font-medium text-ink-soft"
                : "font-semibold text-ink"
            )}
          >
            {n.title}
          </p>
          {n.body && (
            <p className="mt-1 text-sm leading-relaxed text-ink-muted line-clamp-3">
              {n.body}
            </p>
          )}
          <p className="mt-1.5 text-xs text-ink-faint">
            {formatDateTimeID(n.created_at)}
          </p>
        </div>

        {/* Ikon navigasi jika ada aduan terkait */}
        {n.complaint_id && (
          <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-brand-500" />
        )}
      </Link>

      {/* Tombol tandai satu item dibaca — muncul saat hover */}
      {!n.is_read && (
        <button
          type="button"
          title="Tandai telah dibaca"
          onClick={handleMarkRead}
          className={cn(
            "absolute right-10 top-1/2 -translate-y-1/2",
            "flex h-7 w-7 items-center justify-center rounded-full",
            "text-slate-300 opacity-0 transition-all",
            "group-hover:opacity-100 group-hover:text-brand-400 hover:!text-brand-700 hover:bg-brand-100"
          )}
        >
          <CheckCircle2 className="h-4 w-4" />
        </button>
      )}
    </li>
  );
}
