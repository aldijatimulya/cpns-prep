# Panduan: Aktifkan Akun Email (Supabase) dan Update/Push ke GitHub

Berlaku untuk CPNS Prep v3.0. Semua perintah dijalankan di Terminal/PowerShell dari dalam folder proyek (folder yang berisi `package.json`).

## Bagian A. Pasang versi baru ke folder proyek Anda

1. Ekstrak `cpns-prep-v3.0.zip` ke folder sementara.
2. Buka folder proyek lama Anda (yang punya folder `.git`). **Jangan hapus `.git`.**
3. Hapus isi lama KECUALI `.git` dan `node_modules`, lalu salin semua isi hasil ekstrak ke folder proyek.
   Cara mudah: salin-timpa semua file. File lama yang sudah tidak dipakai (mis. `src/components/ui/HeroArt.jsx`) boleh dihapus.
4. Pasang dependensi baru:
   ```bash
   npm install
   ```
5. Coba jalan lokal:
   ```bash
   npm run dev
   ```
   Buka alamat yang tampil (biasanya http://localhost:5173). Tanpa langkah Bagian B, halaman masuk menampilkan peringatan dan hanya "Lanjut tanpa akun" yang bisa dipakai.

## Bagian B. Siapkan Supabase (gratis), sekali saja

1. Daftar di https://supabase.com lalu **New project** (catat password database, simpan baik-baik). Tunggu proyek siap.
2. **SQL Editor** > New query > salin seluruh isi `docs/04-supabase-setup.sql` > **Run**. Ini membuat tabel `attempts` dan `user_state` dengan aturan keamanan (Row Level Security) agar tiap akun hanya melihat datanya sendiri.
3. **Project Settings > API**: salin **Project URL** dan **anon public key**. Jangan pernah memakai `service_role` key.
4. **Authentication > URL Configuration**:
   - Site URL: alamat situs Anda, mis. `https://USERNAME.github.io/NAMA-REPO/`
   - Redirect URLs: tambahkan alamat yang sama, dan `http://localhost:5173/` untuk uji lokal.
   Tanpa ini, tautan konfirmasi email dan reset password tidak akan kembali ke aplikasi.
5. **Authentication > Providers > Email**: biarkan aktif. "Confirm email" aktif = pengguna harus klik tautan di email sebelum masuk (disarankan). Bila ingin uji cepat, boleh dimatikan sementara.
6. (Opsional) **Authentication > Sign In / Providers**: naikkan panjang minimal password menjadi 8.
7. Email bawaan Supabase dibatasi jumlah kirimnya per jam. Untuk banyak pengguna, atur SMTP sendiri di **Authentication > SMTP Settings**.

## Bagian C. Hubungkan ke aplikasi

**Uji lokal**
1. Di folder proyek: salin `.env.example` menjadi `.env`.
2. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` dengan nilai dari langkah B3.
3. Jalankan ulang `npm run dev`. Daftar dengan email, lalu cek tabel di **Table Editor** Supabase: data muncul setelah Anda berlatih.

`.env` tidak ikut ke GitHub (sudah ada di `.gitignore`).

**Untuk situs di GitHub Pages**
1. Buka repo di GitHub > **Settings > Secrets and variables > Actions > New repository secret**.
2. Buat dua secret: `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` (nilai sama).
3. Workflow `.github/workflows/deploy.yml` sudah membaca keduanya saat build.
4. Pastikan **Settings > Pages > Source = GitHub Actions**.

## Bagian D. Push update ke GitHub (rutin)

```bash
git status                      # lihat file yang berubah
git add .
git commit -m "v3.0: desain baru dan akun email"
git push origin main
```

Lalu buka tab **Actions** di repo: tunggu workflow "Deploy" hijau (1 sampai 2 menit). Situs terbarui otomatis.

Bila `git push` ditolak karena remote lebih baru:
```bash
git pull --rebase origin main
git push origin main
```

Bila ini repo baru yang belum terhubung:
```bash
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git branch -M main
git push -u origin main
```
GitHub meminta login: gunakan Personal Access Token (Settings > Developer settings > Tokens, centang `repo`) sebagai password, atau GitHub Desktop / `gh auth login`.

Disarankan membuat cabang agar `main` tetap aman:
```bash
git checkout -b fitur-baru
# ... ubah kode, lalu:
git add . && git commit -m "pesan" && git push -u origin fitur-baru
# buka Pull Request di GitHub, lalu merge ke main
```

## Bagian E. Setelah deploy

1. Buka situs, tekan **Ctrl+Shift+R** agar cache lama (PWA) hilang.
2. Daftar dengan email, konfirmasi lewat tautan di email, masuk, kerjakan satu latihan.
3. Buka situs dari perangkat/browser lain, masuk dengan email yang sama: riwayat harus muncul.
4. Data lama di browser (versi sebelumnya): setelah masuk, muncul tawaran "Gabungkan" ke akun. Atau impor cadangan JSON di Pengaturan.

## Masalah umum

| Gejala | Penyebab / solusi |
|---|---|
| Peringatan "Akun online belum diaktifkan" di situs | Secret belum diisi, atau deploy dilakukan sebelum secret dibuat. Isi secret lalu jalankan ulang workflow (Actions > Re-run). |
| Tautan email membuka halaman salah / error | Site URL dan Redirect URLs di Supabase belum sama dengan alamat situs (harus berakhir `/`). |
| "Gagal sinkron" | Tabel belum dibuat (ulang B2), atau offline. Tombol "Kirim ulang" muncul di kanan atas. |
| `npm run build` gagal setelah salin | Jalankan `npm install` lagi; hapus `node_modules` dan `package-lock.json` lalu `npm install` bila perlu. |
| Tampilan lama masih muncul | Ctrl+Shift+R, atau hapus data situs di browser. |
| Lupa password | Halaman masuk > "Lupa Password?". |

## Keamanan singkat
- `anon` key memang publik; yang melindungi data adalah Row Level Security dari file SQL. Jangan matikan RLS.
- Jangan commit `.env` atau `service_role` key.
- Kunci API Tutor AI disimpan hanya di browser, tidak ikut sinkron ke akun.
