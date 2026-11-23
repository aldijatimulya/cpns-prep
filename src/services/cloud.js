// Sinkronisasi ke Supabase. Sesi latihan disimpan satu baris per sesi (tabel attempts, hanya yang baru dikirim),
// sisanya (catatan, penanda, rencana, SKB) satu baris per akun (tabel user_state).
import { supabase } from './supabase'

const PAGE = 500
const CHUNK = 50

async function fetchAttempts(uid) {
  const out = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('attempts').select('payload').eq('user_id', uid).order('taken_at', { ascending: true }).range(from, from + PAGE - 1)
    if (error) throw error
    out.push(...data.map((r) => r.payload))
    if (data.length < PAGE) break
  }
  return out
}

export async function pullAll(uid) {
  const [st, attempts] = await Promise.all([
    supabase.from('user_state').select('data').eq('user_id', uid).maybeSingle(),
    fetchAttempts(uid),
  ])
  if (st.error) throw st.error
  return { rest: st.data?.data ?? null, attempts }
}

export async function pushAttempts(uid, list) {
  for (let i = 0; i < list.length; i += CHUNK) {
    const rows = list.slice(i, i + CHUNK).map((a) => ({
      user_id: uid, id: a.id, kind: a.kind ?? 'latihan', taken_at: a.date, payload: a,
    }))
    const { error } = await supabase.from('attempts').upsert(rows, { onConflict: 'user_id,id' })
    if (error) throw error
  }
}

export async function pushRest(uid, state) {
  const { attempts: _a, profile: _p, ...rest } = state
  const { error } = await supabase.from('user_state').upsert(
    { user_id: uid, data: rest, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' },
  )
  if (error) throw error
}

export async function wipeAttempts(uid) {
  const { error } = await supabase.from('attempts').delete().eq('user_id', uid)
  if (error) throw error
}
