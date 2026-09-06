# Google Login — Panduan Setup (Gratis)

Fitur "Masuk dengan Google" sudah ada di halaman **Masuk** dan **Daftar** (komponen
`GoogleSignInButton`, memakai Supabase Auth `signInWithOAuth`). Agar benar-benar
berfungsi, kamu harus mengaktifkan provider Google di Supabase **dan** membuat
kredensial OAuth di Google Cloud. Semua gratis (tanpa kartu kredit / biaya), cukup
punya akun Google biasa.

> ⚠️ **Penting:** langkah 1–4 cukup dilakukan SEKALI. Langkah 3–4 yang membuat
> tombol benar-benar bekerja. Tanpa langkah tersebut, tombol akan menampilkan
> error *"provider is not enabled"*.

---

## Ringkasan alur

```
[Tombol "Masuk dengan Google"]
   → supabase.auth.signInWithOAuth(provider: "google")
   → Supabase mengarahkan ke Google untuk login
   → Google memanggil balik ke app (redirect) di /auth/callback
   → sesi tersimpan, user diarahkan ke beranda
```

Konfigurasi yang harus cocok di **tiga tempat**: Google Cloud (Client ID/Secret),
Supabase (provider Google + redirect URL), dan origin situs (localhost saat
development, domain saat production).

---

## 1. Buat kredensial OAuth di Google Cloud Console

1. Buka https://console.cloud.google.com/ → login dengan akun Google kamu.
2. **Buat project baru** (kiri atas → *New Project*) → beri nama, mis. `SIPMA`.
3. Di dalam project: menu **APIs & Services → OAuth consent screen**.
   - (Tampilan console terbaru) cukup klik **Create** — tanpa perlu memilih apa pun;
     nilai *User Type* sudah "External" secara default. Opsi "Internal" hanya muncul
     untuk pengguna workspace/domain terdaftar, bukan akun Gmail biasa.
   - Isi *App name* (mis. `SIPMA Bojonegoro`), *User support email*, dan
     *Developer contact email*.
   - *Scopes* → biarkan default (boleh next).
   - *Test users* → **wajib** jika status *Testing*: tambahkan email kamu yang
     akan mencoba login (mis. `warga20@gmail.com`). Saat *Testing*, hanya user
     terdaftar yang bisa login Google. (Opsional: klik *Publish App* untuk semua
     user — untuk tahap pengembangan cukup mode Testing + daftarkan email sendiri.)
   - Save.
4. Menu **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
   - *Application type*: **Web application**.
   - *Authorized JavaScript origins*: tambahkan `http://localhost:3000`
     (tambahkan juga domain production nanti, mis. `https://sipma.bojonegoro.go.id`).
   - *Authorized redirect URIs*: tambahkan
     `https://<ref>-<projectid>.supabase.co/auth/v1/callback`
     > Cari nilai `<ref>` di **Supabase Dashboard → Settings → API → Project URL**
     > (mis. `https://wopmvvslvbinhhknqzvt.supabase.co`, jadi redirect URI-nya
     > `https://wopmvvslvbinhhknqzvt.supabase.co/auth/v1/callback`).
   - Create → **catat `Client ID` dan `Client Secret`** yang muncul (jangan dibagikan).

## 2. Aktifkan provider Google di Supabase Dashboard

1. Buka https://supabase.com/dashboard → pilih project SIPMA.
2. Menu **Authentication → Providers**.
3. Cari **Google** → toggle **Enable**.
4. Masukkan **Client ID** dan **Client Secret** dari langkah 1.4.
5. (Sidebar) **URL Configuration → Redirect URLs**: pastikan berisi
   `http://localhost:3000/auth/callback` (untuk development).
   > Ini URL yang akan Dipanggil browser setelah login Google berhasil, dan harus
   > **persis** origin + `/auth/callback`.
6. Save.

## 3. Set (jika belum) variabel URL di `.env.local`

`.env.local` di project kamu sudah berisi `NEXT_PUBLIC_SUPABASE_URL` dan
`NEXT_PUBLIC_SUPABASE_ANON_KEY` dari dashboard — pastikan nilai `URL` sama dengan
Project URL dashboard (langsung dipakai browser client).

## 4. Restart dev server

Ubah env/konfigurasi apa pun → hentikan lalu jalankan lagi dev server
(`npm run dev`).

---

## Cara tes

1. Buka `http://localhost:3000/login` (atau `/register`).
2. Klik **"Masuk dengan Google"**.
3. Pilih/verifikasi akun Google kamu → akan dialihkan balik ke `/auth/callback`
   lalu beranda dengan status **login**.

---

## Troubleshooting

| Gejala | Penyebab | Perbaiki |
|---|---|---|
| Error `provider is not enabled` | Google belum diaktifkan di Supabase / Client ID salah | Periksa langkah 2 |
| `redirect_uri_mismatch` | Authorized redirect URI tidak cocok | Pastikan URI di Google (1.4) **persis** `https://<ref>.supabase.co/auth/v1/callback` |
| `access_denied` / tidak bisa login | Email tidak terdaftar sebagai *Test user* | Tambahkan email di OAuth consent screen (1.3) |
| Langsung balik ke beranda tanpa login | Redirect URL Supabase (2.5) tidak cocok origin app | Tambahkan `http://localhost:3000/auth/callback` |
| Tombol tampil tapi klik tidak merespons | Dev server perlu restart | Restart `npm run dev` |

---

## Catatan biaya & data
- **Gratis 100%** — Google OAuth tidak berbayar; Supabase Auth (hingga kuota
  gratis project) mencakup OAuth/login.
- Saat login Google, profil dibuat otomatis oleh trigger `handle_new_user()`
  (role default `masyarakat`, `full_name` dari metadata Google). NIK tidak
  dikumpulkan lagi (sudah dihapus). Kamu bisa menambah data (no. telepon, dll.)
  lewat dashboard profil nanti.

## Keamanan
- Jangan pernah menaruh `Client Secret` Google atau `SUPABASE_SERVICE_ROLE_KEY`
  di kode frontend/`.env.local` yang terekspos. Client Secret hanya di Supabase
  Dashboard. `.env.local` jangan di-commit ke git.
