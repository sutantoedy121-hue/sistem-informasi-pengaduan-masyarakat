-- ============================================================
-- SIPMA — Seed Data
-- Jalankan SETELAH schema.sql. Mengisi data master & contoh.
-- ============================================================

-- ------------------------------------------------------------
-- Regions (Kecamatan → Desa → RT/RW) — data contoh Kabupaten Bojonegoro
--   - Baris level desa: rw/rt NULL (aduan di level desa).
--   - Baris level RT/RW: dilengkapi rw & rt.
-- Daftar kecamatan/desa di bawah contoh nyata; bisa diperluas sesuai
-- master wilayah resmi. Untuk cakupan penuh lihat seed_regions_kabupaten.sql
-- ------------------------------------------------------------
insert into public.regions (kecamatan, desa, rw, rt, name) values
  ('Bojonegoro', 'Karang Pacar', NULL, NULL, 'Desa Karang Pacar, Kec. Bojonegoro'),
  ('Bojonegoro', 'Karang Pacar', 1, 1, 'Karang Pacar RW 01 RT 01'),
  ('Bojonegoro', 'Karang Pacar', 1, 2, 'Karang Pacar RW 01 RT 02'),
  ('Bojonegoro', 'Sukorejo', NULL, NULL, 'Desa Sukorejo, Kec. Bojonegoro'),
  ('Bojonegoro', 'Sukorejo', 1, 1, 'Sukorejo RW 01 RT 01'),
  ('Bojonegoro', 'Sukorejo', 2, 1, 'Sukorejo RW 02 RT 01'),
  ('Kedungadem', 'Kedungadem', NULL, NULL, 'Desa Kedungadem, Kec. Kedungadem'),
  ('Kedungadem', 'Kedungadem', 1, 1, 'Kedungadem RW 01 RT 01'),
  ('Kapas', 'Bogo', NULL, NULL, 'Desa Bogo, Kec. Kapas'),
  ('Kapas', 'Bogo', 1, 1, 'Bogo RW 01 RT 01'),
  ('Kapas', 'Bogo', 1, 3, 'Bogo RW 01 RT 03')
on conflict (kecamatan, desa, rw, rt) do nothing;

-- ------------------------------------------------------------
-- Categories — kategori aduan
-- ------------------------------------------------------------
insert into public.categories (slug, name, icon, description, color, is_active) values
  ('jalan',       'Infrastruktur Jalan',  'TrafficCone', 'Kerusakan jalan, trotoar, dan jembatan', 'bg-brand-50 text-brand-700', true),
  ('pju',         'Penerangan Jalan',     'Lightbulb',    'Lampu PJU mati atau rusak',             'bg-amber-50 text-amber-700', true),
  ('sampah',      'Kebersihan & Sampah',  'Trash2',       'TPS penuh, saluran mampet',            'bg-emerald-50 text-emerald-700', true),
  ('drainase',    'Drainase & Banjir',    'Droplets',     'Pendangkalan saluran, genangan',       'bg-sky-50 text-sky-700', true),
  ('lainnya',     'Lainnya',             'FileText',     'Keluhan lain di luar kategori di atas', 'bg-violet-50 text-violet-700', true),
  ('ketertiban', 'Ketertiban Umum',     'ShieldCheck',  'Gangguan ketertiban & keamanan',       'bg-rose-50 text-rose-700', true)
on conflict (slug) do nothing;

-- ------------------------------------------------------------
-- Executors — pelaksana penanganan per kategori
-- ------------------------------------------------------------
insert into public.executors (name, category_id, is_active)
select 'Tim Infrastruktur & Jalan', c.id, true from public.categories c where c.slug = 'jalan'
union all
select 'Tim PJU', c.id, true from public.categories c where c.slug = 'pju'
union all
select 'Tim Kebersihan', c.id, true from public.categories c where c.slug = 'sampah'
union all
select 'Tim Drainase', c.id, true from public.categories c where c.slug = 'drainase'
union all
select 'Tim Administrasi', c.id, true from public.categories c where c.slug = 'lainnya'
union all
select 'Tim Ketertiban (Linmas)', c.id, true from public.categories c where c.slug = 'ketertiban'
on conflict do nothing;

-- ------------------------------------------------------------
-- CATATAN:
-- Akun masyarakat, petugas, pimpinan dibuat via Supabase Auth
-- (sign-up form atau dashboard Auth). Trigger handle_new_user otomatis
-- membuat profile dengan role 'masyarakat'.
--
-- Untuk upgrade role ke petugas/pimpinan/admin, jalankan
-- (ganti email target):
--   update public.profiles
--   set role = 'petugas'::user_role
--   where id = (select id from auth.users where email = 'petugas@bojonegorokab.go.id');
--
-- Contoh aduan TIDAK di-seed di sini karena butuh reporter_id (auth user).
-- Setelah akun masyarakat dibuat, aduan bisa ditambah via aplikasi.
