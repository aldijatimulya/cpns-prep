# Formasi SSCASN, Simulasi SKB, dan Agent AI (v3.6.0)

## Status sambungan ke SSCASN
Halaman daftar formasi SSCASN dimuat lewat JavaScript dan tidak ada API resmi yang terdokumentasi, jadi aplikasi **belum tersambung otomatis**.
Formasi masuk lewat tiga jalur di Agent AI:
1. Unggah berkas CSV/JSON.
2. "Muat dari alamat": URL JSON/CSV (mis. berkas di repo GitHub Anda, alamat raw). Situs yang memblokir akses browser (CORS) akan gagal dengan pesan jelas.
3. (Menunggu) proxy Supabase Edge Function yang mengambil data dari endpoint SSCASN. Butuh alamat permintaan dan contoh respons dari tab Network (lihat percakapan).

## Kolom yang dikenali (huruf besar/kecil dan spasi diabaikan)
| Baku | Nama lain yang diterima |
|---|---|
| instansi | nama instansi, instansi pengusul, kementerian/lembaga |
| jabatan | nama jabatan |
| lokasi | lokasi formasi, lokasi penempatan, penempatan |
| jurusan | nama pendidikan, pendidikan, program studi, prodi, kualifikasi pendidikan |
| jenjang | jenjang pendidikan (bila kosong, diambil dari "S-1 ...", "D-IV ..." pada nama pendidikan) |
| kuota | kebutuhan, jumlah kebutuhan, jumlah formasi ("196 kebutuhan" dibaca 196) |
| jenis_formasi | jenis formasi, jenis kebutuhan (umum, cum laude, diaspora, disabilitas, Papua, olahragawan) |
| tipe | jenis pengadaan (baris PPPK dilewati) |

JSON bersarang dikenali bila daftarnya ada di bawah kunci data, formasi, lowongan, items, results, list, rows, atau content. Maksimal 2000 baris.

## Agent AI
- Filter jenis formasi dan pencarian jabatan/instansi/lokasi.
- Setiap formasi menampilkan kuota, batas peserta SKB (3 x kebutuhan), dan kesiapan SKD terhadap ambang jenis formasinya (umum per subtes; cum laude/diaspora 311 + TIU 85; disabilitas/Papua 286 + TIU 60).
- Tombol "Jadikan formasi target" menghubungkan ke Simulasi SKB. Ringkasan untuk AI ikut memuat jenis formasi dan ambangnya.

## Simulasi SKB (menu baru)
- Format resmi dari SK 674/2026: 100 soal, atau 80 soal bila materi dominan perhitungan; 90 menit (120 menit netra pada formasi disabilitas); benar 5, salah/kosong 0.
- Modul per jabatan: kisi-kisi (isi dari pengumuman instansi), bank soal sendiri (unggah JSON, atau draf AI), tanda terverifikasi, simulasi, dan riwayat.
- Bila soal kurang dari format resmi, set diperkecil dan waktu diskalakan.
- **Isi SKB tidak disediakan aplikasi.** Materi disusun instansi pembina JF / instansi teknis. Soal AI selalu berstatus draf.
- Data modul ikut tersinkron lewat `user_state` (tidak ada perubahan skema Supabase).

## Format berkas soal SKB (JSON)
Unduh templat dari halaman Simulasi SKB. Tiap soal: `stem`, `options` (A-E), `answer`, `explanation` (opsional), `kisi` (nomor topik mulai 0, opsional). Hanya teks; LaTeX `$...$` didukung. SVG/HTML diabaikan.

## Belum dikerjakan
- Sinkronisasi otomatis dari SSCASN (menunggu endpoint).
- Perpustakaan materi SKB per jabatan yang sudah terisi: memerlukan kisi-kisi resmi dari instansi pembina.
