# Product Requirements Document (PRD)
## Sistem Informasi Pengaduan Masyarakat (SIPMA)
### Kabupaten Bojonegoro

| | |
|---|---|
| **Versi** | 1.0 |
| **Tahap** | Rekayasa Perangkat Lunak — Turunan dari Tahap 1 (Analisis Masalah & Kebutuhan) |
| **Tech Stack** | Next.js, React, TypeScript, Tailwind CSS, Supabase |
| **Tahun Ajaran** | 2025/2026 |

---

## 1. Latar Belakang

Proses pengaduan masyarakat di Kabupaten Bojonegoro saat ini sebagian masih dilakukan secara manual: warga datang langsung atau menelepon, petugas mencatat di buku pengaduan, lalu meneruskan secara lisan/berkas ke bagian terkait. Proses ini menimbulkan beberapa masalah:

- Data mudah hilang karena pencatatan manual
- Tidak ada bukti resmi bahwa aduan telah diterima
- Warga tidak bisa memantau status aduannya
- Tindak lanjut petugas tidak terdokumentasi
- Rekapitulasi laporan lambat dan rawan kesalahan

SIPMA dibangun sebagai solusi digital untuk menjembatani tiga pihak: **Masyarakat** (pengadu), **Petugas** (penindak lanjut), dan **Pimpinan** (pemantau kinerja), dengan sistem pelacakan status berbasis nomor tiket agar proses menjadi transparan dan akuntabel.

## 2. Tujuan Produk

- Menyediakan kanal pengaduan daring yang bisa diakses dari mana saja
- Memberikan bukti aduan (nomor tiket) secara otomatis
- Memungkinkan pelacakan status aduan secara real-time
- Mendokumentasikan seluruh proses tindak lanjut secara terstruktur
- Menghasilkan laporan & statistik otomatis untuk pengambilan keputusan

## 3. Target Pengguna & Peran

SIPMA memakai **4 peran** (tersimpan sebagai nilai enum PostgreSQL `user_role` di kolom
`profiles.role`): `masyarakat`, `petugas`, `pimpinan`, dan `admin`. Setiap akun dibuat
dengan peran default `masyarakat`; kenaikan peran ke `petugas`/`pimpinan`/`admin`
dilakukan oleh admin melalui database/panel (tidak diubah langsung oleh pengguna).

| Peran | Nilai DB (`user_role`) | Hak Akses Utama | Kebutuhan Utama |
|---|---|---|---|
| Masyarakat (Pengadu) | `masyarakat` | Akses beranda publik; daftar/masuk; buat aduan + upload foto; lacak tiket & cek progres; nilai aduan saat selesai | Kemudahan akses, transparansi status |
| Petugas | `petugas` | Akses panel petugas `/petugas`: dashboard, verifikasi/penolakan aduan, penugasan pelaksana, tindak lanjut, dokumentasi bukti, laporan | Efisiensi kerja, data terpusat |
| Pimpinan | `pimpinan` | Akses panel pimpinan `/pimpinan`: monitoring kinerja, statistik, rekap & laporan | Statistik dan rekap kinerja |
| Admin Sistem | `admin` | Akses panel admin `/admin`: kelola pengguna & peran, kategori, konfigurasi, data master wilayah | Kemudahan administrasi sistem |

> **Catatan penetapan peran:** role disimpan di tabel `profiles` dan dipilih lewat
> RLS (mis. `is_staff()` = `petugas | pimpinan | admin`). Seluruh pengguna termasuk
> petugas/pimpinan tetap bisa login lewat Supabase Auth; hanya tampilan/route yang
> dibebankan sesuai peran.

## 4. Ruang Lingkup (Scope)

### 4.1 Prioritas MoSCoW

