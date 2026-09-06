# Penjabaran Laporan SIPMA
## Sistem Informasi Pengaduan Masyarakat Kabupaten Bojonegoro

Dokumen ini menjabarkan isi laporan mengikuti **SDLC (Software Development Life Cycle) 8 fase**: Planning → Requirement → Analysis → Design → Implementation → Testing → Deployment → Maintenance.

Tiap fase dijabarkan dalam 4 bagian:
1. **Kebutuhan** — apa yang dibutuhkan pada fase ini
2. **Permasalahan** — masalah/kendala yang ditemukan
3. **Yang Dilakukan** — langkah-langkah pengerjaan
4. **Hasil** — keluaran fase

Semua data di sini fakta terverifikasi dari project.

---

# FASE 1 — PLANNING (Perencanaan)

## Kebutuhan
- Solusi pengganti sistem pengaduan manual yang berjalan di Kabupaten Bojonegoro saat ini.
- Jembatan komunikasi antar 4 pihak: **Masyarakat** (pengadu), **Petugas** (penindak lanjut), **Pimpinan** (pemantau kinerja), **Admin** (pengelola sistem).
- Kanal aduan yang bisa diakses daring dari mana saja.
- Bukti aduan resmi berupa **nomor tiket otomatis** agar proses transparan & akuntabel.

## Permasalahan
Sistem manual (datang langsung / telepon / surat, dicatat di buku pengaduan) menimbulkan:
1. **Data mudah hilang** — pencatatan manual di buku, tidak ada cadangan terpusat.
2. **Tidak ada bukti resmi** — warga tidak mendapat tanda terima aduan yang sah.
3. **Warga tidak bisa memantau status** — harus menunggu kabar lewat telepon/datang lagi.
4. **Tindak lanjut tidak terdokumentasi** — proses petugas tidak tercatat, sulit diaudit.
5. **Rekapitulasi lambat & rawan salah** — laporan kinerja dihitung manual per periode.

## Yang Dilakukan
- Identifikasi stakeholder & kebutuhan masing-masing pihak (warga, petugas, pimpinan, admin).
- Studi kelayakan: kebutuhan mendesak, solusi digital tepat karena akses internet warga meningkat.
- Pemilihan metodologi: **SDLC dengan model waterfall/sequential** — tiap fase tuntas sebelum fase berikutnya, cocok untuk tugas RPL.
- Penetapan ruang lingkup: berbasis **web** (bukan aplikasi mobile native), satu kabupaten (Bojonegoro), data uji memakai akun dummy.
- Penetapan batasan: tidak terintegrasi dengan sistem e-Lapor nasional.

## Hasil
- Metode SDLC terpilih sebagai kerangka kerja laporan.
- Ruang lingkup & batasan jelas.
- Daftar stakeholder & garis besar solusi (platform web + nomor tiket otomatis).

---

# FASE 2 — REQUIREMENT (Analisis Kebutuhan)

## Kebutuhan
- Daftar kebutuhan fungsional lengkap per modul (4 role).
- Kebutuhan non-fungsional (keamanan, kinerja, realtime, reliability).
- Prioritas implementasi agar tahu fitur mana inti vs penunjang.

## Permasalahan
- Kebutuhan banyak & tersebar di 4 role berbeda — rawan terlewat.
- Beberapa kebutuhan ambigu / belum terpikirkan detail (mis. FR-17 kelola akun, FR-18 data master + pengaturan situs).
- Sulit membedakan fitur wajib vs pelengkap tanpa skala prioritas.

