-- ============================================================
-- SIPMA — Migrasi: rename status 'terverifikasi' -> 'diterima'
-- (dan kolom verified_at -> accepted_at, log_action 'verified' -> 'accepted')
-- Jalankan di: Supabase Dashboard → SQL Editor
-- Aman dijalankan ulang (idempotent untuk sebagian besar langkah).
-- ============================================================

-- 1. Ubah nama value enum complaint_status: terverifikasi -> diterima
--    (Postgres >= 14 mendukung ALTER TYPE ... RENAME VALUE; Supabase modern OK)
do $$ begin
  alter type complaint_status rename value 'terverifikasi' to 'diterima';
exception
  when others then null;
end $$;

-- 2. Rename kolom complaints.verified_at -> accepted_at
do $$ begin
  alter table public.complaints rename column verified_at to accepted_at;
exception
  when others then null;
end $$;

-- 3. Ubah nama value enum log_action: verified -> accepted (opsional, tetap konsisten)
do $$ begin
  alter type log_action rename value 'verified' to 'accepted';
exception
  when others then null;
end $$;

-- 4. (Cadangan) Bila ada baris complaint_logs dengan action lama yang tidak
--    ikut ter-rename (mis. karena enum value sudah diubah), seragamkan:
do $$ begin
  update public.complaint_logs
     set action = 'accepted'::log_action
   where action::text = 'verified';
end $$;

-- ------------------------------------------------------------
-- Catatan:
-- - Jika ada STALE data berstatus 'terverifikasi', nilai enum lama otomatis
--   ikut ter-rename (karena kita rename value postgres-nya), jadi baris yang
--   sudah terverifikasi otomatis jadi 'diterima' — tanpa UPDATE manual.
-- - log_action lama 'verified' (di complaint_logs) juga otomatis jadi 'accepted';
--   langkah 4 menjaga kalau ada yang terlewat.
-- - Nilai 'diterima' baru dipakai semua bagian aplikasi (kode + label UI).
-- ============================================================