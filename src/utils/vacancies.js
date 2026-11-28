// Impor dan normalisasi data lowongan dari file JSON atau CSV buatan pengguna.
export const MAX_ROWS = 2000

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
  const m = String(v).match(/\d[\d.]*(?:,\d+)?/)
  if (!m) return null
  const n = Number(m[0].replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : null
}
const list = (v) => (Array.isArray(v) ? v : String(v ?? '').split(/[;|\n]/)).map((x) => String(x).trim()).filter(Boolean)
const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i += 1) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36) }

// Nama kolom/kunci yang dikenali (setelah huruf kecil dan spasi/tanda baca menjadi garis bawah).
// Mencakup nama kolom templat aplikasi dan nama yang lazim di daftar formasi SSCASN.
export const ALIASES = {
  instansi: ['instansi', 'nama_instansi', 'instansi_pengusul', 'kementerian_lembaga', 'satker', 'unit_kerja'],
  jabatan: ['jabatan', 'nama_jabatan', 'formasi_jabatan'],
  lokasi: ['lokasi', 'lokasi_formasi', 'lokasi_penempatan', 'penempatan', 'unit_penempatan', 'kab_kota'],
  jenjang: ['jenjang', 'jenjang_pendidikan', 'tingkat_pendidikan'],
  jurusan: ['jurusan', 'nama_pendidikan', 'pendidikan', 'program_studi', 'prodi', 'kualifikasi_pendidikan'],
  kuota: ['kuota', 'kebutuhan', 'jumlah_kebutuhan', 'jumlah_formasi', 'formasi', 'jumlah'],
  pelamar: ['pelamar', 'jumlah_pelamar', 'peminat'],
  jenis: ['jenis_formasi', 'jenis', 'jenis_kebutuhan'],
  tipe: ['tipe', 'jenis_pengadaan', 'pengadaan', 'jenis_asn', 'status_pengadaan', 'kategori_asn'],
  tutup: ['tanggal_tutup', 'tutup', 'batas_pendaftaran', 'penutupan'],
  tautan: ['tautan', 'url', 'link', 'tautan_pengumuman'],
  catatan: ['catatan', 'keterangan', 'persyaratan'],
}
const slug = (k) => String(k).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')

/** Peta nama kolom baku -> kunci asli pada baris mentah (atau undefined bila tidak ada). */
export function columnMap(keys) {
  const slugs = new Map(keys.map((k) => [slug(k), k]))
  const out = {}
  for (const [std, al] of Object.entries(ALIASES)) out[std] = al.map((a) => slugs.get(a)).find((x) => x !== undefined)
  return out
}

const ROMAN = { I: '1', II: '2', III: '3', IV: '4' }
/** Ambil jenjang (S1, D4, ...) dari teks bebas seperti "S-1 TEKNIK INFORMATIKA" atau "D-IV Akuntansi". */
export function extractDegrees(text) {
  const out = new Set()
  for (const m of String(text ?? '').toUpperCase().matchAll(/\b(SMA|SMK|MA|S\s*-?\s*[123]|D\s*-?\s*(?:IV|III|II|I|[1-4]))\b/g)) {
    const t = m[1].replace(/[\s-]/g, '')
    if (/^(SMA|SMK|MA)$/.test(t)) out.add(t === 'MA' ? 'SMA' : t)
    else if (t[0] === 'S') out.add(t)
    else out.add(`D${ROMAN[t.slice(1)] ?? t.slice(1)}`)
  }
  return [...out]
}
/** Buang awalan jenjang dari nama pendidikan: "S-1 Teknik Informatika" -> "Teknik Informatika". */
export const stripDegree = (s) => String(s).replace(/^\s*(?:S\s*-?\s*[123]|D\s*-?\s*(?:IV|III|II|I|[1-4])|SMA|SMK)\b[\s:.\-/]*/i, '').trim()

/** Jenis formasi (teks bebas) -> kunci jenis kebutuhan di exam-config. */
export function jenisKey(text) {
  const t = String(text ?? '').toLowerCase()
  if (/cum\s*laude|dengan\s*pujian|diaspora/.test(t)) return 'cumlaude_diaspora'
  if (/disabilitas|papua/.test(t)) return 'disabilitas_papua'
  if (/olahraga/.test(t)) return 'olahragawan'
  return 'umum'
}

