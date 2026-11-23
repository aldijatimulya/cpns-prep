# CPNS Prep — MVP v1.1

Alat bantu belajar pribadi untuk SKD CPNS. Bukan aplikasi resmi pemerintah.

## Menjalankan
```bash
npm install
npm run dev        # pengembangan
npm run build      # produksi (folder dist)
```

## Yang sudah ada (v1.1)
- Dashboard: statistik, prioritas belajar, status per topik (Not Started / Learning / Needs Improvement / Mastered)
- Materi: 26 topik dari `src/data/curriculum/curriculum.json`, indikator, catatan pribadi
- Bank Soal: filter, tanda soal, pembahasan ringkas dan rinci
- Latihan: berwaktu (target detik per soal dari exam-config), navigasi soal, hasil dan pembahasan
- Simulasi CAT 110 soal (30 TWK / 35 TIU / 45 TKP, 100 menit, ragu-ragu, navigasi bebas, auto-selesai saat waktu habis; komposisi diboboti prioritas topik, set diperkecil dan ambang diskalakan bila bank kurang atau memakai filter terverifikasi)
- Rencana belajar: tanggal ujian + hitung mundur, target harian, aktivitas 7 hari, streak, daftar materi SKB buatan sendiri (isi SKB belum resmi, jadi kosong)
- Mode ulasan di Latihan: hanya soal yang terakhir salah, ragu-ragu, atau di-bookmark
- Impor cadangan JSON (menggabungkan tanpa menimpa) untuk pindah perangkat; PWA: bisa dipasang dan tetap terbuka saat offline; halaman dimuat per rute
- Tutor AI (opsional): tombol "Tanya Tutor AI" di pembahasan Latihan, Simulasi, dan Bank Soal; memakai kunci API Anthropic milik sendiri (Pengaturan), disimpan hanya di browser dan tidak ikut cadangan
- Heatmap kelemahan di Dashboard (topik × 8 sesi terakhir, pola garis untuk <60%) dan riwayat simulasi
- 193 soal draft (termasuk 32 soal figural SVG) (TWK, TIU numerik/verbal, TKP) dengan penanda "sudah saya verifikasi" dan opsi latihan hanya soal terverifikasi
- Label perkiraan prioritas per topik (bukan data resmi)
- Data tersimpan di localStorage, bisa diunduh sebagai JSON (Pengaturan)

## Menambah soal
Bank saat ini: `seed.json` (16 soal) + `bank-v1.json` (177 soal). Tambahkan file baru lalu impor dan gabungkan di `src/data/index.js`. Metodologi: `docs/02-question-bank-methodology.md`.
- TWK/TIU: isi `answer` dengan key opsi benar.
- TKP: `answer: null`, setiap opsi punya `score` 1–5 (bobot ilustrasi, bukan resmi).
- Semua soal baru: `status: "draft"`, `verified: false` sampai Anda periksa.
- Jangan menyalin soal asli CAT BKN.

## Konfigurasi ujian
`src/data/exam-config/skd-ref-2024.json` berstatus referensi 2024. Saat aturan 2026 resmi keluar, buat file baru dan arahkan impor di `src/data/index.js`.

## Deploy GitHub Pages
Push ke `main`; workflow `.github/workflows/deploy.yml` membangun dan mempublikasikan. Di Settings → Pages pilih Source: GitHub Actions. Router memakai hash (`#/`) sehingga tidak perlu pengaturan base path.

## Catatan keamanan
SVG soal dirender dengan `dangerouslySetInnerHTML`; hanya isi file soal milik sendiri yang boleh memuat SVG.

## Belum ada
Supabase (skema siap di `docs/03-supabase-schema.sql`, belum terhubung; perlu proyek Anda), bank soal SKB (menunggu isi SKB resmi). Perangkat lain: ekspor JSON di Pengaturan.
