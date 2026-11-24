# CPNS Prep — MVP v3.0

Alat bantu belajar pribadi untuk SKD CPNS. Bukan aplikasi resmi pemerintah.

## Menjalankan
```bash
npm install
cp .env.example .env   # isi URL dan anon key Supabase (opsional; tanpa ini hanya mode tamu)
npm run dev        # pengembangan
npm run build      # produksi (folder dist)
```

## Baru di v3.0
- Desain baru seragam di semua menu (sidebar teal, banner hero, kartu progres, tombol emas) mengikuti referensi
- Akun email (daftar, masuk, lupa password, ganti password) lewat Supabase; riwayat, catatan, penanda, dan rencana tersimpan per akun dan tersinkron antar perangkat
- Mode tamu tetap ada (data di browser)
- Halaman Bantuan, notifikasi pengingat, pintasan Ctrl+K untuk pencarian
- Setup akun online: `docs/05-panduan-update-dan-push-github.md` dan `docs/04-supabase-setup.sql`

## Yang sudah ada (v2.0)
- Dashboard: statistik, prioritas belajar, status per topik (Not Started / Learning / Needs Improvement / Mastered)
- Materi: 26 topik dari `src/data/curriculum/curriculum.json`, indikator, catatan pribadi
- Bank Soal: filter, tanda soal, pembahasan ringkas dan rinci
- Latihan: berwaktu (target detik per soal dari exam-config), navigasi soal, hasil dan pembahasan
- Simulasi CAT 110 soal (30 TWK / 35 TIU / 45 TKP, 100 menit, ragu-ragu, navigasi bebas, auto-selesai saat waktu habis; komposisi diboboti prioritas topik, set diperkecil dan ambang diskalakan bila bank kurang atau memakai filter terverifikasi)
- Rencana belajar: tanggal ujian + hitung mundur, target harian, aktivitas 7 hari, streak, daftar materi SKB buatan sendiri (isi SKB belum resmi, jadi kosong)
- Mode ulasan di Latihan: hanya soal yang terakhir salah, ragu-ragu, atau di-bookmark
- Impor cadangan JSON (menggabungkan tanpa menimpa) untuk pindah perangkat; PWA: bisa dipasang dan tetap terbuka saat offline; halaman dimuat per rute
- Desain v2: sidebar gelap, top bar dengan pencarian dan profil, hero dan grafik di Dashboard, kartu kategori di Materi, halaman masuk (profil lokal berbasis nama, tanpa akun online), tampilan ponsel dengan menu geser
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
Isi secrets `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` di GitHub (lihat panduan). Push ke `main`; workflow `.github/workflows/deploy.yml` membangun dan mempublikasikan. Di Settings → Pages pilih Source: GitHub Actions. Router memakai hash (`#/`) sehingga tidak perlu pengaturan base path.

## Catatan keamanan
SVG soal dirender dengan `dangerouslySetInnerHTML`; hanya isi file soal milik sendiri yang boleh memuat SVG.

## Belum ada
Bank soal SKB (menunggu isi SKB resmi). Login Google/Microsoft (bisa ditambah lewat Supabase Auth).

## v3.1: Materi terikat kisi-kisi
- Materi tertulis untuk 27 topik (`src/data/materi/`), disusun per indikator kisi-kisi.
- Tiap soal punya `indicator`; 234 soal, setiap indikator minimal 2 soal.
- Halaman topik menampilkan materi, contoh, jebakan, jumlah soal dan akurasi per indikator, dengan tombol "Latih indikator ini".
- Latihan dan Bank Soal bisa difilter per indikator; pembahasan soal menaut balik ke materi indikatornya.
- `npm run check:data` memeriksa konsistensi. Panduan: `docs/06-panduan-menambah-materi-dan-soal.md`.
- Semua materi dan soal masih draft; verifikasi dengan sumber resmi.

## v3.2: Tutor AI dan Agent AI
- `/tutor`: tanya jawab berbasis materi topik/indikator, identifikasi titik lemah.
- `/agent`: profil jurusan, unggah lowongan (CSV/JSON), kesiapan SKD, rekomendasi lowongan, strategi, analisis AI opsional.
- Penyedia AI: Gemini (tier gratis), kompatibel OpenAI (DeepSeek dll), Claude. Kunci milik pengguna, tersimpan di browser.
- Panduan: `docs/07-tutor-ai-dan-agent-ai.md`.