## Yang Dilakukan
- Menggali kebutuhan dari pengalaman proses manual + masukan pemangku kepentingan.
- Menyusun **PRD (Product Requirements Document) SIPMA**: 18 kebutuhan fungsional (FR-01 s.d. FR-18) + 8 kebutuhan non-fungsional (NFR-01 s.d. NFR-08).
- Mengelompokkan per modul:
  - **Masyarakat** (FR-01–FR-06C): registrasi, login, buat aduan + foto, nomor tiket otomatis, lacak status, detail progres, rating, notifikasi.
  - **Petugas** (FR-07–FR-13): dashboard aduan, verifikasi/tolak, tugaskan pelaksana, tindak lanjut + bukti, kelola kategori, rekap laporan.
  - **Pimpinan** (FR-14–FR-16): statistik & grafik, unduh laporan kinerja.
  - **Admin** (FR-17–FR-18): kelola akun, riwayat login, data master, pengaturan situs.
- Penyusunan **MoSCoW**: fitur inti (Must Have) → buat aduan + tiket + pelacakan + penanganan; penunjang (Should/Could) → notifikasi email, aplikasi mobile.
- Menentukan kriteria sukses terukur (mis. nomor tiket 100% terbit otomatis, rekap bulanan tanpa hitung manual).

## Hasil
- Dokumen **PRD_SIPAMAS.md** sebagai acuan fase selanjutnya.
- Daftar 18 FR + 8 NFR terprioritaskan.
- Kriteria sukses yang bisa diuji.

---

# FASE 3 — ANALYSIS (Analisis / Perancangan Konsep)

## Kebutuhan
- Pemahaman mendalam proses bisnis aduan yang sedang berjalan.
- Model data (tabel & relasi antar entitas).
- Identifikasi aktor & kasus penggunaan (use case).
- Alur status aduan yang standar.

## Permasalahan
- Proses aduan manual **tidak terstandardisasi** — tiap bagian bisa beda prosedur.
- Kepemilikan data terpecah (buku catatan, lisan, berkas) — tidak ada satu sumber data.
- Belum ada alur status resmi yang bisa dipantau pengadu.
- Risiko keamanan jika 4 role memegang data yang sama (data pribadi pengadu).

## Yang Dilakukan
- Analisis proses bisnis: alur aduan dari warga → petugas → pelaksana → selesai/ditolak.
- Identifikasi **4 aktor** + hak akses masing-masing:
  | Peran | Hak Akses |
  |---|---|
  | Masyarakat | beranda, daftar/masuk, buat aduan, lacak, nilai |
  | Petugas | panel `/petugas` — verifikasi, tugaskan, tindak lanjut |
  | Pimpinan | panel `/pimpinan` — monitoring, statistik, laporan |
  | Admin | panel `/admin` — kelola akun, master, pengaturan situs |
- Analisis kebutuhan data → entitas utama: pengguna, kategori, aduan, riwayat log, notifikasi, wilayah.
- Perancangan **alur status aduan**:
  ```
  Diajukan → Diterima → Diproses → Selesai
              ↘ Ditolak (wajib alasan)
  ```
- Analisis risiko & mitigasi (warga awam kesulitan → UI sederhana + petugas bisa input manual).

## Hasil
- Basis untuk **use case diagram** (4 aktor + kasus per modul).
- **ERD** / skema konsep: entitas & relasi antar tabel.
- Alur status standar yang dipantau pengadu.
- Analisis risiko tertulis.

---

# FASE 4 — DESIGN (Perancangan Sistem)

## Kebutuhan
- Skema database lengkap (tabel, kolom, enum, relasi, constraint).
- Arsitektur teknis (frontend, backend, database, auth, storage, realtime).
- Rancangan antarmuka (halaman publik + 4 panel role).
- Strategi keamanan data per peran.

## Permasalahan
- **Keamanan data antar role** — warga tidak boleh melihat aduan orang lain, petugas/pimpinan/admin punya level berbeda.
- **Otomasi nomor tiket** — format harus unik & berurutan `SIPMA-YYYY-MM-NNNN`.
- **Notifikasi realtime** — perubahan status harus sampai ke pengadu cepat.
- **Upload data pribadi** (foto aduan, lokasi) harus diproteksi lalu lintasnya.

