# Pembaruan ke Kepmenpan-RB No. 674 Tahun 2026 (v3.5.0)

Sumber utama: Keputusan Menteri PANRB No. 674 Tahun 2026 (ditetapkan 20 November 2026), Lampiran I huruf F-G dan Lampiran II.
SK ini memuat aspek dan tujuan tiap subtes, bukan daftar pokok bahasan rinci. Indikator di `curriculum.json` tetap turunan belajar aplikasi.

## 1. Konfigurasi ujian (`exam-config/skd-2026.json`)
| Hal | 2024 (arsip) | 2026 (SK 674) |
|---|---|---|
| Soal / durasi SKD | 110 soal, 100 menit | sama; 130 menit untuk disabilitas sensorik netra (kebutuhan khusus disabilitas) |
| TWK / TIU / TKP | 30 / 35 / 45 | sama (skor maks 150 / 175 / 225 = 550) |
| Ambang umum | 65 / 80 / 166 | sama |
| Ambang khusus | tidak dimodelkan | cum laude & diaspora: total >= 311 dan TIU >= 85; disabilitas & Papua: total >= 286 dan TIU >= 60; olahragawan: nilai terendah pelamar khusus |
| SKB | n/a | 90 menit; 80 soal (dominan hitung) atau 100 soal; 120 menit untuk netra; benar 5, salah/kosong 0; peserta SKB maks 3x kebutuhan |
| Nilai SKD 2024 | n/a | boleh dipakai bila NIK dan jenjang sama, lulus ambang 2026 dan administrasi; tidak ikut SKD 2026 lagi |
| Tambahan SKB | n/a | KDKMP/KNMP dengan TPK >= 120: +10% nilai maks SKB (tidak melebihi maks) |

Tidak ada di dokumen ini (jangan dianggap pasti): bobot SKD:SKB, rumus nilai akhir, urutan penentu bila nilai sama. Semuanya diatur Permenpan-RB 18/2026.

## 2. Perubahan kisi-kisi (aspek tiap subtes)
**TWK**: Nasionalisme, Integritas, Bela negara, Empat konsensus kebangsaan (Pancasila, UUD 1945, NKRI, Bhinneka Tunggal Ika), Bahasa Indonesia.
- Topik "Sistem pemerintahan dan tata negara" dilebur ke UUD 1945 (indikator 4 dan 5).
- Bahasa Indonesia kini mencakup memahami, mengevaluasi, dan merefleksi informasi, jadi soal pemahaman bacaan (dulu TIU) dipindah ke TWK-BHS indikator 4.

**TIU**: Verbal (silogisme, penalaran induktif, analitis), Numerik (berhitung, deret angka, perbandingan kuantitatif, soal cerita), Figural (serial, analogi, penalaran matriks).
- Baru: Penalaran induktif (12 soal), Penalaran matriks (10 soal, SVG).
- Tidak ada lagi di aspek TIU: analogi verbal, ketidaksamaan gambar. 18 soalnya diarsipkan di `questions/arsip-2024.json` (tidak diimpor).
- Analisis tabel dilebur ke Soal cerita indikator 6 (tujuan 2026: analisis kuantitatif dari informasi yang diberikan).

**TKP**: enam aspek tetap (pelayanan publik, jejaring kerja, sosial budaya, adaptasi TIK, profesionalisme, anti radikalisme). Redaksi indikator disesuaikan (TIK: pemanfaatan bijak dan etis).

## 3. Kode yang berubah
- `src/data/index.js`: memuat `skd-2026.json`, soal `bank-v3-*`, mengekspor `needTypes`.
- `src/utils/cat.js`: `needThresholds`, durasi 130 menit.
- `src/pages/Cat.jsx`: pilih jenis kebutuhan (umum / cum laude-diaspora / disabilitas-Papua), opsi netra, penilaian kumulatif + TIU.
- Teks "referensi 2024" diganti di Dashboard, Pusat Belajar, Bantuan, Heatmap, Agent AI, banner status.
- `scripts/check-data.mjs`: validasi konfigurasi dan kecocokan kategori soal-topik.
- `public/sw.js`: cache v2 agar pengguna lama mendapat versi baru.

## 4. Riwayat lama
ID soal tidak diubah, jadi riwayat, penanda, dan verifikasi tetap valid. Soal yang dipindah punya field `migrated_from`.
Riwayat atas topik yang sudah dihapus tetap tersimpan tetapi tidak tampil per topik.

## 5. Yang masih perlu Anda lakukan
- Semua soal draft; verifikasi sebelum dijadikan pegangan.
- Bank soal baru masih tipis di topik baru (induktif 12, matriks 10). Tambah lewat panduan `06-panduan-menambah-materi-dan-soal.md`.
- Isi SKB: ikuti pengumuman jabatan yang Anda pilih (materi disusun instansi pembina JF).