/** Ubah satu objek mentah menjadi lowongan baku, atau null bila data minimal (instansi dan jabatan) tidak ada. */
export function normalizeVacancy(raw, cmap = columnMap(Object.keys(raw))) {
  const g = (k) => (cmap[k] !== undefined ? raw[cmap[k]] : '')
  const instansi = String(g('instansi') ?? '').trim().slice(0, 120)
  const jabatan = String(g('jabatan') ?? '').trim().slice(0, 160)
  if (!instansi || !jabatan) return null
  const pendidikanRaw = list(g('jurusan'))
  const jenjangRaw = list(String(g('jenjang') ?? '').replace(/\//g, ';')).map((x) => x.toUpperCase().replace(/[\s-]+/g, ''))
  const jenjang = jenjangRaw.length ? jenjangRaw : [...new Set(pendidikanRaw.flatMap(extractDegrees))]
  const jenisText = String(g('jenis') || 'Umum').trim().slice(0, 60)
  const v = {
    instansi, jabatan,
    lokasi: String(g('lokasi') ?? '').trim().slice(0, 100),
    jenjang,
    jurusan: pendidikanRaw.map(stripDegree).filter(Boolean).slice(0, 40),
    kuota: num(g('kuota')),
    pelamar: num(g('pelamar')),
    jenis: jenisText,
    jenis_key: jenisKey(jenisText),
    tutup: String(g('tutup') ?? '').trim().slice(0, 20),
    tautan: /^https?:\/\//i.test(String(g('tautan') ?? '').trim()) ? String(g('tautan')).trim().slice(0, 300) : '',
    catatan: String(g('catatan') ?? '').trim().slice(0, 300),
  }
  v.id = `v-${hash([v.instansi, v.jabatan, v.lokasi, v.jenjang.join(), v.jenis].join('|').toLowerCase())}`
  return v
}

const isPppk = (raw, cmap) => cmap.tipe !== undefined && /pppk|paruh\s*waktu|perjanjian\s*kerja/i.test(String(raw[cmap.tipe] ?? ''))

/** Cari daftar baris di JSON bersarang (array langsung, atau di bawah kunci umum seperti data/formasi/lowongan). */
export function findRows(data, depth = 0) {
  if (Array.isArray(data)) return data.length === 0 || typeof data[0] === 'object' ? data : null
  if (!data || typeof data !== 'object' || depth > 2) return null
  for (const k of ['lowongan', 'formasi', 'data', 'items', 'results', 'list', 'rows', 'content']) {
    const r = findRows(data[k], depth + 1)
    if (r) return r
  }
  return null
}

/** Baca teks file (JSON atau CSV). Mengembalikan { items, skipped, pppk }. Melempar Error bila format salah. */
export function parseVacancyFile(text, filename = '') {
  let rawRows
  const t = text.trim()
  if (/\.json$/i.test(filename) || t.startsWith('[') || t.startsWith('{')) {
    let data
    try { data = JSON.parse(t) } catch { throw new Error('File JSON tidak valid.') }
    rawRows = findRows(data)
    if (!rawRows) throw new Error('JSON harus berupa daftar formasi (array), atau objek dengan daftar di bawah kunci seperti "lowongan", "formasi", atau "data".')
  } else {
    const rows = parseCsv(t)
    if (rows.length < 2) throw new Error('CSV kosong atau tidak punya baris data.')
    const head = rows[0].map((h) => h.trim())
    const cm = columnMap(head)
    if (cm.instansi === undefined || cm.jabatan === undefined) throw new Error('Baris pertama CSV harus berisi nama kolom, minimal instansi dan jabatan (nama lain seperti "nama jabatan" juga dikenali). Unduh templat untuk contoh.')
    rawRows = rows.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])))
  }
  const items = []
  let skipped = 0
  let pppk = 0
  const seen = new Set()
  let cmap = null
  for (const r of rawRows.slice(0, MAX_ROWS)) {
    if (!r || typeof r !== 'object') { skipped += 1; continue }
    cmap = columnMap(Object.keys(r))
    if (isPppk(r, cmap)) { pppk += 1; continue }
    const v = normalizeVacancy(r, cmap)
    if (!v || seen.has(v.id)) { skipped += 1; continue }
    seen.add(v.id)
    items.push(v)
  }
  skipped += Math.max(0, rawRows.length - MAX_ROWS)
  return { items, skipped, pppk, truncated: rawRows.length > MAX_ROWS }
}
