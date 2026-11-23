// Penyimpanan lokal (localStorage) dengan try/catch. Skema dibuat agar mudah
// dimigrasikan ke tabel Supabase (exam_attempts, user_answers, notes, bookmarks).
const KEY = 'cpns-prep:v1'

const empty = () => ({ attempts: [], notes: {}, bookmarks: [], verified: [], plan: { examDate: '', dailyTarget: 20 }, skb: [] })

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty()
    const parsed = JSON.parse(raw)
    return { ...empty(), ...parsed }
  } catch {
    return empty()
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* penyimpanan tidak tersedia: aplikasi tetap jalan tanpa persistensi */
  }
}

export function exportState(state) {
  return JSON.stringify(state, null, 2)
}

/** Gabungkan cadangan JSON ke state saat ini tanpa menghapus data yang ada. Melempar Error bila format salah. */
export function mergeImported(current, raw) {
  let data
  try { data = JSON.parse(raw) } catch { throw new Error('File bukan JSON yang valid.') }
  if (!data || typeof data !== 'object' || !Array.isArray(data.attempts)) {
    throw new Error('Format cadangan tidak dikenali (tidak ada daftar sesi).')
  }
  const okAttempt = (a) => a && typeof a.id === 'string' && Array.isArray(a.items)
  const known = new Set(current.attempts.map((a) => a.id))
  const newAttempts = data.attempts.filter((a) => okAttempt(a) && !known.has(a.id))
  const attempts = [...current.attempts, ...newAttempts].sort((a, b) => String(a.date).localeCompare(String(b.date)))
  const uniq = (a, b) => [...new Set([...(a ?? []), ...(Array.isArray(b) ? b.filter((x) => typeof x === 'string') : [])])]
  const notes = { ...(data.notes && typeof data.notes === 'object' ? data.notes : {}), ...current.notes }
  const skbIds = new Set(current.skb.map((x) => x.id))
  const skb = [...current.skb, ...(Array.isArray(data.skb) ? data.skb.filter((x) => x && typeof x.id === 'string' && typeof x.title === 'string' && !skbIds.has(x.id)) : [])]
  const plan = current.plan.examDate ? current.plan : { ...current.plan, ...(data.plan ?? {}) }
  return {
    state: { ...current, attempts, notes, bookmarks: uniq(current.bookmarks, data.bookmarks), verified: uniq(current.verified, data.verified), skb, plan },
    addedAttempts: newAttempts.length,
  }
}
