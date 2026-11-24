// Layanan AI (Tutor dan Agent): memanggil model langsung dari browser memakai kunci API milik pengguna.
// Penyedia: Gemini (ada tier gratis lewat Google AI Studio), API kompatibel OpenAI (DeepSeek, OpenAI, Groq, OpenRouter, dll), dan Anthropic.
// Kunci disimpan terpisah dari data belajar (tidak ikut cadangan JSON/sinkronisasi) dan hanya di browser ini.
import { isCloudEnabled, supabase } from './supabase'

const KEY = 'cpns-prep:tutor'

export const PROVIDERS = {
  server: { label: 'Server aplikasi (tanpa kunci, perlu masuk akun)', model: '', keyHint: '', baseUrl: '' },
  gemini: { label: 'Google Gemini (ada tier gratis)', model: 'gemini-3.5-flash-lite', keyHint: 'AIza...', baseUrl: '' },
  openai: { label: 'Kompatibel OpenAI (DeepSeek, OpenAI, Groq, OpenRouter)', model: 'deepseek-chat', keyHint: 'sk-...', baseUrl: 'https://api.deepseek.com' },
  anthropic: { label: 'Anthropic Claude (berbayar)', model: 'claude-haiku-5-5', keyHint: 'sk-ant-...', baseUrl: '' },
}
export const OPENAI_PRESETS = [
  { label: 'DeepSeek', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' },
  { label: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  { label: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
  { label: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', model: '' },
]
export const DEFAULT_PROVIDER = isCloudEnabled ? 'server' : 'gemini'
export const DEFAULT_MODEL = PROVIDERS.gemini.model

export const defaultConfig = (provider = DEFAULT_PROVIDER) => ({ provider, apiKey: '', model: PROVIDERS[provider].model, baseUrl: PROVIDERS[provider].baseUrl })

export function loadTutorConfig() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}')
    // Konfigurasi lama (sebelum v3.2) tidak punya "provider": itu kunci Anthropic.
    let provider = PROVIDERS[raw.provider] ? raw.provider : raw.apiKey ? 'anthropic' : DEFAULT_PROVIDER
    if (provider === 'server' && !isCloudEnabled) provider = 'gemini'
    const d = defaultConfig(provider)
    return { provider, apiKey: typeof raw.apiKey === 'string' ? raw.apiKey : '', model: raw.model || d.model, baseUrl: raw.baseUrl || d.baseUrl }
  } catch {
    return defaultConfig()
  }
}

export function saveTutorConfig(cfg) {
  try {
    if (cfg.provider === 'server') localStorage.setItem(KEY, JSON.stringify({ provider: 'server' }))
    else if (!cfg.apiKey) localStorage.removeItem(KEY)
    else {
      const d = defaultConfig(cfg.provider)
      localStorage.setItem(KEY, JSON.stringify({
        provider: cfg.provider, apiKey: cfg.apiKey.trim(), model: (cfg.model || d.model).trim(), baseUrl: (cfg.baseUrl || d.baseUrl).trim().replace(/\/+$/, ''),
      }))
    }
  } catch {
    /* penyimpanan tidak tersedia */
  }
}

/** AI siap dipakai: lewat server aplikasi (perlu login, dicek saat dipanggil) atau lewat kunci pribadi. */
export const hasAI = (cfg = loadTutorConfig()) => cfg.provider === 'server' ? isCloudEnabled : !!cfg.apiKey

export const TUTOR_SYSTEM = `Anda adalah tutor pribadi untuk persiapan SKD CPNS Indonesia (TWK, TIU, TKP). Jawab dalam bahasa Indonesia yang jelas dan ringkas, seperti guru yang sabar.
Aturan:
- Materi dan soal di aplikasi ini adalah draft buatan sendiri dan belum diverifikasi, jadi bisa keliru. Bila menurut Anda materi, kunci, atau pembahasan yang diberikan salah atau meragukan, katakan terus terang beserta alasannya.
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

const fail = (status) => {
  if (status === 400) return 'Permintaan ditolak (kode 400). Periksa nama model di Pengaturan.'
  if (status === 401 || status === 403) return 'Kunci API ditolak. Periksa kunci dan penyedia di Pengaturan.'
  if (status === 404) return 'Model atau alamat tidak ditemukan. Periksa nama model dan alamat API di Pengaturan.'
  if (status === 429) return 'Batas pemakaian tercapai (tier gratis dibatasi per menit dan per hari). Tunggu sebentar lalu coba lagi.'
  return `Permintaan gagal (kode ${status}).`
}

async function post(url, headers, body, signal) {
  let res
  try {
    res = await fetch(url, { method: 'POST', signal, headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) })
  } catch (e) {
    if (e.name === 'AbortError') throw e
    throw new Error('Tidak bisa terhubung ke penyedia AI. Periksa koneksi internet. Jika memakai penyedia selain Gemini, mungkin penyedia itu memblokir akses dari browser.')
  }
  if (!res.ok) throw new Error(fail(res.status))
  return res.json()
}

/** Lewat Edge Function Supabase `ai-proxy`: kunci Gemini tersimpan di server, bukan di browser. */
async function askServer({ system, messages, maxTokens }) {
  if (!supabase) throw new Error('Akun online belum aktif di situs ini.')
  const { data: sess } = await supabase.auth.getSession()
  if (!sess?.session) throw new Error('Masuk dengan akun email untuk memakai AI dari server, atau isi kunci API sendiri di Pengaturan.')
  const { data, error } = await supabase.functions.invoke('ai-proxy', { body: { system, messages: messages.slice(-12), maxTokens } })
  if (error) {
    let msg = ''
    try { msg = (await error.context.json()).error } catch { /* bukan JSON */ }
    if (!msg && error.name === 'FunctionsFetchError') msg = 'Tidak bisa menghubungi server AI. Periksa koneksi, dan pastikan fungsi ai-proxy sudah di-deploy serta ALLOWED_ORIGIN di Supabase sama dengan alamat situs ini.'
    if (!msg && error.context?.status === 404) msg = 'Fungsi ai-proxy belum ada di Supabase. Deploy fungsi tersebut lebih dulu.'
    throw new Error(msg || 'Server AI gagal menjawab. Coba lagi.')
  }
  const text = String(data?.text ?? '').trim()
  if (!text) throw new Error('Jawaban kosong. Coba tanyakan lagi.')
  return text
}

/** Panggil model. messages: [{role:'user'|'assistant', content}]. Mengembalikan teks jawaban. */
export async function askAI({ config, system, messages, signal, maxTokens = 1400 }) {
  if (config.provider === 'server') return askServer({ system, messages, maxTokens })
  if (!config.apiKey) throw new Error('Kunci API belum diisi di Pengaturan.')
  const msgs = messages.slice(-12)
  let text = ''
  if (config.provider === 'gemini') {
    const model = encodeURIComponent(config.model || DEFAULT_MODEL)
    const data = await post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      { 'x-goog-api-key': config.apiKey },
      {
        systemInstruction: { parts: [{ text: system }] },
        contents: msgs.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.4 },
      },
      signal,
    )
    text = (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('').trim()
    if (!text && data.promptFeedback?.blockReason) throw new Error('Pertanyaan diblokir oleh filter penyedia. Coba ubah kalimatnya.')
  } else if (config.provider === 'openai') {
    const base = (config.baseUrl || PROVIDERS.openai.baseUrl).replace(/\/+$/, '')
    const data = await post(
      `${base}/chat/completions`,
      { authorization: `Bearer ${config.apiKey}` },
      { model: config.model, max_tokens: maxTokens, temperature: 0.4, messages: [{ role: 'system', content: system }, ...msgs] },
      signal,
    )
    text = (data.choices?.[0]?.message?.content ?? '').trim()
  } else {
    const data = await post(
      'https://api.anthropic.com/v1/messages',
      { 'x-api-key': config.apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      { model: config.model, max_tokens: maxTokens, system, messages: msgs },
      signal,
    )
    text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim()
  }
  if (!text) throw new Error('Jawaban kosong. Coba tanyakan lagi.')
  return text
}

/** Tanya tutor tentang satu soal (dipakai TutorPanel). */
export function askTutor({ config, context, messages, signal }) {
  const msgs = messages.map((m, i) => (i === 0 ? { role: m.role, content: `${context}\n\n${m.content}` } : m))
  return askAI({ config, system: TUTOR_SYSTEM, messages: msgs, signal, maxTokens: 1024 })
}
