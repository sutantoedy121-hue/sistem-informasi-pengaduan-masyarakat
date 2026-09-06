-- ============================================================
-- SIPMA — Migrasi Kabupaten Bojonegoro — LANGKAH 2 (setelah langkah 1)
-- ============================================================
-- Menjalankan perubahan yang MEMAKAI nilai enum 'pimpinan' (sudah ada
-- karena langkah 1 dijalankan & di-commit terlebih dahulu).
--
--   1. Update role 'kepala_kelurahan' → 'pimpinan' + drop value lama
--   2. regions  : + kolom kecamatan & desa, unique gabungan
--   3. complaints: + kolom lat & lng (koordinat titik peta)
-- Aman dijalankan ulang (idempotent).
-- ============================================================

-- ------------------------------------------------------------
-- 1. ROLE: 'kepala_kelurahan' → 'pimpinan'
-- ------------------------------------------------------------
update public.profiles
set role = 'pimpinan'::user_role
where role = 'kepala_kelurahan'::user_role;

-- Postgres 14+ mendukung drop value. Bila versi < 14, abaikan baris ini.
do $$ begin
  execute 'alter type public.user_role drop value ''kepala_kelurahan''';
exception when others then null; end $$;


-- ------------------------------------------------------------
-- 2. REGIONS: wilayah berjenjang Kecamatan → Desa → RT/RW
--    rw/rt boleh NULL untuk aduan di level kecamatan/desa.
-- ------------------------------------------------------------
alter table public.regions
  add column if not exists kecamatan text,
  add column if not exists desa    text;

-- Ganti unique (rw, rt) → unique gabungan (kecamatan, desa, rw, rt)
alter table public.regions
  drop constraint if exists regions_rw_rt_key;

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'regions_region_unique'
  ) then
    alter table public.regions
      add constraint regions_region_unique unique (kecamatan, desa, rw, rt);
  end if;
end $$;


-- ------------------------------------------------------------
-- 3. COMPLAINTS: kolom koordinat titik peta
-- ------------------------------------------------------------
alter table public.complaints
  add column if not exists lat double precision,
  add column if not exists lng double precision;