## Yang Dilakukan
- **Desain arsitektur**:
  | Layer | Teknologi |
  |---|---|
  | Frontend | Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS |
  | Backend/API | Next.js Server Actions / Route Handlers |
  | Database | Supabase (PostgreSQL) |
  | Auth | Supabase Auth (email + Google OAuth, role-based) |
  | Storage | Supabase Storage (foto aduan & bukti penanganan) |
  | Realtime | Supabase Realtime (notifikasi status) |
  | Grafik | Recharts (panel pimpinan) |
  | Export | SheetJS/xlsx (laporan Excel) |
  | Peta | Google Maps embed (lokasi aduan) |
- **Desain database** — 9 tabel inti:
  | Tabel | Kolom kunci |
  |---|---|
  | `profiles` | id, email, full_name, role (enum), is_active |
  | `complaints` | id, user_id, ticket, category_id, title, description, location, location_detail, lat, lng, status, photo, executor_id, rating, accepted_at, completed_at |
  | `complaint_logs` | id, complaint_id, action, actor, note, status_from, status_to |
  | `categories` | id, slug, name, icon, is_active |
  | `executors` | id, name, category_id, is_active |
  | `notifications` | id, user_id, complaint_id, title, body, is_read |
  | `regions` | id, name, is_active |
  | `login_logs` | id, user_id, email, ip_address, user_agent |
  | `site_settings` | id, site_name, tagline, contact_phone, contact_email, logo_url |
- **Desain RLS (Row Level Security)**: aturan per baris per role — warga hanya akses data sendiri, `is_staff()` untuk petugas/pimpinan/admin, admin-only untuk master & akun.
- **Desain UI/wireframe**: halaman publik (hero, statistik, lacak tiket, kategori, alur, aduan terbaru, kontak) + header & layout tiap panel.
- **Desain nomor tiket**: trigger database yang menerbitkan tiket otomatis saat aduan dibuat.

## Hasil
- `schema.sql` (skema + enum + RLS + trigger tiket).
- Arsitektur & alur data terdokumentasi.
- Wireframe/tata letak antarmuka.
- Strategi keamanan per role.

---

# FASE 5 — IMPLEMENTATION (Implementasi)

## Kebutuhan
- Kode aplikasi lengkap (frontend + backend + koneksi database).
- Database terisi skema + RLS + seed data.
- Fungsi auth, upload, realtime, ekspor berjalan.
- 4 panel role berfungsi.

## Permasalahan (kendala teknis di lapangan)
1. **Insert aduan gagal (FK/RLS)** — trigger komplain lama tidak isi nomor tiket dengan benar sehingga insert ditolak relasi kunci.
2. **Channel realtime ganda** — bel notifikasi di-mount 2× (desktop + mobile) pakai nama channel sama → `cannot add postgres_changes callbacks after subscribe()` → halaman kosong.
3. **Role & nama wilayah rebrand** — enum `kepala_kelurahan` diubah ke `pimpinan`, wilayah kelurahan → kabupaten; perlu migrasi data.
4. **Peta Leaflet** — dependensi berat & tidak konsisten; interpolasi lokasi kurang akurat.
5. **Upload logo kena RLS storage** — client service-role tetap jalan sebagai 'authenticated' → upload ditolak RLS walau kunci istimewa valid.
6. **Login admin mendarat salah** — semua role diarahkan ke beranda, bukan panelnya masing-masing.

## Yang Dilakukan — 8 tahap pengembangan (0–7)
| Tahap | Cakupan | Kendala & Solusi |
|---|---|---|
| T0 | Scaffold Next.js + landing publik | — |
| T1 | Supabase: schema.sql, seed, RLS, trigger tiket | **Kendala insert FK/RLS** → pisah trigger jadi BEFORE (isi tiket) + AFTER (log created), dua-duanya `SECURITY DEFINER` |
| T2 | Auth + proteksi route (middleware) | **Kendala redirect salah role** → login pilih panel berdasar `profile.role`; warga nonaktif ditolak + signout |
| T3 | Panel masyarakat (aduan, tiket, lacak, rating) | — |
| T4 | Panel petugas (verifikasi, tolak, tugaskan, tindak lanjut) | — |
| T5 | Panel pimpinan (6 stat tile + 2 grafik recharts + laporan Excel) | — |
| T6 | Notifikasi realtime | **Kendala channel ganda** → nama channel unik per instance pakai `useId()`; publikasi realtime diaktifkan di Supabase |
| T7 | Panel admin (akun, master, riwayat login, pengaturan situs) | **Kendala upload logo** → upload lewat raw fetch `POST /storage/v1/object/...` dengan header service role |

