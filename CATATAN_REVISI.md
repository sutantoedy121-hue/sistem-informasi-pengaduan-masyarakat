# Catatan Revisi & Penambahan SIPMA (Lokal)

Tanggal: 2026-10-03  
Lingkungan: **Lokal** (Tidak di-push ke remote Git / GitHub)  
Status Build: **PASS (Compiled & Validated Successfully)**

---

## Daftar Revisi & Status Penyelesaian

### [x] 1. Tombol Search di Setiap Halaman (Admin, Petugas, Pimpinan, Masyarakat)
- **Masyarakat**: Search bar pada riwayat & daftar aduan (`ComplaintsList.tsx`) memfilter judul, nomor tiket, dan lokasi.
- **Petugas**: Search bar pada daftar aduan masuk (`StaffComplaintsList.tsx`) memfilter judul, tiket, lokasi, dan nama pelapor.
- **Pimpinan**: Search bar pada detail laporan aduan (`PimpinanLaporanDetail.tsx`).
- **Admin**: Search bar terpadu pada manajemen pengguna (`AdminUsers.tsx`), data master kategori & pelaksana (`AdminMaster.tsx`), dan audit log login (`AdminLoginLogs.tsx`).

---

### [x] 2. Halaman & Prioritas Khusus Laporan Tanpa Respon > 1 Minggu (SLA 7 Hari)
- **Petugas**:
  - Halaman khusus antrean prioritas: `/petugas/aduan/overdue`.
  - Tab navigasi `Perlu Atensi` pada header petugas.
  - Filter pill `Perlu Atensi (>7 Hari)` + badge merah darurat `>7 hari` pada setiap item yang lewat SLA.
- **Pimpinan**:
  - Halaman audit keterlambatan respon: `/pimpinan/aduan/overdue`.
  - Tab navigasi `Perlu Atensi` pada header pimpinan untuk memantau OPD yang lambat menangani laporan.

---

### [x] 3. Multi-Foto Upload (Pengajuan Aduan & Bukti Tindak Lanjut)
- **Komponen Upload**: `PhotoUpload.tsx` diperbarui mendukung `multiple` file picker (maksimal 5 foto per aksi, validasi gambar & ukuran).
- **Pengajuan Aduan**: `NewComplaintForm.tsx` dapat mengunggah banyak foto sekaligus saat melapor.
- **Bukti Petugas**: `StaffActions.tsx` mendukung upload multi-foto bukti pada progres dan penyelesaian laporan.
- **Penyimpanan**: Kompatibilitas mundur penuh via `parsePhotoPaths()` dan `getPhotoUrls()` (mendukung string path tunggal lama & JSON array multi-foto baru).
- **Tampilan Galeri**: Komponen `PhotoGallery.tsx` dengan layout grid thumbnail dan lightbox modal fullscreen di halaman detail aduan (Masyarakat, Petugas, Pimpinan) dan timeline penanganan (`ComplaintTimeline.tsx`).

---

### [x] 4. Standarisasi Pagination (> 10 Data Per Halaman)
- Komponen reusable `Pagination.tsx` batas 10 baris per halaman.
- Diterapkan secara konsisten pada:
  - Masyarakat: Daftar Aduan Saya (`ComplaintsList.tsx`)
  - Petugas: Daftar Semua Aduan (`StaffComplaintsList.tsx`)
  - Pimpinan: Detail Aduan Laporan Kinerja (`PimpinanLaporanDetail.tsx`)
  - Admin: Kelola Akun Pengguna (`AdminUsers.tsx`), Master Kategori & Pelaksana (`AdminMaster.tsx`), Riwayat Login (`AdminLoginLogs.tsx`).

---

### [x] 5. Showcase Foto Bukti Pelaporan di Landing Page + Pengaturan Admin
- **Landing Page**: Komponen `ShowcaseGallery.tsx` dengan animasi berjalan horizontal (running marquee CSS `@keyframes marquee`) menampilkan komparasi bukti penanganan berstatus selesai.
- **Admin**: Toggle switch aktif/nonaktif showcase di menu Pengaturan Situs (`AdminSettings.tsx` & `saveSiteSettingsAction`).

---

## Verifikasi Akhir
- `next build`: **Berhasil 100% tanpa error TypeScript / Linting**.
- Semua file disimpan di repositori lokal tanpa interaksi `git push`.
