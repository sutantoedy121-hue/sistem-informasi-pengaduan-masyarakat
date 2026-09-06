-- ============================================================
-- SIPMA — Migrasi: kategori "Lainnya" + kolom complaints.category_note
-- ============================================================
-- 1. Ganti kategori slug 'administrasi' (label "Layanan Administrasi")
--    menjadi kategori "Lainnya" (slug 'lainnya', icon FileText).
-- 2. Tambah kolom category_note untuk catatan jenis keluhan, dipakai
--    saat pengadu memilih kategori "Lainnya" (mis. "Kabel Putus"),
--    sehingga tampil "Lainnya (Kabel Putus)".
-- Jalankan di Supabase Dashboard → SQL Editor.
-- Aman dijalankan ulang (idempotent).
-- ============================================================

-- 1. Kolom catatan pada complaints
alter table public.complaints
  add column if not exists category_note text;

-- 2. Rename kategori "Layanan Administrasi" → "Lainnya"
update public.categories
  set name = 'Lainnya',
      slug = 'lainnya',
      description = 'Keluhan lain yang belum tercantum pada kategori lain'
  where slug = 'administrasi';

-- 3. Jaga FK ke kategori lama tetap valid: buat kategori 'lainnya' bila slug
--    'administrasi' tidak ada (mis. DB fresh), lalu pindahkan referensi.
insert into public.categories (slug, name, icon, description, color, is_active)
select 'lainnya', 'Lainnya', 'FileText', 'Keluhan lain yang belum tercantum pada kategori lain', 'bg-violet-50 text-violet-700', true
where not exists (select 1 from public.categories where slug = 'lainnya')
  and not exists (select 1 from public.categories where slug = 'administrasi');

-- 4. Pindahkan executor "Tim Administrasi" ke kategori 'lainnya' bila ada,
--    agar tetap satu baris pelaksana untuk kategori ini.
--    (update ini aman walau 'administrasi' sudah hilang.)
update public.executors e
  set category_id = c.id
  from public.categories c
  where c.slug = 'lainnya'
    and e.name = 'Tim Administrasi'
    and e.category_id is distinct from c.id;

-- 5. Rapikan baris kategori lama yang tersisa non-aktif (kalau ada)
update public.categories
  set is_active = true
  where slug = 'lainnya';