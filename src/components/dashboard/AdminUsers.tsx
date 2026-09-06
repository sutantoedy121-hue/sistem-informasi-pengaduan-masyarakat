"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  Search,
  Plus,
  KeyRound,
  Power,
  Loader2,
  X,
  UserPlus,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { cn, formatDateID } from "@/lib/utils";
import type { AdminUserRow, UserRole } from "@/lib/db-types";
import {
  createUserAction,
  updateUserRoleAction,
  toggleUserActiveAction,
  resetUserPasswordAction,
  deleteUserAction,
  type ActionResult,
} from "@/app/admin/actions";

const ROLES: { value: UserRole; label: string }[] = [
  { value: "masyarakat", label: "Masyarakat" },
  { value: "petugas", label: "Petugas" },
  { value: "pimpinan", label: "Pimpinan" },
  { value: "admin", label: "Admin" },
];

const roleBadge: Record<UserRole, string> = {
  masyarakat: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  petugas: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  pimpinan: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  admin: "bg-brand-50 text-brand-700 ring-1 ring-brand-200",
};

const roleFilters: { value: UserRole | "semua" | "nonaktif"; label: string }[] = [
  { value: "semua", label: "Semua" },
  { value: "petugas", label: "Petugas" },
  { value: "pimpinan", label: "Pimpinan" },
  { value: "admin", label: "Admin" },
  { value: "masyarakat", label: "Masyarakat" },
  { value: "nonaktif", label: "Nonaktif" },
];

type ModalState =
  | { type: "add" | "reset"; userId?: string }
  | { type: "delete"; user: AdminUserRow }
  | null;

/**
 * Panel admin: kelola akun pengguna (FR-17). Tambah akun, ubah role,
 * aktif/nonaktifkan, dan reset sandi.
 */
