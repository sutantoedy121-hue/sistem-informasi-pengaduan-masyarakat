import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, CheckCircle2, Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { markNotificationsReadAction } from "@/app/masyarakat/actions";
import NotifikasiItem from "./NotifikasiItem";

interface Props {
  searchParams: Promise<{ filter?: string }>;
}

export const metadata = {
  title: "Notifikasi — SIPMA",
};

export default async function NotifikasiPage({ searchParams }: Props) {
  const { user } = await getSession();
  if (!user) redirect("/login?redirect=/masyarakat/notifikasi");

  const params = await searchParams;
  const filter = params.filter === "unread" ? "unread" : "all";
  const supabase = await createClient();

  let q = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id);
  if (filter === "unread") q = q.eq("is_read", false);
  const { data } = await q.order("created_at", { ascending: false }).limit(50);
  const items = (data ?? []) as {
    id: string;
    complaint_id: string | null;
    title: string;
    body: string | null;
    is_read: boolean;
    created_at: string;
  }[];

  const unread = items.filter((n) => !n.is_read).length;
  const totalAll = filter === "all" ? items.length : undefined;

  return (
    <main className="flex-1 pb-16">
      <div className="container-page py-8">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700">
              <Bell className="h-3.5 w-3.5" />
              Dashboard Masyarakat
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink">
              Notifikasi
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              Pembaruan status aduan kamu.
            </p>
          </div>

          {/* Filter + tandai semua baca */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex overflow-hidden rounded-full border border-slate-200 text-xs font-semibold">
              {(["all", "unread"] as const).map((f) => (
                <Link
                  key={f}
                  href={`/masyarakat/notifikasi${f === "unread" ? "?filter=unread" : ""}`}
                  className={cn(
                    "px-3.5 py-1.5 transition-colors",
                    filter === f
                      ? "bg-brand-600 text-white"
                      : "text-ink-muted hover:bg-slate-50"
                  )}
                >
                  {f === "all" ? (
                    <>
                      Semua
                      {totalAll !== undefined && totalAll > 0 && (
                        <span className="ml-1 opacity-70">({totalAll})</span>
                      )}
                    </>
                  ) : (
                    <>
                      Belum dibaca
                      {unread > 0 && (
                        <span className="ml-1 opacity-70">({unread})</span>
                      )}
                    </>
                  )}
                </Link>
              ))}
            </div>

            {unread > 0 && (
              <form action={markNotificationsReadAction}>
                <button
                  type="submit"
                  className="btn-secondary !py-1.5 text-xs"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Tandai semua dibaca
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Daftar notifikasi */}
        <div className="card mt-6 overflow-hidden">
          {items.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <Inbox className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-base font-bold text-ink">
                {filter === "unread"
                  ? "Semua sudah dibaca"
                  : "Belum ada notifikasi"}
              </h3>
              <p className="mt-1.5 max-w-xs text-sm text-ink-muted">
                Pembaruan status aduan kamu akan muncul di sini.
              </p>
              {filter === "unread" && (
                <Link
                  href="/masyarakat/notifikasi"
                  className="mt-4 text-xs font-semibold text-brand-600 hover:underline"
                >
                  Lihat semua notifikasi
                </Link>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map((n) => (
                <NotifikasiItem key={n.id} n={n} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}