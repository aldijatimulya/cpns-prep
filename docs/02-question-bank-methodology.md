# Metodologi Bank Soal v1

Versi 1.0 · 12 November 2026

## Yang dijamin dan tidak dijamin
- Soal dibuat sendiri (asli), BUKAN salinan soal CAT BKN, bocoran, atau bimbel.
- Tidak ada sumber resmi yang menerbitkan frekuensi soal per subtopik. Label `likelihood` di kurikulum adalah perkiraan belajar dari (1) indikator resmi 2024 dan (2) laporan peserta 2024 yang belum terverifikasi.
- Semua soal berstatus `draft`. Tandai "sudah saya verifikasi" di Bank Soal setelah memeriksa kunci dan pembahasan.

## Sumber dasar
| Tier | Sumber | Dipakai untuk |
|---|---|---|
| 2 | Permenpan-RB 6/2024, Kepmenpan-RB 321/2024 (via pemberitaan, belum dibaca dari dokumen primer) | Kerangka SKD, indikator, ambang batas |
| 4 | Media nasional (detik, CNN, CNBC, dll.) | Indikator, jadwal, bobot |
| 5 | Laporan peserta SKD 2024 | Hanya untuk memberi label prioritas topik |

## Cara membuat soal
- **Numerik dan analitis (44 soal):** dibangkitkan kode. Kunci dihitung (bukan diketik), soal posisi/jadwal/logika diselesaikan dengan brute force, dan keunikan jawaban diperiksa.
- **Figural (32 soal):** gambar dimodelkan sebagai (bentuk, isi, posisi titik, jumlah tanda) dan dirender sebagai SVG. Aturan diterapkan oleh kode dan keunikan jawaban diperiksa: pada analogi, semua transformasi yang cocok dengan pasangan contoh harus menghasilkan gambar yang sama; pada ketidaksamaan, hanya satu gambar yang menyimpang pada atribut mana pun. Kunci dihitung ulang dari metadata (`meta`) pada audit terpisah. Catatan: soal figural asli bisa jauh lebih rumit (kubus, lipatan, bayangan cermin kompleks), jadi anggap set ini pemanasan.
- **TWK, silogisme, analogi, TKP (81 soal):** ditulis manual, lalu diaudit oleh agen terpisah. Fakta pasal dan tanggal tetap perlu Anda cek ke naskah resmi.
- Opsi diacak (bukan diurutkan) agar kunci tidak menumpuk di posisi tengah.
- Bobot opsi TKP adalah ilustrasi belajar; bobot resmi tidak dipublikasikan.

## Komposisi bank (173 soal)
| Kategori | Soal |
|---|---|
| TIU numerik (deret, berhitung, cerita, kuantitatif, tabel) | 38 (+3 seed) |
| TIU verbal (analogi, silogisme, analitis) | 23 (+3 seed) |
| TWK | 40 (+4 seed) |
| TKP | 25 (+3 seed) |
| TIU figural (serial 12, analogi 10, ketidaksamaan 10; SVG) | 32 |

## Alur verifikasi yang disarankan
1. Filter "Belum diverifikasi" di Bank Soal.
2. Buka opsi dan pembahasan; cek kunci. Untuk TWK, cek pasal/tanggal ke naskah resmi.
3. Centang "Saya sudah memeriksa".
4. Latih dengan opsi "Hanya soal yang sudah saya verifikasi" bila ingin pool yang bersih.

## Pembaruan saat kisi-kisi 2026 keluar
1. Buat `exam-config/skd-2026.json` baru.
2. Cocokkan indikator di `curriculum.json`; tambah/hapus topik dan perbarui `likelihood`.
3. Tandai ulang soal pada topik yang berubah.