Perbaikan sepanjang jalan: **Google Maps iframe** ganti Leaflet (titik lokasi + geolocation + reverse-geocode); field lokasi detail & kategori "Lainnya" + catatan; migrasi role enum & status (`diterima` ganti `terverifikasi`); fitur cetak PDF + unduh Excel per aduan; performa pelaksana & arahan pimpinan.

## Hasil
- Seluruh 7/7+ tahap besar **selesai & terverifikasi** E2E.
- 4 panel role berfungsi penuh dengan proteksi route (middleware) + guard aksi (server action).
- Database live dengan RLS aktif, realtime aktif, trigger tiket jalan.
- Fitur unggulan: tiket `SIPMA-YYYY-MM-NNNN`, timeline penanganan, notifikasi realtime, ekspor Excel, pengaturan situs.

---

# FASE 6 — TESTING (Pengujian)

## Kebutuhan
- Verifikasi setiap fitur di tiap role benar-benar berjalan.
- Memastikan alur aduan ujung-ke-ujung: buat aduan → verifikasi → tindak lanjut → selesai.
- Memastikan keamanan RLS (role tidak bisa akses data orang lain).
- Memastikan aplikasi responsif.

## Permasalahan
- Pengujian manual berulang **lambat & rawan terlewat** bila dilakukan mata saja.
- Fitur tersebar di 4 panel — perlu menguji alur lintas role (warga mengadu, petugas menindak, pimpinan memonitor).
- Perlu memastikan RLS benar-benar menahan akses ilegal, bukan cuma tampilan.

## Yang Dilakukan
- **E2E otomatis headless Chrome (CDP)** — skrip mengendalikan browser tanpa tampilan, sesuai alur per role:
  | Fitur | Langkah Uji | Hasil |
  |---|---|---|
  | Login admin | isi email+sandi → submit | dialihkan `/admin`, badge Admin tampil → **Sesuai** |
  | Buat aduan | pilih kategori, judul, lokasi, foto | tiket `SIPMA-2026-09-0007` terbit → **Sesuai** |
  | Terima aduan | petugas klik Terima | status → Diterima, log tercatat → **Sesuai** |
  | Tugaskan pelaksana | pilih/tulis pelaksana | status → Diproses, nama pelaksana tampil → **Sesuai** |
  | Export Excel | tekan unduh laporan | file `.xlsx` valid 2 sheet → **Sesuai** |
  | Notifikasi realtime | aduan baru masuk | badge + dropdown langsung muncul → **Sesuai** |
  | Kelola akun admin | tambah staf, toggle nonaktif | staf muncul; login staf ditolak → **Sesuai** |
  | Hapus akun | hapus permanen + konfirmasi | akun hilang dari tabel & auth → **Sesuai** |
- **Pengujian RLS**: akses lintas role dicoba — petugas tak bisa masuk `/admin`, warga hanya lihat aduan sendiri (terbukti E2E).
- **Smoke test HTTP**: semua halaman merespons 200.
- **Uji responsive**: render normal desktop & mobile.

## Hasil
- Semua skenario E2E **PASS** di seluruh role.
- Tabel hasil pengujian per fitur terisi (buat lampiran laporan).
- Catatan keterbatasan: nomor pelaksana bisa diisi manual (dropdown "Lainnya"), notifikasi masih in-app (belum email), data uji sebagian seed/dummy.

---

# FASE 7 — DEPLOYMENT (Implementasi/Penyebaran)

