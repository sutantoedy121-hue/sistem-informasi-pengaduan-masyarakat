-- ============================================================
-- SIPMA — Migrasi: tambah kolom complaints.location_detail
-- ============================================================
-- Field "Detail Lokasi" (opsional) untuk catatan lokasi bebas
-- dari pengadu, mis. "depan toko Madura". Lokasi utama tetap
-- berasal dari peta/GPS sebagai text + lat/lng.
-- Jalankan di Supabase Dashboard → SQL Editor.
-- Aman dijalankan ulang (idempotent).
-- ============================================================

alter table public.complaints
  add column if not exists location_detail text;