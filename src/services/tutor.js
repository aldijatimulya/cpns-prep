// Tutor AI: memanggil API Anthropic langsung dari browser memakai kunci API milik pengguna.
// Kunci disimpan terpisah dari data belajar (tidak ikut cadangan JSON) dan hanya di browser ini.
const KEY = 'cpns-prep:tutor'
export const DEFAULT_MODEL = 'claude-haiku-5-5'
const ENDPOINT = 'https://api.anthropic.com/v1/messages'

export function loadTutorConfig() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}')
    return { apiKey: typeof raw.apiKey === 'string' ? raw.apiKey : '', model: raw.model || DEFAULT_MODEL }
  } catch {
    return { apiKey: '', model: DEFAULT_MODEL }
  }
}

export function saveTutorConfig(cfg) {
  try {
    if (!cfg.apiKey) localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, JSON.stringify({ apiKey: cfg.apiKey.trim(), model: (cfg.model || DEFAULT_MODEL).trim() }))
  } catch {
    /* penyimpanan tidak tersedia */
  }
}

const SYSTEM = `Anda adalah tutor pribadi untuk persiapan SKD CPNS Indonesia (TWK, TIU, TKP). Jawab dalam bahasa Indonesia yang jelas dan ringkas, seperti guru yang sabar.
Aturan:
- Soal berasal dari bank latihan buatan sendiri dan masih berstatus draft, jadi bisa saja keliru. Bila menurut Anda kunci atau pembahasan yang diberikan salah atau meragukan, katakan terus terang beserta alasannya.
- Jangan mengarang pasal, nomor undang-undang, tahun, atau angka. Bila tidak yakin, sebut ketidakpastiannya dan sarankan memeriksa sumber resmi.
- Untuk TIU, tunjukkan langkah penyelesaian dan sebisa mungkin satu cara cepat.
- Untuk TKP, jelaskan alasan tiap tingkat respons. Bobot skor di latihan ini ilustrasi dan bukan standar resmi.
- Jangan memprediksi kelulusan atau menjanjikan soal yang akan keluar.
- Jangan menyalin soal ujian CAT asli.`

export function questionContext(q, chosen) {
  const opts = q.options.map((o) => `${o.key}. ${o.text}${o.score ? ` (skor ${o.score})` : ''}`).join('\n')
  const key = q.answer ? `Kunci: ${q.answer}` : 'Soal TKP (tanpa kunci tunggal, tiap opsi punya skor)'
  return [
    `Kategori: ${q.category}, topik: ${q.topic_id}`,
    `Soal: ${q.stem}`,
    q.stem_alt ? `Deskripsi gambar: ${q.stem_alt}` : '',
    `Opsi:\n${opts}`,
    key,
    `Jawaban pengguna: ${chosen ?? 'belum menjawab'}`,
    `Pembahasan bawaan: ${q.explanation.detailed}`,
  ].filter(Boolean).join('\n')
}

export async function askTutor({ config, context, messages, signal }) {
  if (!config.apiKey) throw new Error('Kunci API belum diisi di Pengaturan.')
  const msgs = messages.slice(-10).map((m, i, a) => (i === 0 ? { role: m.role, content: `${context}\n\n${m.content}` } : m))
  let res
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({ model: config.model || DEFAULT_MODEL, max_tokens: 1024, system: SYSTEM, messages: msgs }),
    })
  } catch (e) {
    if (e.name === 'AbortError') throw e
    throw new Error('Tidak bisa terhubung. Periksa koneksi internet Anda.')
  }
  if (!res.ok) {
    if (res.status === 401) throw new Error('Kunci API ditolak. Periksa kunci di Pengaturan.')
    if (res.status === 429) throw new Error('Terlalu banyak permintaan atau batas pemakaian tercapai. Coba lagi nanti.')
    if (res.status === 404) throw new Error('Model tidak ditemukan. Periksa nama model di Pengaturan.')
    throw new Error(`Permintaan gagal (kode ${res.status}).`)
  }
  const data = await res.json()
  const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim()
  if (!text) throw new Error('Jawaban kosong. Coba tanyakan lagi.')
  return text
}
