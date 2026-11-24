# Panduan Menambah Materi dan Soal (terikat kisi-kisi)

Kisi-kisi = `src/data/curriculum/curriculum.json`. Tiap topik punya daftar `indicators` (urutan menentukan nomor, dimulai 0).
Materi dan soal terhubung ke kisi-kisi lewat nomor indikator itu.

## 1. Materi
File: `src/data/materi/twk.json`, `tiu.json`, `tkp.json`. Kunci = id topik.

```json
"TWK-INT": {
  "ringkasan": "…",
  "indikator": [
    { "poin": ["…", "…"], "contoh": { "soal": "…", "jawab": "…" } }
  ],
  "fakta": [["Batas lapor gratifikasi", "30 hari kerja"]],
  "jebakan": ["…"],
  "sumber": ["UU No. 20 Tahun 2023"]
}
```
- Jumlah dan urutan item `indikator` harus sama dengan `indicators` di kisi-kisi.
- `contoh`, `fakta`, `jebakan`, `sumber` boleh kosong atau dihapus.

## 2. Soal
File: `src/data/questions/*.json`. Tambahkan `"indicator": N` setelah `topic_id` (N = nomor indikator, mulai 0).
Soal baru sebaiknya diberi `"status": "draft"`, `"verified": false`.

## 3. Periksa konsistensi
```
npm run check:data
```
GALAT (merah) harus nol: id ganda, indikator tidak valid, kunci jawaban tidak ada, materi tidak cocok kisi-kisi.
PERINGATAN boleh: soal perbandingan kuantitatif memang 4 opsi; indikator dengan kurang dari 2 soal perlu ditambah soal.

## 4. Mengubah kisi-kisi
Jika Anda menambah/menghapus/mengurutkan ulang indikator di `curriculum.json`, perbarui juga `indikator` di materi
dan `indicator` pada soal terkait, lalu jalankan `npm run check:data`.

## 5. Verifikasi
Materi dan soal bawaan adalah draft. Cocokkan pasal, tanggal, dan angka dengan sumber resmi (lihat bagian "Rujukan" tiap topik)
sebelum dijadikan pegangan. Gunakan tombol verifikasi di Bank Soal untuk menandai soal yang sudah Anda periksa.
