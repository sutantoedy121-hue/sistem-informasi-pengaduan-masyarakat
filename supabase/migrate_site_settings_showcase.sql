-- ------------------------------------------------------------
-- MIGRASI TAMBAHAN PENGATURAN SITUS (SHOWCASE SETTINGS)
-- ------------------------------------------------------------

-- Tambahkan kolom showcase_enabled & showcase_ids ke tabel site_settings jika belum ada
alter table public.site_settings add column if not exists showcase_enabled boolean not null default true;
alter table public.site_settings add column if not exists showcase_ids text;

-- Pastikan baris id = 1 ada
insert into public.site_settings (id, site_name, showcase_enabled)
values (1, 'SIPMA', true)
on conflict (id) do nothing;
