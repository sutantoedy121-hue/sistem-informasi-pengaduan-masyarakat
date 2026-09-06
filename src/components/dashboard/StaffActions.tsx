"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ShieldCheck,
  XCircle,
  UserCog,
  ClipboardEdit,
  CheckCircle2,
  Loader2,
  X,
  ClipboardCheck,
} from "lucide-react";
import type { ComplaintStatus, Executor } from "@/lib/db-types";
import PhotoUpload from "@/components/forms/PhotoUpload";
import {
  acceptComplaintAction,
  rejectComplaintAction,
  assignComplaintAction,
  progressComplaintAction,
  completeComplaintAction,
} from "@/app/petugas/actions";

interface Props {
  complaintId: string;
  ticket: string;
  status: ComplaintStatus;
  executors: Executor[];
}

type ModalType = "accept" | "reject" | "assign" | "progress" | "complete" | null;

interface ModalState {
  type: Exclude<ModalType, null>;
}

/**
 * Panel aksi petugas pada halaman detail aduan: terima, tolak, tugaskan
 * pelaksana, catat tindak lanjut, dan tandai selesai. Tiap aksi menjalankan
 * server action lalu refresh halaman agar status/log/notif tampil terbaru.
 */
export default function StaffActions({
  complaintId,
  ticket,
  status,
  executors,
}: Props) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [executorMode, setExecutorMode] = useState<"list" | "manual">("list");
  const [executorListValue, setExecutorListValue] = useState("");
  const [pending, startTransition] = useTransition();

  const open = (type: Exclude<ModalType, null>) => {
    setError(null);
    setPhotoPath(null);
    setExecutorMode("list");
    setExecutorListValue("");
    setModal({ type });
  };
  const close = () => {
    if (pending) return;
    setModal(null);
    setPhotoPath(null);
  };

  function submit(formData: FormData) {
    startTransition(async () => {
      const type = modal?.type;
      if (!type) return;
      setError(null);

      const result = await (async () => {
        switch (type) {
          case "accept":
            return acceptComplaintAction(complaintId);
          case "reject":
            return rejectComplaintAction(
              complaintId,
              String(formData.get("reason") || "")
            );
          case "assign":
            return assignComplaintAction({
              complaintId,
              executorId:
                executorMode === "list"
                  ? String(formData.get("executorId") || "")
                  : undefined,
              executorName:
                executorMode === "manual"
                  ? String(formData.get("executorName") || "")
                  : undefined,
              note: String(formData.get("note") || "") || undefined,
            });
          case "progress":
            return progressComplaintAction({
              complaintId,
              description: String(formData.get("description") || ""),
              photoUrl: photoPath || undefined,
            });
          case "complete":
            return completeComplaintAction({
              complaintId,
              note: String(formData.get("note") || ""),
              photoUrl: photoPath || undefined,
            });
          default:
            return { error: "Aksi tidak dikenal." };
        }
      })();

      if (result && "error" in result) {
        setError(result.error || "Terjadi kesalahan.");
        return;
      }
      close();
      router.refresh();
    });
  }

  const canAccept = status === "diajukan";
  const canAssign = status !== "selesai" && status !== "ditolak";
  const canProgress =
    status === "diajukan" || status === "diterima" || status === "diproses";
  const canComplete = status !== "selesai" && status !== "ditolak";

  return (
    <div className="space-y-3">
      {canAccept && (
        <button
          onClick={() => open("accept")}
          disabled={pending}
          className="btn-primary w-full justify-center"
        >
          <ShieldCheck className="h-4 w-4" />
          Terima Aduan
        </button>
      )}

      {canAccept && (
        <button
          onClick={() => open("reject")}
          disabled={pending}
          className="btn-ghost w-full justify-center border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
        >
          <XCircle className="h-4 w-4" />
          Tolak Aduan
        </button>
      )}

      {canAssign && (
        <button
          onClick={() => open("assign")}
          disabled={pending}
          className="btn-secondary w-full justify-center"
        >
          <UserCog className="h-4 w-4" />
          Tugaskan Pelaksana
        </button>
      )}

      {canProgress && (
        <button
          onClick={() => open("progress")}
          disabled={pending}
          className="btn-secondary w-full justify-center"
        >
          <ClipboardEdit className="h-4 w-4" />
          Catat Tindak Lanjut
        </button>
      )}

      {canComplete && (
        <button
          onClick={() => open("complete")}
          disabled={pending}
          className="btn-ghost w-full justify-center border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
        >
          <CheckCircle2 className="h-4 w-4" />
          Tandai Selesai
        </button>
      )}

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
                <ModalIcon type={modal.type} />
                {MODAL_TITLES[modal.type]}
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

            <p className="mt-1 font-mono text-xs text-ink-faint">
              {ticket}
            </p>

            {error && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <form action={submit} className="mt-4 space-y-4">
              {modal.type === "accept" && (
                <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
                  Setujui aduan ini dan ubah statusnya menjadi{" "}
                  <b>Diterima</b>. Aduan akan siap ditindaklanjuti.
                </p>
              )}

              {modal.type === "reject" && (
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-ink">
                    Alasan Penolakan <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="reason"
                    name="reason"
                    rows={3}
                    required
                    maxLength={500}
                    placeholder="Jelaskan alasan penolakan, mis. data/lokasi tidak jelas, kategori tidak sesuai, atau dup likat."
                    className="input-field mt-1.5 resize-y"
                  />
                  <p className="mt-1 text-xs text-ink-muted">
                    Alasan ini akan terkirim sebagai notifikasi ke pelapor.
                  </p>
                </div>
              )}

              {modal.type === "assign" && (
                <>
                  <div>
                    <label
                      htmlFor="executorId"
                      className="block text-sm font-medium text-ink"
                    >
                      Pilih Pelaksana <span className="text-rose-500">*</span>
                    </label>

                    {executorMode === "list" ? (
                      <>
                        <select
                          id="executorId"
                          name="executorId"
                          value={executorListValue}
                          onChange={(e) => {
                            const v = e.target.value;
                            setExecutorListValue(v);
                            if (v === "manual") setExecutorMode("manual");
                          }}
                          className="input-field mt-1.5"
                        >
                          <option value="">— Pilih pelaksana —</option>
                          {executors.map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.name}
                            </option>
                          ))}
                          <option value="manual">Lainnya (ketik manual)</option>
                        </select>
                        <p className="mt-1 text-xs text-ink-muted">
                          Aduan akan berstatus <b>Diproses</b> setelah ditugaskan.
                        </p>
                      </>
                    ) : (
                      <div>
                        <input
                          id="executorName"
                          name="executorName"
                          type="text"
                          autoFocus
                          maxLength={120}
                          placeholder="Tulis nama pelaksana / tim, mis. Dinas PU Bina Marga"
                          className="input-field mt-1.5"
                        />
                        <p className="mt-1 text-xs text-ink-muted">
                          Nama ini disimpan sebagai pelaksana baru.{" "}
                          <button
                            type="button"
                            onClick={() => setExecutorMode("list")}
                            className="font-semibold text-brand-600 hover:underline"
                          >
                            Pilih dari daftar
                          </button>
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label htmlFor="note" className="block text-sm font-medium text-ink">
                      Catatan Tugas <span className="font-normal text-ink-faint">(opsional)</span>
                    </label>
                    <input
                      id="note"
                      name="note"
                      type="text"
                      maxLength={300}
                      placeholder="Contoh: prioritaskan karena bahaya lalu lintas"
                      className="input-field mt-1.5"
                    />
                  </div>
                </>
              )}

              {modal.type === "progress" && (
                <>
                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-ink"
                    >
                      Uraian Tindak Lanjut <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      required
                      maxLength={2000}
                      placeholder="Jelaskan langkah/keadaan di lapangan, hasil pengecekan, kendala, dsb."
                      className="input-field mt-1.5 resize-y"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink">
                      Foto Bukti <span className="font-normal text-ink-faint">(opsional)</span>
                    </label>
                    <div className="mt-1.5">
                      <PhotoUpload onUploaded={setPhotoPath} />
                    </div>
                  </div>
                </>
              )}

              {modal.type === "complete" && (
                <>
                  <div>
                    <label htmlFor="note" className="block text-sm font-medium text-ink">
                      Ringkasan Hasil <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      id="note"
                      name="note"
                      rows={3}
                      required
                      maxLength={1000}
                      placeholder="Ringkas hasil penanganan, mis. lubang diperbaiki tgl 20, lampu diganti"
                      className="input-field mt-1.5 resize-y"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink">
                      Foto Bukti <span className="font-normal text-ink-faint">(opsional)</span>
                    </label>
                    <div className="mt-1.5">
                      <PhotoUpload onUploaded={setPhotoPath} />
                    </div>
                  </div>
                </>
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
          </div>
        </div>
      )}
    </div>
  );
}

const MODAL_TITLES: Record<string, string> = {
  accept: "Terima Aduan",
  reject: "Tolak Aduan",
  assign: "Tugaskan Pelaksana",
  progress: "Catat Tindak Lanjut",
  complete: "Tandai Selesai",
};

function ModalIcon({ type }: { type: string }) {
  const cls = "h-4 w-4";
  switch (type) {
    case "accept":
      return <ShieldCheck className={`${cls} text-brand-600`} />;
    case "reject":
      return <XCircle className={`${cls} text-rose-600`} />;
    case "assign":
      return <UserCog className={`${cls} text-indigo-600`} />;
    case "complete":
      return <CheckCircle2 className={`${cls} text-emerald-600`} />;
    default:
      return <ClipboardCheck className={`${cls} text-brand-600`} />;
  }
}