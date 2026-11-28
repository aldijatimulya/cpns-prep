// Modul SKB buatan pengguna: kisi-kisi per jabatan, bank soal sendiri, dan format simulasi sesuai Kepmenpan-RB 674/2026.
// Isi SKB TIDAK disediakan aplikasi: materinya disusun instansi pembina JF / instansi teknis (Lampiran I huruf G.2).
import { examConfig } from '../data'

export const MAX_KISI = 40
export const MAX_Q_PER_MODULE = 400
export const MAX_MODULES = 20

export const slug = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
/** Kunci modul = nama jabatan (materi SKB disusun per jabatan, bukan per instansi). */
export const moduleKey = (jabatan) => slug(jabatan) || 'tanpa-nama'

/** Kuota peserta SKB: paling banyak 3 kali kebutuhan jabatan (Lampiran I huruf F.6.e). */
export const skbQuota = (kebutuhan) => (kebutuhan > 0 ? kebutuhan * 3 : null)

/** Format SKB resmi: 80 soal bila dominan hitungan, selain itu 100; 90 menit (120 untuk netra pada formasi disabilitas). */
export function skbFormat({ dominanHitung = false, netra = false } = {}) {
  const s = examConfig.skb
  return {
    questions: dominanHitung ? s.questions_calculation_dominant : s.questions_other,
    minutes: netra ? s.duration_minutes_netra : s.duration_minutes,
    correct: s.scoring.correct,
  }
}

const str = (v, n) => String(v ?? '').trim().slice(0, n)

/** Validasi satu soal mentah; mengembalikan soal baku atau null. Hanya teks (tanpa SVG/HTML). */
export function normalizeSkbQuestion(raw, kisiCount, source = 'user') {
  if (!raw || typeof raw !== 'object') return null
  const stem = str(raw.stem ?? raw.soal ?? raw.pertanyaan, 1200)
  let opts = raw.options ?? raw.opsi
  if (opts && !Array.isArray(opts) && typeof opts === 'object') opts = Object.entries(opts).map(([key, text]) => ({ key, text }))
  if (!stem || !Array.isArray(opts)) return null
  const options = opts.slice(0, 5).map((o, i) => ({ key: 'ABCDE'[i], text: str(typeof o === 'string' ? o : o?.text, 400) })).filter((o) => o.text)
  if (options.length < 4) return null
  const answer = str(raw.answer ?? raw.jawaban, 1).toUpperCase()
  if (!options.some((o) => o.key === answer)) return null
  const k = Number.isInteger(raw.kisi) && raw.kisi >= 0 && raw.kisi < kisiCount ? raw.kisi : null
  const id = `skbq-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
  const exp = raw.explanation
  return {
    id, kisi: k, stem, options, answer,
    explanation: str(typeof exp === 'object' ? exp?.detailed ?? exp?.quick : exp ?? raw.pembahasan, 1500),
    status: 'draft', source, verified: false,
  }
}

/** Baca berkas JSON soal SKB: array soal atau objek {soal|questions:[...]}. */
export function parseSkbFile(text, kisiCount) {
  let data
  try { data = JSON.parse(text) } catch { throw new Error('File bukan JSON yang valid.') }
  const rows = Array.isArray(data) ? data : data?.questions ?? data?.soal
  if (!Array.isArray(rows)) throw new Error('JSON harus berupa daftar soal, atau objek dengan kunci "questions".')
  const items = rows.map((r) => normalizeSkbQuestion(r, kisiCount, 'user')).filter(Boolean)
  return { items, skipped: rows.length - items.length }
}

export const SKB_TEMPLATE = JSON.stringify({
  questions: [
    { kisi: 0, stem: 'CONTOH: tulis pertanyaan di sini.', options: { A: 'opsi A', B: 'opsi B', C: 'opsi C', D: 'opsi D', E: 'opsi E' }, answer: 'C', explanation: 'Alasan jawaban benar.' },
  ],
}, null, 2)

/** Ambil array JSON dari balasan AI (boleh dibungkus pagar kode atau teks pembuka). */
export function parseAiQuestions(text, kisiCount) {
  const t = String(text ?? '')
  const a = t.indexOf('[')
  const b = t.lastIndexOf(']')
  if (a < 0 || b <= a) throw new Error('Balasan AI bukan daftar soal. Coba lagi dengan jumlah soal lebih sedikit.')
  let rows
  try { rows = JSON.parse(t.slice(a, b + 1)) } catch { throw new Error('Format balasan AI rusak (JSON tidak utuh). Coba lagi dengan jumlah soal lebih sedikit.') }
  const items = rows.map((r) => normalizeSkbQuestion(r, kisiCount, 'ai')).filter(Boolean)
  if (!items.length) throw new Error('Tidak ada soal yang valid dari balasan AI.')
  return { items, skipped: rows.length - items.length }
}

export const SKB_GEN_SYSTEM = `Anda penyusun soal latihan untuk Seleksi Kompetensi Bidang (SKB) CPNS Indonesia.
Keluaran WAJIB hanya berupa array JSON valid, tanpa teks lain dan tanpa pagar kode. Bentuk tiap elemen:
{"kisi": <nomor indeks topik mulai 0>, "stem": "...", "options": {"A": "...", "B": "...", "C": "...", "D": "...", "E": "..."}, "answer": "A".."E", "explanation": "..."}
Aturan:
- Bahasa Indonesia. Soal pilihan ganda lima opsi, satu jawaban benar yang tegas.
- Hanya gunakan topik pada daftar kisi-kisi yang diberikan pengguna. Jangan menambah topik lain.
- Jangan mengarang pasal, nomor peraturan, tahun, atau angka resmi. Jika tidak yakin suatu fakta, buat soal konsep/penerapan yang tidak bergantung pada fakta yang diragukan.
- Jangan menyalin soal ujian asli. Pembahasan singkat dan benar.
- Rumus ditulis LaTeX di antara $...$. Jangan memakai $ untuk mata uang (tulis Rp).`

export function skbGenPrompt({ jabatan, kisi, indices, n }) {
  const list = indices.map((i) => `${i}. ${kisi[i]}`).join('\n')
  return `Jabatan: ${jabatan}\nTopik kisi-kisi (gunakan nomor ini pada field "kisi"):\n${list}\n\nBuat ${n} soal latihan, sebarkan merata pada topik di atas.`
}

const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

/** Susun set simulasi: sebanyak yang ada (maks sesuai format); durasi diskalakan bila set lebih kecil. */
export function composeSkb(questions, fmt) {
  const picked = shuffle(questions).slice(0, fmt.questions)
  const full = picked.length === fmt.questions
  return { questions: picked, full, durationSec: Math.round((fmt.minutes * 60 * picked.length) / fmt.questions) }
}
