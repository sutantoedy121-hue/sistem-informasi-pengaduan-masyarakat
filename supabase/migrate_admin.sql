-- ============================================================
-- SIPMA — Panel Admin (FR-17/18)
-- 1) Tabel `login_logs`: riwayat login (IP + perangkat) untuk admin.
-- 2) Tabel `site_settings`: pengaturan situs (nama, tagline, kontak)
--    ditampilkan di Footer.
-- 3) Kolom `regions.is_active` + policy modify khusus admin (soft-toggle
--    wilayah; kategorI/pelaksana sudah tertutup `is_staff()`).
-- 4) Berkas ini TIDAK membuat akun admin (perlu auth.admin.create_user
--    dengan service role, lihat bagian AKUN ADMIN di bawah) — jalankan
--    bagian itu terpisah di SQL Editor bila akun admin belum ada.
-- Jalankan di: Supabase Dashboard → SQL Editor. Aman dijalankan ulang.
-- ============================================================

-- ------------------------------------------------------------
-- 1. LOGIN LOGS
-- ------------------------------------------------------------
create table if not exists public.login_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  email      text,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_login_logs_user on public.login_logs(user_id, created_at desc);

alter table public.login_logs enable row level security;

-- user bisa mencatat baris login dirinya sendiri (dari server action login)
drop policy if exists "login_logs_insert_own" on public.login_logs;
create policy "login_logs_insert_own" on public.login_logs
  for insert with check (user_id = auth.uid());

-- user hanya lihat riwayat login sendiri
drop policy if exists "login_logs_select_own" on public.login_logs;
create policy "login_logs_select_own" on public.login_logs
  for select using (user_id = auth.uid());

-- admin lihat semua baris login
drop policy if exists "login_logs_select_admin" on public.login_logs;
create policy "login_logs_select_admin" on public.login_logs
  for select using (public.current_user_role() = 'admin');

-- ------------------------------------------------------------
-- 2. SITE SETTINGS (single row, id = 1)
-- ------------------------------------------------------------
create table if not exists public.site_settings (
  id               int primary key default 1 check (id = 1),
  site_name        text not null default 'SIPMA',
  tagline          text,
  contact_phone    text,
  contact_email    text,
  contact_address  text,
  updated_at       timestamptz not null default now()
);

alter table public.site_settings enable row level security;

drop trigger if exists trg_site_settings_updated on public.site_settings;
create trigger trg_site_settings_updated
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- dibaca publik (Navbar/Footer); diperbarui hanya admin
drop policy if exists "site_settings_select_public" on public.site_settings;
create policy "site_settings_select_public" on public.site_settings
  for select using (true);

drop policy if exists "site_settings_update_admin" on public.site_settings;
create policy "site_settings_update_admin" on public.site_settings
  for update using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- seed baris default
insert into public.site_settings (id, site_name, tagline, contact_phone, contact_email, contact_address)
values (
  1,
  'SIPMA',
  'Sistem Informasi Pengaduan Masyarakat',
  '(021) 1234-5678',
  'sipma@bojonegorokab.go.id',
  'Jalan Pemuda No. 1, Kec. Bojonegoro, Kabupaten Bojonegoro'
)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 3. REGIONS: soft-toggle aktif + policy modify khusus admin
-- ------------------------------------------------------------
alter table public.regions add column if not exists is_active boolean not null default true;

drop policy if exists "regions_select" on public.regions;
create policy "regions_select" on public.regions
  for select using (is_active = true or public.is_staff());

-- wilayah hanya dikelola admin (sebelumnya tidak ada policy modify sama sekali)
drop policy if exists "regions_admin_modify" on public.regions;
create policy "regions_admin_modify" on public.regions
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- ============================================================
-- AKUN ADMIN (jalankan terpisah; butuh service role / admin)
-- ============================================================
-- 1) Buat user admin (trigger handle_new_user otomatis membuat profile
--    ber-role 'masyarakat'):
--    select auth.admin.create_user(
--      '{"email":"admin20@gmail.com","password":"test123456","email_confirm":true,"user_metadata":{"full_name":"Admin Sistem"}}'::jsonb
--    );
-- 2) Naikkan role profile → admin:
--    update public.profiles
--    set role = 'admin'::user_role
--    where id = (select id from auth.users where email = 'admin20@gmail.com');