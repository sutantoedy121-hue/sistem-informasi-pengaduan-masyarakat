import { statusMeta, type StatusKey } from "@/lib/data";
import { cn } from "@/lib/utils";

interface Props {
  status: string;
  className?: string;
}

/**
 * Badge status aduan. Status yang tidak dikenal (mis. belum ada di enum)
 * di-fallback ke tampilan netral.
 */
export default function StatusBadge({ status, className }: Props) {
  const meta = statusMeta[status as StatusKey];

  if (!meta) {
    return (
      <span
        className={cn(
          "badge bg-slate-100 text-slate-700 ring-1 ring-slate-200",
          className
        )}
      >
        {status}
      </span>
    );
  }

  return (
    <span className={cn("badge", meta.badge, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}
