// Supabase Edge Function: penghubung aman ke Google Gemini.
// Kunci Gemini disimpan sebagai SECRET di Supabase (GEMINI_API_KEY), tidak pernah dikirim ke browser.
// Hanya pengguna yang login yang boleh memanggil, dan ada batas pemakaian harian per akun.
import { createClient } from 'npm:@supabase/supabase-js@2'

const MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.5-flash-lite'
const DAILY_LIMIT = Number(Deno.env.get('AI_DAILY_LIMIT') ?? '30')
const ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? '*' // isi dengan alamat situs Anda, mis. https://namaanda.github.io

const cors = {
  'access-control-allow-origin': ORIGIN,
  'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info',
  'access-control-allow-methods': 'POST, OPTIONS',
}
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } })

const GUARD = 'Aturan tetap dari server: Anda hanya melayani persiapan seleksi CPNS/ASN Indonesia (materi TWK, TIU, TKP, strategi seleksi, dan penjelasan hasil analisis). Tolak dengan sopan permintaan di luar itu.\n\n'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json(405, { error: 'Metode tidak diizinkan.' })

  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) return json(500, { error: 'Layanan AI belum dikonfigurasi di server.' })

  // Wajib login: anon key saja tidak cukup.
  const auth = req.headers.get('authorization') ?? ''
  const supa = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } })
  const { data: u, error: ue } = await supa.auth.getUser()
  if (ue || !u?.user) return json(401, { error: 'Silakan masuk dengan akun untuk memakai fitur AI.' })

  let body: { system?: string; messages?: { role: string; content: string }[]; maxTokens?: number }
  try { body = await req.json() } catch { return json(400, { error: 'Format permintaan salah.' }) }
  const system = String(body.system ?? '').slice(0, 14000)
  const msgs = (Array.isArray(body.messages) ? body.messages : []).slice(-12)
    .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: String(m.content ?? '').slice(0, 8000) }] }))
  if (!msgs.length || msgs[msgs.length - 1].role !== 'user') return json(400, { error: 'Pesan kosong.' })
  const maxTokens = Math.min(Math.max(Number(body.maxTokens) || 1000, 100), 2000)

  // Batas harian per akun (fungsi SQL ai_take_quota, lihat docs/08-edge-function-ai.md).
  const { data: ok, error: qe } = await supa.rpc('ai_take_quota', { p_limit: DAILY_LIMIT })
  if (qe) return json(500, { error: 'Pembatas pemakaian belum disiapkan di database.' })
  if (!ok) return json(429, { error: `Batas ${DAILY_LIMIT} permintaan AI per hari sudah tercapai. Coba lagi besok.` })

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: GUARD + system }] }, contents: msgs, generationConfig: { maxOutputTokens: maxTokens, temperature: 0.4 } }),
  })
  if (!res.ok) {
    if (res.status === 429) return json(429, { error: 'Layanan AI sedang penuh (batas gratis Gemini). Coba lagi beberapa menit lagi.' })
    return json(502, { error: `Penyedia AI menolak permintaan (kode ${res.status}).` })
  }
  const data = await res.json()
  const text = (data.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? '').join('').trim()
  if (!text) return json(502, { error: 'Jawaban kosong. Coba tanyakan lagi.' })
  return json(200, { text })
})
