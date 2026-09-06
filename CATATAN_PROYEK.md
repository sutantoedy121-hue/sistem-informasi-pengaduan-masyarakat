# 📋 SIPMA — Catatan Proyek

**Sistem Informasi Pengaduan Masyarakat · Kabupaten Bojonegoro**

---

## 🎯 Ringkasan

Platform pengaduan masyarakat digital yang menjembatani **3+1 pihak**:
**Masyarakat** (pengadu), **Petugas** (penindak lanjut), **Pimpinan** (pemantau kinerja), dan **Admin** (pengelola sistem).

Dibangun agar proses aduan yang tadinya manual — datang langsung / telepon / catatan buku — menjadi **daring, transparan, dan teraudit** lewat nomor tiket otomatis.

---

## 🧰 Teknologi

| Komponen | Teknologi |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Backend & Database | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| Peta | Google Maps (iframe embed) |
| Grafik | Recharts |
| Export | SheetJS (XLSX), print (PDF) |

---

## 👥 Peran & Akses

| Peran | Route | Tugas Utama |
|---|---|---|
| Masyarakat | `/masyarakat` | Buat aduan, upload foto, lacak tiket, nilai |
| Petugas | `/petugas` | Terima/tolak, tugaskan, tindak lanjut, selesaikan |
| Pimpinan | `/pimpinan` | Statistik, grafik, laporan kinerja |
| Admin | `/admin` | Kelola akun, data master, pengaturan situs |

---

## ⚙️ Fitur Utama

### Masyarakat
- Aduan + upload foto + detail lokasi (koordinat & titik di peta)
- Nomor tiket otomatis: `SIPMA-YYYY-MM-NNNN`
- Lacak status real-time + timeline penanganan
- Rating saat aduan selesai
- Notifikasi real-time (bel + dropdown)

### Petugas
- Dashboard: antrean, statistik status
- Terima / tolak (wajib alasan) / tugaskan pelaksana
- Tindak lanjut + foto bukti penanganan
- Cetak / PDF + unduh Excel per aduan

### Pimpinan
- 6 tile statistik + 2 grafik (status & kategori) + performa pelaksana
- Laporan kinerja per periode → unduh Excel
- Arahan pimpinan ke petugas (catatan, tanpa ubah status)

### Admin
- Kelola akun: tambah, ubah role, aktif/nonaktif, reset sandi, hapus permanen
- Data master: kategori & pelaksana (CRUD + toggle)
- Riwayat login (email, IP, perangkat)
- Pengaturan situs: nama, tagline, kontak, logo

---

## 🔄 Alur Aduan

```
Diajukan → Diterima → Diproses → Selesai
                  ↘ Ditolak
```

---

## 🚀 Status Deployment

- **Production:** [si-pengaduan-masyarakat.vercel.app](https://si-pengaduan-masyarakat.vercel.app) (Vercel)
- **Database:** Supabase (RLS aktif, realtime aktif)
- **Auth:** Email + Google OAuth

### Akun Test
| Role | Email | Sandi |
|---|---|---|
| Masyarakat | `warga20@gmail.com` | `test123456` |
| Petugas | `petugas20@gmail.com` | `test123456` |
| Pimpinan | `pimpinan20@gmail.com` | `test123456` |
| Admin | `admin20@gmail.com` | `test123456` |

---

## 🗓️ Tahapan Pengembangan

| Tahap | Cakupan | Status |
|---|---|---|
| 0 | Scaffold + landing publik | ✅ Selesai |
| 1 | Supabase: schema, RLS, trigger tiket | ✅ Selesai |
| 2 | Auth + proteksi route | ✅ Selesai |
| 3 | Panel masyarakat | ✅ Selesai |
| 4 | Panel petugas | ✅ Selesai |
| 5 | Panel pimpinan | ✅ Selesai |
| 6 | Notifikasi real-time | ✅ Selesai |
| 7 | Panel admin | ✅ Selesai |

**7/7 tahap selesai** — masing-masing terverifikasi lewat pengujian E2E headless browser.