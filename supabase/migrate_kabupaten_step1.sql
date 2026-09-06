-- ============================================================
-- SIPMA — Migrasi Kabupaten Bojonegoro — LANGKAH 1 (jalankan PERTAMA)
-- ============================================================
-- Cukup menambahkan nilai enum 'pimpinan'.
-- JANGAN sertakan statement lain di sini: nilai enum baru hanya bisa
-- dipakai pada transaksi/eksekusi SEPARUH berikutnya (HINT: "New enum
-- values must be committed before they can be used").
-- Aman dijalankan ulang (idempotent): `add value if not exists`.
-- ============================================================

alter type public.user_role add value if not exists 'pimpinan';