export default function AdminUsers({ users }: { users: AdminUserRow[] }) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof roleFilters)[number]["value"]>("semua");
  const [q, setQ] = useState("");
  const [pending, startTransition] = useTransition();

  const visible = useMemo(() => {
    const query = q.trim().toLowerCase();
    return users.filter((u) => {
      if (filter === "nonaktif") {
        if (u.isActive) return false;
      } else if (filter !== "semua" && u.role !== filter) return false;
      if (!query) return true;
      return (
        (u.email ?? "").toLowerCase().includes(query) ||
        (u.fullName ?? "").toLowerCase().includes(query)
      );
    });
  }, [users, filter, q]);

  const counts = useMemo(
    () =>
      roleFilters.reduce<Record<string, number>>((acc, f) => {
        acc[f.value] =
          f.value === "nonaktif"
            ? users.filter((u) => !u.isActive).length
            : f.value === "semua"
              ? users.length
              : users.filter((u) => u.role === f.value).length;
        return acc;
      }, {}),
    [users]
  );

  const open = (m: ModalState) => {
    setError(null);
    setModal(m);
  };
  const close = () => {
    if (pending) return;
    setModal(null);
    setError(null);
  };

  function submit(formData: FormData) {
    startTransition(async () => {
      if (!modal) return;
      setError(null);
      let result: ActionResult;
      if (modal.type === "delete") {
        result = await deleteUserAction({ userId: modal.user.id });
      } else if (modal.type === "add") {
        result = await createUserAction({
          email: String(formData.get("email") || ""),
          fullName: String(formData.get("fullName") || ""),
          role: String(formData.get("role") || "masyarakat") as UserRole,
          password: String(formData.get("password") || ""),
        });
      } else {
        result = await resetUserPasswordAction({
          userId: modal.userId!,
          password: String(formData.get("password") || ""),
        });
      }
      if (result && "error" in result) {
        setError(result.error || "Terjadi kesalahan.");
        return;
      }
      close();
      router.refresh();
    });
  }

  async function changeRole(userId: string, role: UserRole) {
    startTransition(async () => {
      const result = await updateUserRoleAction({ userId, role });
      if (result && "error" in result) setError(result.error || "Gagal.");
      router.refresh();
    });
  }

  async function toggleActive(user: AdminUserRow) {
    startTransition(async () => {
      const result = await toggleUserActiveAction({
        userId: user.id,
        isActive: !user.isActive,
      });
      if (result && "error" in result) setError(result.error || "Gagal.");
      router.refresh();
    });
  }

  async function doDelete(user: AdminUserRow) {
    startTransition(async () => {
      setError(null);
      const result = await deleteUserAction({ userId: user.id });
      if (result && "error" in result) {
        setError(result.error || "Gagal menghapus akun.");
        return;
      }
      close();
      router.refresh();
    });
  }

  return (
    <div className="container-page py-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
            Kelola Akun Pengguna
          </h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            {users.length} akun terdaftar · tambah, ubah role, aktif/nonaktif,
            dan reset sandi.
          </p>
        </div>
        <button onClick={() => open({ type: "add" })} className="btn-primary">
          <Plus className="h-4 w-4" />
          Tambah Akun
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative mt-6 max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari email / nama..."
          className="input-field pl-10"
        />
      </div>

      {/* Filter pills */}
      <div className="mt-4 flex flex-wrap gap-2">
        {roleFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
              filter === f.value
                ? "bg-brand-600 text-white shadow-soft"
                : "border border-slate-200 bg-white text-ink-muted hover:border-brand-200 hover:text-brand-700"
            )}
          >
            {f.label}
            <span
              className={cn(
                "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]",
                filter === f.value ? "bg-white/20" : "bg-slate-100"
              )}
            >
              {counts[f.value]}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 shadow-soft">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-ink-faint">
              <Search className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-base font-bold text-ink">
              Tidak ada akun
            </h3>
            <p className="mt-1 max-w-xs text-sm text-ink-muted">
              Tidak ada akun untuk filter/pencarian ini.
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-5 py-3 font-semibold">Pengguna</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Terdaftar</th>
                <th className="px-5 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-brand-50/40">
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-ink">{u.fullName ?? "—"}</p>
                    <p className="text-xs text-ink-muted">{u.email ?? "—"}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <select
                      value={u.role}
                      disabled={pending}
                      onChange={(e) =>
                        changeRole(u.id, e.target.value as UserRole)
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-ink transition-colors focus:border-brand-400 focus:outline-none disabled:opacity-50"
                      aria-label={`Ubah role ${u.email}`}
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={cn(
                        "badge ring-1",
                        u.isActive
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-rose-50 text-rose-700 ring-rose-200"
                      )}
                    >
                      {u.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                    <span
                      className={cn("badge ml-1.5 ring-1", roleBadge[u.role])}
                    >
                      {ROLES.find((r) => r.value === u.role)?.label ?? u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-ink-muted">
                    {formatDateID(u.createdAt)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => open({ type: "reset", userId: u.id })}
                        disabled={pending}
                        className="btn-ghost !px-2.5 !py-1.5 text-xs"
                        aria-label={`Reset sandi ${u.email}`}
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => toggleActive(u)}
                        disabled={pending}
                        className={cn(
                          "btn-ghost !px-2.5 !py-1.5 text-xs",
                          u.isActive ? "text-rose-700" : "text-emerald-700"
                        )}
                        aria-label={u.isActive ? "Nonaktifkan" : "Aktifkan"}
                      >
                        <Power className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => open({ type: "delete", user: u })}
                        disabled={pending}
                        className="btn-ghost !px-2.5 !py-1.5 text-xs text-rose-700 hover:!bg-rose-50"
                        aria-label={`Hapus ${u.email}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center"
          onClick={pending ? undefined : close}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="flex items-center gap-2 text-base font-extrabold text-ink">
                {modal.type === "add" ? (
                  <UserPlus className="h-4 w-4 text-brand-600" />
                ) : modal.type === "delete" ? (
                  <Trash2 className="h-4 w-4 text-rose-600" />
                ) : (
                  <KeyRound className="h-4 w-4 text-brand-600" />
                )}
                {modal.type === "add"
                  ? "Tambah Akun Baru"
                  : modal.type === "delete"
                    ? "Hapus Akun"
                    : "Reset Sandi"}
              </h3>
              <button
                onClick={close}
                disabled={pending}
                className="flex h-8 w-8 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-slate-100 hover:text-ink"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {modal.type === "reset" && (
              <p className="mt-1 text-sm text-ink-muted">
                Set sandi baru untuk akun ini. Komunikasikan sandi ke pemilik
                akun.
              </p>
            )}

            {modal.type === "delete" && (
              <>
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    Tindakan ini <strong>permanen</strong>. Seluruh aduan, riwayat
                    penanganan, dan notifikasi milik{" "}
                    <strong>{modal.user.email}</strong> ikut terhapus dan tidak
                    bisa dikembalikan.
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink">
                  <span className="text-ink-muted">Hapus akun:</span>
                  <span className="font-semibold text-ink">
                    {modal.user.email}
                  </span>
                </div>
              </>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            {modal.type === "delete" && (
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={close}
                  disabled={pending}
                  className="btn-ghost"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => doDelete(modal.user)}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-rose-700 disabled:opacity-60"
                >
                  {pending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Menghapus...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Hapus Permanen
                    </>
                  )}
                </button>
              </div>
            )}

            {modal.type !== "delete" && (
            <form action={submit} className="mt-4 space-y-4">
              {modal.type === "add" ? (
                <>
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-ink">
                      Nama Lengkap <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      maxLength={120}
                      autoFocus
                      placeholder="Nama pengguna"
                      className="input-field mt-1.5"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-ink">
                      Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="nama@email.com"
                      className="input-field mt-1.5"
                    />
                  </div>
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-ink">
                      Role <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="role"
                      name="role"
                      defaultValue="masyarakat"
                      className="input-field mt-1.5"
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-ink">
                      Sandi Awal <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="text"
                      required
                      minLength={6}
                      placeholder="Minimal 6 karakter"
                      className="input-field mt-1.5"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-ink">
                    Sandi Baru <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="text"
                    required
                    minLength={6}
                    autoFocus
                    placeholder="Minimal 6 karakter"
                    className="input-field mt-1.5"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={close}
                  disabled={pending}
                  className="btn-ghost"
                >
                  Batal
                </button>
                <button type="submit" disabled={pending} className="btn-primary">
                  {pending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan"
                  )}
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}