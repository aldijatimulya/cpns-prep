// Penyimpanan lokal (localStorage) dengan try/catch.
// Setiap akun punya kunci sendiri (cpns-prep:u:<id>) agar data dua akun di satu browser tidak tercampur.
// Kunci lama 'cpns-prep:v1' dipakai untuk mode tamu dan data dari versi sebelum akun online.
export const LEGACY_KEY = 'cpns-prep:v1'
export const userKey = (uid) => `cpns-prep:u:${uid}`
const metaKey = (key) => `${key}:meta`

export const emptyState = () => ({
  attempts: [], notes: {}, bookmarks: [], verified: [],
  plan: { examDate: '', dailyTarget: 20 }, skb: [], profile: { name: '' },
})

const read = (k) => {
  try { return localStorage.getItem(k) } catch { return null }
}
const write = (k, v) => {
  try { localStorage.setItem(k, v) } catch { /* penyimpanan tidak tersedia: aplikasi tetap jalan tanpa persistensi */ }
}
const remove = (k) => {
  try { localStorage.removeItem(k) } catch { /* abaikan */ }
}

export function loadState(key = LEGACY_KEY) {
  try {
    const raw = read(key)
    if (!raw) return emptyState()
    return { ...emptyState(), ...JSON.parse(raw) }
  } catch {
    return emptyState()
  }
}

export function saveState(state, key = LEGACY_KEY) {
  write(key, JSON.stringify(state))
}

export function hasState(key) {
  return read(key) != null
}

export function clearState(key) {
  remove(key)
  remove(metaKey(key))
}

/** Metadata sinkronisasi per akun: id sesi yang sudah di server, dan apakah ada perubahan yang belum terkirim. */
export function loadMeta(key) {
  try {
    const m = JSON.parse(read(metaKey(key)) ?? 'null')
    return { synced: Array.isArray(m?.synced) ? m.synced : [], dirty: !!m?.dirty, importedLegacy: !!m?.importedLegacy, wipe: !!m?.wipe }
  } catch {
    return { synced: [], dirty: false, importedLegacy: false, wipe: false }
  }
}

export function saveMeta(key, meta) {
  write(metaKey(key), JSON.stringify(meta))
}

// Penanda mode tamu (tanpa akun).
const GUEST = 'cpns-prep:guest'
export const isGuest = () => read(GUEST) === '1'
export const setGuest = (on) => (on ? write(GUEST, '1') : remove(GUEST))

export function exportState(state) {
  const { profile: _profile, ...rest } = state
  return JSON.stringify(rest, null, 2)
}

const okAttempt = (a) => a && typeof a.id === 'string' && Array.isArray(a.items)

/**
 * Gabungkan data `data` ke `current` tanpa menghapus yang ada.
 * Sesi, penanda, dan SKB digabung (union). Untuk catatan dan rencana, `current` menang
 * kecuali `preferIncoming` true.
 */
export function mergeStates(current, data, { preferIncoming = false } = {}) {
  const known = new Set(current.attempts.map((a) => a.id))
  const incoming = (Array.isArray(data.attempts) ? data.attempts : []).filter((a) => okAttempt(a) && !known.has(a.id))
  const attempts = [...current.attempts, ...incoming].sort((a, b) => String(a.date).localeCompare(String(b.date)))
  const uniq = (a, b) => [...new Set([...(a ?? []), ...(Array.isArray(b) ? b.filter((x) => typeof x === 'string') : [])])]
  const inNotes = data.notes && typeof data.notes === 'object' ? data.notes : {}
  const notes = preferIncoming ? { ...current.notes, ...inNotes } : { ...inNotes, ...current.notes }
  const skbIds = new Set(current.skb.map((x) => x.id))
  const skb = [...current.skb, ...(Array.isArray(data.skb) ? data.skb.filter((x) => x && typeof x.id === 'string' && typeof x.title === 'string' && !skbIds.has(x.id)) : [])]
  const inPlan = data.plan && typeof data.plan === 'object' ? data.plan : {}
  const plan = preferIncoming ? { ...current.plan, ...inPlan } : current.plan.examDate ? current.plan : { ...current.plan, ...inPlan }
  return {
    state: { ...current, attempts, notes, bookmarks: uniq(current.bookmarks, data.bookmarks), verified: uniq(current.verified, data.verified), skb, plan },
    addedAttempts: incoming.length,
  }
}

/** Gabungkan cadangan JSON (teks) ke state saat ini. Melempar Error bila format salah. */
export function mergeImported(current, raw) {
  let data
  try { data = JSON.parse(raw) } catch { throw new Error('File bukan JSON yang valid.') }
  if (!data || typeof data !== 'object' || !Array.isArray(data.attempts)) {
    throw new Error('Format cadangan tidak dikenali (tidak ada daftar sesi).')
  }
  return mergeStates(current, data)
}
