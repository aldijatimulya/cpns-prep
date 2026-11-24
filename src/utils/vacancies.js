// Impor dan normalisasi data lowongan dari file JSON atau CSV buatan pengguna.
export const MAX_ROWS = 500

export const COLUMNS = ['instansi', 'jabatan', 'lokasi', 'jenjang', 'jurusan', 'kuota', 'pelamar', 'jenis_formasi', 'tanggal_tutup', 'tautan', 'catatan']

export const TEMPLATE_CSV = `${COLUMNS.join(',')}
"CONTOH Kementerian A","Analis Data","Jakarta","S1","Statistika; Matematika; Teknik Informatika",3,45,"Umum","2026-12-31","","Baris contoh, ganti dengan data pengumuman resmi"
"CONTOH Pemda B","Pranata Komputer Ahli Pertama","Palembang","S1/D4","Teknik Informatika; Sistem Informasi",2,,"Umum","","","Pelamar belum diketahui"
"CONTOH Badan C","Pengelola Lingkungan","Bandung","S1","Semua jurusan",5,,"Umum","","",""
`

/** Pecah teks CSV (mendukung tanda kutip, koma dan baris baru di dalam kutip, titik koma tidak dipakai sebagai pemisah kolom). */
export function parseCsv(text) {
  const rows = []
  let row = []
  let cur = ''
  let q = false
  const src = text.replace(/^﻿/, '')
  for (let i = 0; i < src.length; i += 1) {
    const c = src[i]
    if (q) {
      if (c === '"') { if (src[i + 1] === '"') { cur += '"'; i += 1 } else q = false } else cur += c
    } else if (c === '"') q = true
    else if (c === ',') { row.push(cur); cur = '' } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i += 1
      row.push(cur); cur = ''
      if (row.some((x) => x.trim() !== '')) rows.push(row)
      row = []
    } else cur += c
  }
  row.push(cur)
  if (row.some((x) => x.trim() !== '')) rows.push(row)
  return rows
}

const num = (v) => {
  if (v == null || v === '') return null
  const n = Number(String(v).replace(/[.\s]/g, '').replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : null
}
const list = (v) => (Array.isArray(v) ? v : String(v ?? '').split(/[;|\n]/)).map((x) => String(x).trim()).filter(Boolean)
const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i += 1) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36) }

/** Ubah satu objek mentah menjadi lowongan baku, atau null bila data minimal (instansi dan jabatan) tidak ada. */
export function normalizeVacancy(raw) {
  const g = (k) => raw[k] ?? raw[k.replace('_', ' ')] ?? ''
  const instansi = String(g('instansi')).trim().slice(0, 120)
  const jabatan = String(g('jabatan')).trim().slice(0, 160)
  if (!instansi || !jabatan) return null
  const v = {
    instansi, jabatan,
    lokasi: String(g('lokasi')).trim().slice(0, 100),
    jenjang: list(String(g('jenjang')).replace(/\//g, ';')).map((x) => x.toUpperCase().replace(/\s+/g, '')),
    jurusan: list(g('jurusan')).slice(0, 40),
    kuota: num(g('kuota')),
    pelamar: num(g('pelamar')),
    jenis: String(g('jenis_formasi') || g('jenis') || 'Umum').trim().slice(0, 60),
    tutup: String(g('tanggal_tutup') || g('tutup')).trim().slice(0, 20),
    tautan: /^https?:\/\//i.test(String(g('tautan')).trim()) ? String(g('tautan')).trim().slice(0, 300) : '',
    catatan: String(g('catatan')).trim().slice(0, 300),
  }
  v.id = `v-${hash([v.instansi, v.jabatan, v.lokasi, v.jenjang.join(), v.jenis].join('|').toLowerCase())}`
  return v
}

/** Baca teks file (JSON array atau CSV). Mengembalikan { items, skipped }. Melempar Error bila format salah. */
export function parseVacancyFile(text, filename = '') {
  let rawRows
  const t = text.trim()
  if (/\.json$/i.test(filename) || t.startsWith('[') || t.startsWith('{')) {
    let data
    try { data = JSON.parse(t) } catch { throw new Error('File JSON tidak valid.') }
    rawRows = Array.isArray(data) ? data : Array.isArray(data?.lowongan) ? data.lowongan : null
    if (!rawRows) throw new Error('JSON harus berupa daftar lowongan (array), atau objek dengan kunci "lowongan".')
  } else {
    const rows = parseCsv(t)
    if (rows.length < 2) throw new Error('CSV kosong atau tidak punya baris data.')
    const head = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'))
    if (!head.includes('instansi') || !head.includes('jabatan')) throw new Error('Baris pertama CSV harus berisi nama kolom, minimal "instansi" dan "jabatan". Unduh templat untuk contoh.')
    rawRows = rows.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])))
  }
  const items = []
  let skipped = 0
  const seen = new Set()
  for (const r of rawRows.slice(0, MAX_ROWS)) {
    const v = r && typeof r === 'object' ? normalizeVacancy(r) : null
    if (!v || seen.has(v.id)) { skipped += 1; continue }
    seen.add(v.id)
    items.push(v)
  }
  skipped += Math.max(0, rawRows.length - MAX_ROWS)
  return { items, skipped }
}
