"use client";

import { useRef, useState } from "react";
import { Printer, FileSpreadsheet, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildComplaintRows,
  buildLogRows,
  LOG_HEADERS,
} from "@/lib/report/data";
import type { ComplaintDetail, ComplaintLogWithActor } from "@/lib/db-types";

interface Props {
  complaint: ComplaintDetail;
  logs: ComplaintLogWithActor[];
  className?: string;
}

/**
 * Tombol laporan aduan: "Cetak / PDF" (window.print pada #report-print)
 * dan "Unduh Excel" (file .xlsx via SheetJS, sheet Laporan Aduan +
 * Riwayat Penanganan). Dipakai di halaman detail petugas & masyarakat.
 */
export default function ReportActions({ complaint, logs, className }: Props) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function handleExcel() {
    if (busy) return;
    setBusy(true);
    setDone(false);
    try {
      // Impor dinamis agar SheetJS tidak masuk bundle halaman lain.
      const XLSX = await import("xlsx");
      const complaintSheet = XLSX.utils.aoa_to_sheet(buildComplaintRows(complaint));

      // Lebar kolom yang rapi di Excel.
      complaintSheet["!cols"] = [
        { wch: 22 },
        { wch: 60 },
      ];

      const logSheet = XLSX.utils.aoa_to_sheet([
        LOG_HEADERS,
        ...buildLogRows(logs),
      ]);
      logSheet["!cols"] = [{ wch: 20 }, { wch: 24 }, { wch: 50 }, { wch: 16 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, complaintSheet, "Laporan Aduan");
      XLSX.utils.book_append_sheet(wb, logSheet, "Riwayat Penanganan");

      const ticket = (complaint.ticket || "aduan").replace(/[^\w.-]+/g, "-");
      XLSX.writeFile(wb, `sipma-laporan-${ticket}.xlsx`);

      setDone(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setDone(false), 2000);
    } catch (e) {
      console.error("Gagal membuat Excel:", e);
      alert("Gagal membuat file Excel. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className={cn("no-print flex flex-col gap-2", className)}>
      <button
        type="button"
        onClick={handlePrint}
        className="btn-secondary w-full justify-center"
      >
        <Printer className="h-4 w-4" />
        Cetak / PDF
      </button>
      <button
        type="button"
        onClick={handleExcel}
        disabled={busy}
        className="btn-ghost w-full justify-center border border-slate-200 bg-white text-ink-soft hover:bg-slate-50 hover:text-ink"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : done ? (
          <Check className="h-4 w-4 text-emerald-600" />
        ) : (
          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
        )}
        {busy ? "Membuat file..." : done ? "Berhasil diunduh" : "Unduh Excel"}
      </button>
    </div>
  );
}