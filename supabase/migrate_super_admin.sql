-- ------------------------------------------------------------
-- MIGRASI SUPER ADMIN: BLOKIR IP & WILAYAH LENGKAP
-- ------------------------------------------------------------

-- 1. Tabel blocked_ips untuk keamanan (FR-17)
create table if not exists public.blocked_ips (
  id uuid primary key default gen_random_uuid(),
  ip_address text not null unique,
  reason text,
  blocked_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.blocked_ips enable row level security;

-- Hanya admin yang dapat melihat & mengelola blocked_ips
drop policy if exists "blocked_ips_admin_all" on public.blocked_ips;
create policy "blocked_ips_admin_all" on public.blocked_ips
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- 2. Pastikan tabel regions memiliki kolom kecamatan dan desa aktif
alter table public.regions add column if not exists kecamatan text;
alter table public.regions add column if not exists desa text;
alter table public.regions add column if not exists is_active boolean not null default true;
