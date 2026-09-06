"use client";

import { useRef, useState } from "react";
import { FileSpreadsheet, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildRekapRows,
  buildDetailRows,
  periodLabel,
  type PeriodFilter,
} from "@/lib/pimpinan/stats";
import type { ComplaintStaffListItem } from "@/lib/db-types";

interface Props {
  complaints: ComplaintStaffListItem[];
  period: PeriodFilter;
  className?: string;
}

/**
 * Tombol "Unduh Excel" untuk Laporan Kinerja (FR-16).
 * Menghasilkan workbook 2 sheet: Rekap Kinerja (per kategori) + Detail Aduan.
 * Dinamis import xlsx agar tidak menambah bundle dashboard.
 */
export default function PimpinanReportButtons({ complaints, period, className }: Props) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function handleExcel() {
    if (busy) return;
    setBusy(true);
    setDone(false);
    try {
      const XLSX = await import("xlsx");

      const rekap = XLSX.utils.aoa_to_sheet(buildRekapRows(complaints));
      rekap["!cols"] = [{ wch: 30 }, { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 9 }, { wch: 9 }, { wch: 11 }];

      const detail = XLSX.utils.aoa_to_sheet(buildDetailRows(complaints));
      detail["!cols"] = [
        { wch: 24 },
        { wch: 20 },
        { wch: 50 },
        { wch: 24 },
        { wch: 12 },
        { wch: 30 },
        { wch: 20 },
        { wch: 20 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, rekap, "Rekap Kinerja");
      XLSX.utils.book_append_sheet(wb, detail, "Detail Aduan");

      const label = periodLabel(period);
      XLSX.writeFile(wb, `sipma-laporan-kinerja-${label}.xlsx`);

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

  return (
    <div className={cn("inline-flex", className)}>
      <button
        type="button"
        onClick={handleExcel}
        disabled={busy}
        className="btn-primary"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : done ? (
          <Check className="h-4 w-4" />
        ) : (
          <FileSpreadsheet className="h-4 w-4" />
        )}
        {busy ? "Membuat file..." : done ? "Berhasil diunduh" : "Unduh Laporan Excel"}
      </button>
    </div>
  );
}