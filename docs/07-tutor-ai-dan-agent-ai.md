# Tutor AI dan Agent AI (v3.2)

## Cara kerja
- Tanpa AI: Agent AI tetap menghitung kecocokan jurusan, persaingan, kesiapan SKD, dan strategi (aturan di perangkat, `src/utils/agent.js`).
- Dengan AI: Tutor menjawab pertanyaan bebas berdasarkan materi topik, dan Agent menulis analisis naratif dari hasil hitungan itu.
- Kunci API milik pengguna, disimpan hanya di browser (tidak ikut sinkronisasi/cadangan). Tidak ada server tambahan dan tidak ada biaya untuk pemilik web.

## Mengaktifkan AI gratis (Google Gemini)
1. Buka Google AI Studio (aistudio.google.com), masuk dengan akun Google, buat API key.
2. Di aplikasi: Pengaturan > Tutor AI dan Agent AI > Penyedia "Google Gemini", tempel kunci, Simpan.
3. Jika muncul "model tidak ditemukan", ganti nama model dengan yang terbaru di dokumentasi Gemini.
Catatan: tier gratis punya batas per menit/hari, dan penyedia dapat memakai data tier gratis untuk perbaikan layanan. Jangan kirim data pribadi.

## Penyedia lain
- DeepSeek, OpenAI, Groq, OpenRouter: pilih "Kompatibel OpenAI", pilih layanan, isi kunci. Umumnya berbayar atau berkuota; belum diuji langsung, dan sebagian penyedia dapat memblokir panggilan dari browser.
- ChatGPT versi web gratis tidak punya akses API, jadi tidak bisa dipakai.

## Data lowongan
Agent tidak terhubung ke SSCASN. Unggah CSV/JSON di menu Agent AI (unduh templat di sana).
Kolom: instansi, jabatan (wajib), lokasi, jenjang (D3/S1/S2, boleh "S1/D4"), jurusan (pisahkan dengan titik koma; "Semua jurusan" = terbuka), kuota, pelamar (opsional), jenis_formasi, tanggal_tutup, tautan, catatan.
Maks 500 baris. Data tersimpan di akun dan ikut sinkron.

## Batasan yang perlu diketahui
- Kelinearan jurusan = pencocokan teks nama prodi. "Ilmu Komputer" tidak otomatis dianggap sama dengan "Teknik Informatika". Tulis semua prodi yang dibolehkan pada pengumuman di kolom jurusan.
- Nilai gabungan (jurusan 45%, persaingan 30%, kesiapan 25%) dan ambang skor adalah aturan internal/referensi pola 2024, bukan peluang kelulusan resmi.
- Persaingan dihitung dari pelamar/kuota; bila kolom pelamar kosong, dianggap netral.
