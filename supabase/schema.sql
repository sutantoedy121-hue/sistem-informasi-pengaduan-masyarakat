-- ============================================================
-- SIPMA — Database Schema (Supabase / PostgreSQL)
-- Sistem Informasi Pengaduan Masyarakat Kabupaten Bojonegoro
-- ============================================================
-- Jalankan file ini di: Supabase Dashboard → SQL Editor
-- Aman dijalankan ulang (idempotent untuk sebagian besar objek).
-- ============================================================

-- Extensions
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. ENUM TYPES
-- ------------------------------------------------------------

do $$ begin
  create type user_role as enum ('masyarakat', 'petugas', 'pimpinan', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type complaint_status as enum
    ('diajukan', 'diterima', 'ditolak', 'diproses', 'selesai');
exception when duplicate_object then null; end $$;

do $$ begin
  create type log_action as enum
    ('created', 'accepted', 'rejected', 'assigned', 'progress', 'completed', 'reopened', 'rated');
exception when duplicate_object then null; end $$;


-- ------------------------------------------------------------
-- 2. TABLES
-- ------------------------------------------------------------

-- regions: data wilayah berjenjang Kecamatan → Desa → RT/RW
-- rw/rt boleh NULL untuk aduan di level kecamatan/desa.
create table if not exists public.regions (
  id          uuid primary key default gen_random_uuid(),
  kecamatan   text,
  desa        text,
  rw          smallint,
  rt          smallint,
  name        text,
  unique (kecamatan, desa, rw, rt),
  created_at  timestamptz not null default now()
);

-- categories: kategori aduan
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  icon        text,
  description text,
  color       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- profiles: profil pengguna, terhubung ke auth.users
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          user_role not null default 'masyarakat',
  full_name     text,
  phone         text,
  address       text,
  region_id     uuid references public.regions(id),
  avatar_url    text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- executors: pelaksana penanganan (bisa profile petugas atau tim eksternal)
create table if not exists public.executors (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category_id uuid references public.categories(id),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- complaints: aduan
create table if not exists public.complaints (
  id           uuid primary key default gen_random_uuid(),
  ticket       text not null unique,
  reporter_id  uuid not null references public.profiles(id) on delete cascade,
  category_id  uuid references public.categories(id),
  executor_id  uuid references public.executors(id),
  region_id    uuid references public.regions(id),
  title        text not null,
  description  text not null,
  location        text,
  location_detail text,
  category_note   text,
  lat             double precision,
  lng             double precision,
  photo_url    text,
  status       complaint_status not null default 'diajukan',
  rating       smallint check (rating between 1 and 5),
  rating_note  text,
  target_date  date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  accepted_at  timestamptz,
  completed_at timestamptz
);

-- complaint_logs: riwayat perubahan status & tindak lanjut
create table if not exists public.complaint_logs (
  id            uuid primary key default gen_random_uuid(),
  complaint_id  uuid not null references public.complaints(id) on delete cascade,
  actor_id      uuid references public.profiles(id),
  action        log_action not null,
  status_from   complaint_status,
  status_to     complaint_status,
  description   text,
  result        text,
  photo_url     text,
  created_at    timestamptz not null default now()
);

-- notifications: catatan notifikasi yang dikirim ke pengadu
create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  complaint_id uuid references public.complaints(id) on delete cascade,
  title        text not null,
  body         text,
  is_read      boolean not null default false,
  created_at   timestamptz not null default now()
);


-- ------------------------------------------------------------
-- 3. INDEXES
-- ------------------------------------------------------------

create index if not exists idx_complaints_ticket       on public.complaints(ticket);
create index if not exists idx_complaints_reporter    on public.complaints(reporter_id);
create index if not exists idx_complaints_status      on public.complaints(status);
create index if not exists idx_complaints_category    on public.complaints(category_id);
create index if not exists idx_complaints_created_at  on public.complaints(created_at desc);
create index if not exists idx_logs_complaint          on public.complaint_logs(complaint_id);
create index if not exists idx_notifications_user      on public.notifications(user_id, is_read);
create index if not exists idx_profiles_role          on public.profiles(role);


-- ------------------------------------------------------------
-- 4. AUTO-UPDATED_AT TRIGGERS
-- ------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_profiles_updated  on public.profiles;
create trigger trg_profiles_updated  before update on public.profiles  for each row execute function public.set_updated_at();

drop trigger if exists trg_complaints_updated on public.complaints;
create trigger trg_complaints_updated before update on public.complaints for each row execute function public.set_updated_at();


-- ------------------------------------------------------------
-- 5. NOMOR TIKET OTOMATIS (FR-04)
--    Format: SIPMA-YYYY-MM-NNNN  (urut per bulan)
-- ------------------------------------------------------------

create or replace function public.generate_ticket()
returns text language plpgsql as $$
declare
  seq_val bigint;
  ticket_val text;
  y text := to_char(now(), 'YYYY');
  m text := to_char(now(), 'MM');
begin
  seq_val := nextval('public.ticket_seq');
  ticket_val := 'SIPMA-' || y || '-' || m || '-' || lpad(seq_val::text, 4, '0');
  return ticket_val;
end $$;

-- sequence untuk penomoran tiket per-bulan reset (lihat job di bawah)
do $$ begin
  create sequence if not exists public.ticket_seq start 1;
exception when duplicate_object then null; end $$;

-- trigger: terbitkan tiket + log awal saat aduan baru dibuat
create or replace function public.handle_new_complaint()
returns trigger language plpgsql as $$
begin
  new.ticket := public.generate_ticket();
  insert into public.complaint_logs (complaint_id, actor_id, action, status_to, description)
  values (new.id, new.reporter_id, 'created', 'diajukan', 'Aduan diajukan oleh warga');
  return new;
end $$;

drop trigger if exists trg_complaints_ticket on public.complaints;
create trigger trg_complaints_ticket
  before insert on public.complaints
  for each row execute function public.handle_new_complaint();


-- ------------------------------------------------------------
-- 6. AUTO-CREATE PROFILE saat user mendaftar (Supabase Auth)
-- ------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    'masyarakat'::user_role,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (NFR-04, NFR-05)
-- ------------------------------------------------------------

alter table public.profiles        enable row level security;
alter table public.regions         enable row level security;
alter table public.categories      enable row level security;
alter table public.executors       enable row level security;
alter table public.complaints      enable row level security;
alter table public.complaint_logs  enable row level security;
alter table public.notifications   enable row level security;

-- Helper: role current user
create or replace function public.current_user_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Helper: apakah current user adalah staf (petugas/pimpinan/admin)
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select role in ('petugas','pimpinan','admin') from public.profiles where id = auth.uid();
$$;

-- profiles: tiap user lihat profil sendiri; staf lihat semua
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (id = auth.uid() or public.is_staff());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update using (id = auth.uid());

drop policy if exists "profiles_staff_update" on public.profiles;
create policy "profiles_staff_update" on public.profiles
  for update using (public.is_staff());

-- regions & categories: publik bisa baca
drop policy if exists "regions_select" on public.regions;
create policy "regions_select" on public.regions
  for select using (true);

drop policy if exists "categories_select" on public.categories;
create policy "categories_select" on public.categories
  for select using (is_active = true or public.is_staff());

drop policy if exists "categories_staff_modify" on public.categories;
create policy "categories_staff_modify" on public.categories
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "executors_select" on public.executors;
create policy "executors_select" on public.executors
  for select using (is_active = true or public.is_staff());

drop policy if exists "executors_staff_modify" on public.executors;
create policy "executors_staff_modify" on public.executors
  for all using (public.is_staff()) with check (public.is_staff());

-- complaints:
-- select: publik lihat semua aduan (transparansi), TAPI data reporter terbatas
drop policy if exists "complaints_select_public" on public.complaints;
create policy "complaints_select_public" on public.complaints
  for select using (true);

-- insert: masyarakat autentik bisa ajukan aduan untuk dirinya
drop policy if exists "complaints_insert_reporter" on public.complaints;
create policy "complaints_insert_reporter" on public.complaints
  for insert with check (reporter_id = auth.uid());

-- update: pelapor hanya boleh isi rating saat selesai (FR-06)
drop policy if exists "complaints_update_reporter" on public.complaints;
create policy "complaints_update_reporter" on public.complaints
  for update using (reporter_id = auth.uid())
  with check (reporter_id = auth.uid());

-- update: staf kelola status/penugasan
drop policy if exists "complaints_update_staff" on public.complaints;
create policy "complaints_update_staff" on public.complaints
  for update using (public.is_staff())
  with check (public.is_staff());

-- complaint_logs: publik baca (transparansi progres); insert oleh pemilik aduan atau staf
drop policy if exists "logs_select_public" on public.complaint_logs;
create policy "logs_select_public" on public.complaint_logs
  for select using (true);

drop policy if exists "logs_insert_staff" on public.complaint_logs;
create policy "logs_insert_staff" on public.complaint_logs
  for insert with check (public.is_staff());

drop policy if exists "logs_insert_reporter" on public.complaint_logs;
create policy "logs_insert_reporter" on public.complaint_logs
  for insert with check (
    exists (
      select 1 from public.complaints c
      where c.id = complaint_logs.complaint_id
        and c.reporter_id = auth.uid()
    )
  );

-- notifications: tiap user hanya lihat notifikasinya sendiri
drop policy if exists "notif_select_own" on public.notifications;
create policy "notif_select_own" on public.notifications
  for select using (user_id = auth.uid());

drop policy if exists "notif_update_own" on public.notifications;
create policy "notif_update_own" on public.notifications
  for update using (user_id = auth.uid());

drop policy if exists "notif_insert_staff" on public.notifications;
create policy "notif_insert_staff" on public.notifications
  for insert with check (public.is_staff());


-- ------------------------------------------------------------
-- 8. STORAGE BUCKET (foto aduan & bukti penanganan)
-- ------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('complaint-photos', 'complaint-photos', true)
on conflict (id) do nothing;

-- Policy: publik bisa baca, user autentik bisa upload ke path berprefix uid-nya
drop policy if exists "photos_public_read" on storage.objects;
create policy "photos_public_read" on storage.objects
  for select using (bucket_id = 'complaint-photos');

drop policy if exists "photos_auth_upload" on storage.objects;
create policy "photos_auth_upload" on storage.objects
  for insert with check (
    bucket_id = 'complaint-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- staf bisa upload foto bukti penanganan ke path penanganan
drop policy if exists "photos_staff_upload" on storage.objects;
create policy "photos_staff_upload" on storage.objects
  for insert with check (
    bucket_id = 'complaint-photos' and public.is_staff()
  );


-- ------------------------------------------------------------
-- 9. RESET SEQUENCE TIKET TIAP AWAL BULAN (pg_cron opsional)
-- ------------------------------------------------------------
-- Aktifkan pg_cron dulu: create extension if not exists pg_cron;
-- lalu uncomment baris di bawah untuk reset nomor urut tiap bulan.
--
-- select cron.schedule('reset_ticket_seq', '0 0 1 * *', $$ select setval('public.ticket_seq', 1, false); $$);
