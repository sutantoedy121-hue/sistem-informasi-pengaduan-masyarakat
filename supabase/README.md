# Setup Supabase — SIPMA

Panduan menyiapkan backend Supabase untuk SIPMA.

## 1. Buat Project Supabase

1. Buka [supabase.com](https://supabase.com) → **New Project**
2. Isi nama, region (pilih yang terdekat), set password database
3. Tunggu provisioning selesai (±2 menit)

## 2. Ambil Kredensial API

Buka **Project Settings → API**, salin:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (jangan expose ke client!)

## 3. Konfigurasi Environment

```bash
cp .env.example .env.local
```

Isi `.env.local` dengan nilai dari langkah 2.

## 4. Jalankan Schema & Seed

Buka **SQL Editor** di dashboard Supabase, jalankan berurutan:

1. `supabase/schema.sql` — buat tabel, enum, RLS, trigger, storage bucket
2. `supabase/seed.sql` — isi data master (kategori, wilayah, pelaksana)

## 5. Konfigurasi Auth

**Authentication → Sign In / Up**:
- Pastikan **Email** provider aktif
- (Opsional) matikan "Confirm email" untuk development

**Authentication → URL Configuration**:
- Site URL: `http://localhost:3000`
- Redirect URLs: tambahkan `http://localhost:3000/auth/callback`

## 6. Aktifkan Realtime (NFR-08)

**Database → Replication** → aktifkan realtime untuk tabel:
- `complaints`
- `complaint_logs`
- `notifications`

## 7. (Opsional) Reset Nomor Tiket per Bulan

Aktifkan `pg_cron` lalu uncomment baris `cron.schedule` di akhir `schema.sql`
supaya nomor urut tiket reset tiap awal bulan.

## 8. Buat Akun Staf

1. Daftar akun via form `/register` atau dashboard Auth
2. Upgrade role via SQL Editor:

```sql
-- Jadikan petugas
update public.profiles
set role = 'petugas'::user_role
where id = (select id from auth.users where email = 'petugas@bojonegorokab.go.id');

-- Jadikan pimpinan
update public.profiles
set role = 'pimpinan'::user_role
where id = (select id from auth.users where email = 'pimpinan@bojonegorokab.go.id');
```

## 9. Verifikasi

- `npm run dev` → buka `http://localhost:3000`
- Coba register → cek di Auth dashboard muncul user baru + profile terbuat
- Coba buat aduan → cek nomor tiket otomatis terbit di tabel `complaints`

## Struktur File

```
supabase/
├── schema.sql   # DDL: tabel, enum, RLS, trigger, storage
├── seed.sql     # Data master: kategori, wilayah, pelaksana
└── README.md    # Dokumentasi setup (file ini)
```

## Model Data (ringkasan)

| Tabel | Isi |
|---|---|
| `profiles` | Profil user + role, link ke `auth.users` |
| `regions` | Data wilayah RT/RW |
| `categories` | Kategori aduan |
| `executors` | Pelaksana penanganan |
| `complaints` | Aduan + nomor tiket + status |
| `complaint_logs` | Riwayat perubahan & tindak lanjut |
| `notifications` | Notifikasi ke pengadu |

**Status alur**: `diajukan → diterima/ditolak → diproses → selesai`
