"use client";

import Link from "next/link";
import { useState, useMemo, useTransition } from "react";
import {
  Search,
  Trash2,
  Edit,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  ShieldAlert,
  MapPin,
  User,
} from "lucide-react";
import type { ComplaintStaffListItem, ComplaintStatus } from "@/lib/db-types";
import { deleteComplaintAction, updateComplaintStatusAction } from "@/app/admin/actions";
import StatusBadge from "@/components/ui/StatusBadge";
import Pagination from "@/components/ui/Pagination";
import { categoryLabel, formatDateTimeID } from "@/lib/utils";

const PAGE_SIZE = 10;

const STATUSES: { value: ComplaintStatus; label: string }[] = [
  { value: "diajukan", label: "Diajukan" },
  { value: "diterima", label: "Diterima" },
  { value: "diproses", label: "Diproses" },
  { value: "selesai", label: "Selesai" },
  { value: "ditolak", label: "Ditolak" },
];

export default function AdminComplaintsManager({
  initialComplaints,
}: {
  initialComplaints: ComplaintStaffListItem[];
}) {
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Modal State
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintStaffListItem | null>(null);
  const [modalMode, setModalMode] = useState<"edit" | "delete" | null>(null);
  const [editStatus, setEditStatus] = useState<ComplaintStatus>("diajukan");
  const [editNote, setEditNote] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return initialComplaints.filter((c) => {
      if (filterStatus !== "all" && c.status !== filterStatus) return false;
      // Output hasil pencarian hanya aktif jika mengetik minimal 3 huruf
      if (query.length < 3) return true;
      return (
        c.title.toLowerCase().includes(query) ||
        c.ticket.toLowerCase().includes(query) ||
        (c.location ?? "").toLowerCase().includes(query) ||
        (c.reporter?.full_name ?? "").toLowerCase().includes(query)
      );
    });
  }, [initialComplaints, q, filterStatus]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function openEdit(c: ComplaintStaffListItem) {
    setSelectedComplaint(c);
    setEditStatus(c.status);
    setEditNote("");
    setModalMode("edit");
    setError(null);
  }

  function openDelete(c: ComplaintStaffListItem) {
    setSelectedComplaint(c);
    setModalMode("delete");
    setError(null);
  }

  function closeModal() {
    if (pending) return;
    setModalMode(null);
    setSelectedComplaint(null);
  }

  function handleDelete() {
    if (!selectedComplaint) return;
    startTransition(async () => {
      const res = await deleteComplaintAction(selectedComplaint.id);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setSuccess("Aduan berhasil dihapus.");
      closeModal();
    });
  }

  function handleUpdateStatus(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedComplaint) return;
    startTransition(async () => {
      const res = await updateComplaintStatusAction({
        complaintId: selectedComplaint.id,
        status: editStatus,
        note: editNote,
      });
      if (res?.error) {
        setError(res.error);
        return;
      }
      setSuccess("Status aduan berhasil diperbarui oleh Admin.");
      closeModal();
    });
  }

  return (
    <div className="container-page py-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
            Kontrol Semua Aduan
          </h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            Super Admin: Kelola, ubah status darurat, dan hapus laporan spam/ilegal.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      {/* Filter & Search */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Cari judul / tiket / pelapor / lokasi (min. 3 huruf)..."
            className="input-field pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => {
              setFilterStatus("all");
              setPage(1);
            }}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              filterStatus === "all"
                ? "bg-brand-600 text-white"
                : "border border-slate-200 bg-white text-ink-muted hover:bg-slate-50"
            }`}
          >
            Semua ({initialComplaints.length})
          </button>
          {STATUSES.map((st) => (
            <button
              key={st.value}
              onClick={() => {
                setFilterStatus(st.value);
                setPage(1);
              }}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                filterStatus === st.value
                  ? "bg-brand-600 text-white"
                  : "border border-slate-200 bg-white text-ink-muted hover:bg-slate-50"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabel Aduan */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
        {visible.length === 0 ? (
          <div className="p-12 text-center text-sm text-ink-muted">
            Tidak ada aduan yang sesuai filter/pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-ink-muted">
                <tr>
                  <th className="px-5 py-3.5">Tiket & Judul</th>
                  <th className="px-5 py-3.5">Pelapor</th>
                  <th className="px-5 py-3.5">Kategori</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Aksi Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-4">
                      <div className="font-mono text-xs font-bold text-brand-700">{c.ticket}</div>
                      <div className="font-bold text-ink mt-0.5 max-w-sm truncate">{c.title}</div>
                      <div className="flex items-center gap-1 text-[11px] text-ink-muted mt-0.5">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate max-w-xs">{c.location || "Lokasi tidak dicantumkan"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-ink">{c.reporter?.full_name || "Warga"}</div>
                      <div className="text-[11px] text-ink-muted">{formatDateTimeID(c.created_at)}</div>
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-ink-soft">
                      {categoryLabel(c.category, c.category_note)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(c)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-brand-600"
                          title="Ubah Status Darurat"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDelete(c)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                          title="Hapus Aduan Spam/Palsu"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pageCount > 1 && (
          <Pagination page={safePage} pageCount={pageCount} onChange={setPage} />
        )}
      </div>

      {/* Modal Edit Status */}
      {modalMode === "edit" && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-ink">Intervensi Status Aduan</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateStatus} className="mt-4 space-y-4">
              <div>
                <p className="text-xs text-ink-muted">No. Tiket: {selectedComplaint.ticket}</p>
                <p className="text-sm font-bold text-ink mt-0.5">{selectedComplaint.title}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-ink">Pilih Status Baru</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as ComplaintStatus)}
                  className="input-field mt-1 text-sm"
                >
                  {STATUSES.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-ink">Catatan Intervensi Admin</label>
                <textarea
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="Alasan perubahan status darurat..."
                  className="input-field mt-1 text-sm"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal} className="btn-ghost">
                  Batal
                </button>
                <button type="submit" disabled={pending} className="btn-primary">
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Delete */}
      {modalMode === "delete" && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-extrabold text-ink">Hapus Aduan Ini Secara Permanen?</h3>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              Aduan <b>&ldquo;{selectedComplaint.title}&rdquo;</b> ({selectedComplaint.ticket}) dan seluruh foto serta riwayat log-nya akan dihapus permanen dari sistem. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={closeModal} className="btn-ghost">
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={pending}
                className="btn-danger flex items-center gap-2"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ya, Hapus Permanen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}