## Kebutuhan
- Aplikasi bisa diakses publik 7×24 jam dari perangkat mana pun.
- Database tersedia secara terkelola (backup otomatis).
- Konfigurasi env & autentikasi untuk lingkungan produksi.

## Permasalahan
- Project awalnya jalan di lokal (`localhost`) — belum bisa diakses warga.
- Env variable (URL Supabase, anon key, service role key) harus diisi di lingkungan produksi.
- OAuth Google perlu konfigurasi tambahan (Client ID/Secret, redirect URL, consent screen) agar login Google jalan di produksi.
- Perlu memastikan tidak ada data/kredensial bocor ke repo publik.

## Yang Dilakukan
- **Frontend → Vercel**: repository dihubungkan, build otomatis dari git; domain produksi **si-pengaduan-masyarakat.vercel.app**.
- **Backend/DB → Supabase Cloud**: project live (PostgreSQL + Auth + Storage + Realtime), skema & RLS dijalankan di SQL Editor.
- **Environment variables** diisi di dashboard Vercel (Supabase URL, anon key, service role key).
- **Google OAuth production**: konfigurasi Client ID/Secret di Google Cloud Console → didaftarkan di provider Supabase; atur URL konfigurasi (redirect) & publish consent screen.
- `.env.local` & kredensial masuk `.gitignore` — tidak ter-commit.

## Hasil
- Aplikasi live: **si-pengaduan-masyarakat.vercel.app** — akses publik.
- Database managed dengan backup harian otomatis (Supabase).
- Auth email + Google OAuth berfungsi di produksi.
- Realtime aktif di publish `supabase_realtime`.

---

# FASE 8 — MAINTENANCE (Pemeliharaan)

## Kebutuhan
- Pemeliharaan berkelanjutan: perbaikan bug, penyesuaian data master, backup data.
- Evaluasi keterbatasan sistem untuk pengembangan berikutnya.

## Permasalahan / Keterbatasan Saat Ini
- **Notifikasi hanya in-app** — belum terkirim email/push; warga harus membuka situs.
- **Data pelaksana bisa diisi manual** (nama bebas di dropdown "Lainnya") — belum data master ketat.
- **Data uji sebagian besar seed/dummy**, bukan aduan riil.
- **Belum integrasi e-Lapor nasional**, belum ada aplikasi mobile, validasi lokasi belum DB geo.
- Kategori "Lainnya" perlu pembersihan berkala (isi catatan bebas).

## Yang Dilakukan / Rencana
- Backup otomatis diandalkan (Supabase daily backup) + tinjauan data berkala.
- Pembersihan data uji & kategori pelaksana manual.
- Penetapan daftar saran pengembangan (prioritas):
  1. Pengiriman notifikasi via **email** (dan push mobile).
  2. Integrasi dengan **e-Lapor** nasional.
  3. Aplikasi **mobile** (PWA/native).
  4. **Data wilayah & validasi lokasi** diperdalam (geodatabase).
  5. Data master pelaksana diperketat (hapus mode isi manual bebas).

## Hasil
- Daftar prioritas pemeliharaan & pengembangan lanjutan.
- Sistem slap dipelihara: skema & migrasi terdokumentasi di `supabase/` (idempotent), siap dijalankan ulang.

---

## LAMPIRAN
- Kode program lengkap (tautan repo).
- File SQL skema & migrasi (`supabase/schema.sql`, `seed.sql`, `migrate_*.sql`).
- ERD, use case diagram, activity diagram.
- Tangkapan layar tiap panel.
- Hasil pengujian E2E per fitur.

---

> **Catatan:** Angka tiket (`SIPMA-2026-09-0007`), akun uji (`warga20@gmail.com`, `petugas20@gmail.com`, `pimpinan20@gmail.com`, `admin20@gmail.com` / `test123456`), dan status (7/7 tahap selesai, E2E all pass) adalah fakta terverifikasi dari project. Ganti tempat bertanda *(di sini)* dengan tangkapan layar / kode / diagram asli.