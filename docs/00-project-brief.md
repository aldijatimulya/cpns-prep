# CPNS Prep — Project Brief (Fase 1)

Versi 0.1 · 11 November 2026 · Pemilik: Aldi

## Tujuan
Alat belajar pribadi untuk (1) mengembalikan kebiasaan menjawab soal SKD, (2) mengukur kelemahan per kompetensi, (3) memperdalam materi yang lemah. Bukan aplikasi resmi, bukan bocoran kisi-kisi.

## Strategi: ship kecil dulu
Roadmap penuh 37–58 hari terlalu panjang jika pendaftaran dibuka akhir November. Urutan diubah agar versi pertama sudah berguna dalam hitungan hari.

| Tahap | Isi | Target |
|---|---|---|
| **MVP (v0.5)** | Kerangka React+Vite, Question Bank, mode latihan berwaktu, skor lokal (localStorage), 3 kategori | Bisa latihan TIU/TWK/TKP |
| **v1.0 Learning Foundation** | Dashboard, Learning Center, pembahasan Quick/Detailed, My Notes, bookmark | Belajar terarah |
| **v2.0 Examination & Analytics** | CAT Simulator 110 soal, riwayat, heatmap, rekomendasi | Kemampuan terukur |
| **v3.0 AI-Powered** | Supabase, AI Tutor, RAG | Personal |

Alasan: autentikasi, database, dan AI tidak diperlukan untuk satu pengguna di awal. Penyimpanan lokal cukup, dan skema tetap dirancang agar bisa dimigrasikan ke Supabase.

## Prinsip yang dipegang
- Config-driven: aturan ujian dari `src/data/exam-config/*.json`, tidak ditanam di kode.
- Setiap angka regulasi berstatus (referensi / terverifikasi) dan punya sumber.
- Pembahasan TKP berbasis prinsip, bukan klaim kunci resmi.
- Kunci API tidak pernah masuk frontend atau repo.

## Kriteria penerimaan Fase 1–2
- [x] Brief ini
- [x] `exam-config/skd-ref-2024.json` dengan status "belum terverifikasi 2026"
- [x] `curriculum/curriculum.json` v0.1: 3 kategori, 26 topik, tiap topik punya indikator dan prioritas
- [ ] Anda meninjau dan menyetujui kurikulum (hapus/tambah topik)
- [ ] Keputusan terbuka di bawah dijawab

## Keputusan terbuka
1. **Sumber soal.** Soal asli CAT BKN tidak boleh disalin. Soal dibuat sendiri/dibantu AI (wajib diverifikasi) atau dari materi yang lisensinya jelas. Cara ini menentukan kecepatan MVP.
2. **Jabatan target** (untuk SKB). Belum dipilih, jadi SKB ditunda.
3. **Tanggal ujian.** Menentukan seberapa agresif jadwal belajar.
4. **Pakai AI untuk menulis draf soal?** Jika ya, setiap soal berstatus `draft` sampai Anda verifikasi.