| Prioritas | Cakupan |
|---|---|
| **Must Have** | Registrasi/login, buat aduan + upload foto, nomor tiket otomatis, lacak status, notifikasi real-time, detail progres, dokumentasi bukti penanganan, panel petugas (dashboard, verifikasi, penugasan, tindak lanjut), panel pimpinan (statistik & laporan) |
| **Should Have** | Kelola kategori aduan, unduh laporan kinerja |
| **Could Have** | Export laporan PDF/Excel, kelola akun pengguna, kelola data master (wilayah/RT-RW) |
| **Won't Have (rilis awal)** | Integrasi e-Lapor nasional, aplikasi mobile native |

### 4.2 Di Luar Lingkup
- Integrasi dengan sistem pengaduan nasional
- Aplikasi mobile native (Android/iOS)

## 5. Kebutuhan Fungsional (Functional Requirements)

### A. Modul Masyarakat (Pengadu)
| Kode | Kebutuhan |
|---|---|
| FR-01 | Registrasi akun dengan data diri dan kontak |
| FR-02 | Login dan logout |
| FR-03 | Membuat aduan baru (kategori, judul, deskripsi, lokasi, upload foto) |
| FR-04 | Menerima nomor tiket otomatis |
| FR-05 | Melacak status aduan berdasarkan nomor tiket |
| FR-06 | Konfirmasi/penilaian penanganan selesai |
| FR-06A | Notifikasi real-time perubahan status (in-app, opsional email) |
| FR-06B | Melihat detail progres (tanggal mulai, pelaksana, tahap, target selesai) |
| FR-06C | Melihat/unduh dokumentasi bukti penanganan (foto sebelum-sesudah, berita acara) |

### B. Modul Petugas
| Kode | Kebutuhan |
|---|---|
| FR-07 | Login panel petugas |
| FR-08 | Dashboard daftar aduan, terfilter kategori/status |
| FR-09 | Verifikasi/tolak aduan |
| FR-10 | Menugaskan aduan ke pelaksana & update status |
| FR-11 | Mencatat detail tindak lanjut (tanggal, uraian, hasil, foto) |
| FR-12 | Mengelola kategori aduan |
| FR-13 | Menghasilkan laporan rekapitulasi per periode/kategori |

### C. Modul Pimpinan
| Kode | Kebutuhan |
|---|---|
| FR-14 | Login panel pimpinan |
| FR-15 | Statistik & ringkasan aduan (grafik per kategori & status) |
| FR-16 | Mengunduh laporan kinerja |

### D. Modul Admin Sistem
| Kode | Kebutuhan |
|---|---|
| FR-17 | Mengelola akun pengguna (tambah/ubah/reset/nonaktifkan/memblokir ip jika mencurigakan (melihat ip device)/melihat riwayat login (aktivitas)/ dan tambahkan lainnya yang sangat detail (saya belum kepikiran lainnya)) |
| FR-18 | Mengelola data master (kategori, pelaksana, wilayah, dan lainnya menjabar) bisa di tambahkan apa lagi yang bisa mengontorol penuh contohnya pengaturan situs, bisa merubah logo, teks heading, nama, nomor, dll intinya tentang situs |

## 6. Kebutuhan Non-Fungsional

| Kode | Kategori | Deskripsi | Implementasi Teknis (Stack Terpilih) |
|---|---|---|---|
| NFR-01 | Usability | Antarmuka sederhana berbahasa Indonesia, dipahami < 15 menit | Tailwind CSS + komponen UI konsisten |
| NFR-02 | Availability | Akses 7×24 jam, uptime ≥ 99% | Hosting Vercel (Next.js) + Supabase managed DB |
| NFR-03 | Performance | Waktu muat ≤ 3 detik untuk 100 pengguna bersamaan | Next.js SSR/ISR, image optimization, edge caching |
| NFR-04 | Security | Password ter-hash, otorisasi berbasis peran, proteksi SQLi/XSS | Supabase Auth + Row Level Security (RLS), parameterized query bawaan Supabase client |
| NFR-05 | Integrity | Data aduan tidak dapat diubah pengadu setelah diverifikasi, riwayat perubahan tercatat | RLS policy + tabel audit/log status |
| NFR-06 | Reliability | Data tidak boleh hilang, backup otomatis harian | Supabase automatic daily backup |
| NFR-07 | Compatibility | Browser populer, tampilan responsif | Next.js + Tailwind responsive design |
| NFR-08 | Realtime | Perubahan status terkirim ke pengadu ≤ 1 menit | Supabase Realtime (Postgres changes subscription) |

