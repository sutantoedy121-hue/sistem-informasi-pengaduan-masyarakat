-- ============================================================
-- SIPMA — Hapus kolom NIK dari tabel profiles
-- ============================================================
-- Pendaftaran cukup nama, email, no. telepon, dan sandi.
-- NIK tidak lagi dikumpulkan, sehingga kolom nik dibuang.
--
-- Jalankan di: Supabase Dashboard → SQL Editor
-- Idempotent: bisa dijalankan ulang tanpa error.
-- ============================================================

do $$
begin
  -- Constraint unique ikut terhapus saat kolom drop
  alter table public.profiles drop column if exists nik;
end $$;