## 7. Arsitektur & Tech Stack

| Layer | Teknologi | Keterangan |
|---|---|---|
| Frontend | Next.js (App Router) + React + TypeScript | SSR/CSR hybrid, routing halaman publik & panel |
| Styling | Tailwind CSS | Utility-first, responsif |
| Backend/API | Next.js Route Handlers / Server Actions | Menjembatani ke Supabase |
| Database | Supabase (PostgreSQL) | Tabel relasional untuk aduan, user, kategori, log |
| Auth | Supabase Auth | Role-based (Masyarakat, Petugas, Pimpinan, Admin) |
| Storage | Supabase Storage | Upload foto aduan & foto bukti penanganan |
| Realtime | Supabase Realtime | Notifikasi status aduan |
| Hosting | Vercel (frontend) + Supabase Cloud (backend) | Deployment |

## 8. Rancangan Model Data (High-Level)

Tabel utama yang diperlukan di Supabase:

- **users** — profil pengguna, role (pengadu/petugas/pimpinan/admin), terhubung ke `auth.users`
- **categories** — daftar kategori aduan (jalan, PJU, sampah, dll)
- **complaints** — aduan: nomor tiket, kategori, judul, deskripsi, lokasi, foto, status, id pengadu, id pelaksana
- **complaint_logs** — riwayat perubahan status/tindak lanjut (tanggal, uraian, hasil, foto, aktor)
- **notifications** — catatan notifikasi yang dikirim ke pengadu
- **regions** — data wilayah/RT-RW (untuk modul admin)

Status aduan (enum): `diajukan → diterima/ditolak → diproses → selesai`

## 9. Alur Proses Bisnis Usulan

1. Masyarakat membuka SIPMA → daftar/masuk → isi formulir aduan + foto → sistem terbitkan nomor tiket otomatis
2. Petugas menerima notifikasi aduan masuk → memeriksa kelengkapan → set status **Diterima**/**Ditolak**
3. Petugas menugaskan pelaksana → pelaksana catat tindak lanjut → status **Diproses** → setelah selesai status **Selesai** + foto bukti
4. Sistem kirim notifikasi realtime ke pengadu → pengadu tinjau hasil → beri konfirmasi & penilaian
5. Laporan rekapitulasi & statistik dibuat otomatis per periode/kategori untuk Pimpinan

## 10. Kriteria Sukses (Success Metrics)

- 100% aduan yang masuk mendapat nomor tiket otomatis
- Waktu rata-rata verifikasi aduan oleh petugas < 1×24 jam
- Notifikasi status terkirim ≤ 1 menit setelah perubahan (sesuai NFR-08)
- Rekap laporan bulanan dapat dihasilkan otomatis tanpa hitung manual
- Tidak ada kehilangan data aduan (0 insiden data loss)

## 11. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Warga awam kesulitan pakai sistem daring | UI sederhana + bisa dibantu petugas input manual di kantor |
| Beban server saat lonjakan aduan | Gunakan caching Next.js & scalable plan Supabase |
| Keamanan data pribadi pengadu | RLS ketat, enkripsi password bawaan Supabase Auth |

---

*Dokumen ini diturunkan dari Tahap 1: Analisis Masalah dan Kebutuhan SIPMA, dan menjadi acuan untuk tahap desain sistem (ERD, use case diagram, dan wireframe) dengan implementasi teknis menggunakan Next.js, React, TypeScript, Tailwind CSS, dan Supabase.*
