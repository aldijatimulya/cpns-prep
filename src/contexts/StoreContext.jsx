import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import * as cloud from '../services/cloud'
import {
  LEGACY_KEY, clearState, emptyState, hasState, loadMeta, loadState, mergeImported, mergeStates, saveMeta, saveState, userKey,
} from '../services/storage'

const StoreContext = createContext(null)

const hasData = (s) => s.attempts.length > 0 || Object.keys(s.notes).length > 0 || s.bookmarks.length > 0 || s.verified.length > 0 || s.skb.length > 0 || !!s.plan.examDate || (s.vacancies?.length ?? 0) > 0 || !!s.agent?.major || !!s.skbTarget || Object.keys(s.skbModules ?? {}).length > 0

// Penanda perbandingan yang tidak peduli urutan kunci (jsonb di server mengurutkan ulang kunci).
const stable = (v) => JSON.stringify(v, (_, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => a.localeCompare(b))) : x))
const body = ({ profile: _p, ...rest }) => rest

export function StoreProvider({ children }) {
  const auth = useAuth()
  const uid = auth.user?.id ?? null
  const key = uid ? userKey(uid) : auth.guest ? LEGACY_KEY : null

  const [state, setState] = useState(emptyState)
  const [hydratedKey, setHydratedKey] = useState(null) // kunci akun yang datanya sudah siap dipakai
  const hydrated = hydratedKey != null && hydratedKey === key
  const [sync, setSync] = useState('idle') // idle | syncing | saved | offline | error
  const [legacyCount, setLegacyCount] = useState(0)

  const stateRef = useRef(state)
  const keyRef = useRef(key)
  const uidRef = useRef(uid)
  const suppress = useRef(false) // true = perubahan state berasal dari server/bootstrap, jangan ditandai "belum terkirim"
  const timer = useRef(null)
  const inflight = useRef(null)
  const again = useRef(false)
  const lastPull = useRef(0)
  const pulledFor = useRef(null) // kunci akun yang sudah berhasil ditarik dari server pada sesi ini
  useEffect(() => { stateRef.current = state }, [state])
  useEffect(() => { keyRef.current = key; uidRef.current = uid }, [key, uid])

  /**
   * Cocokkan cache lokal dengan server (sekali per akun per sesi), sebelum ada yang dikirim.
   * - ada perubahan lokal belum terkirim: gabungkan (union), perubahan lokal menang untuk catatan/rencana
   * - tidak ada: ambil data server apa adanya (server = sumber kebenaran)
   * Ini mencegah cache usang di perangkat baru menimpa data server.
   */
  const reconcile = useCallback(async (k, id) => {
    try {
      const local = stateRef.current
      let meta = loadMeta(k)
      if (meta.wipe) {
        await cloud.wipeAttempts(id)
        meta = { ...meta, wipe: false, synced: [] }
        saveMeta(k, meta)
      }
      const remote = await cloud.pullAll(id)
      if (keyRef.current !== k) return { ok: false }
      const hasRemote = remote.rest != null || remote.attempts.length > 0
      const remoteData = { ...(remote.rest ?? {}), attempts: remote.attempts }
      let next = local
      let needsPush = false
      if (meta.dirty) {
        next = mergeStates(local, remoteData).state
        needsPush = true
      } else if (hasRemote) {
        next = { ...emptyState(), ...remoteData, profile: local.profile }
      } else if (hasData(local)) {
        needsPush = true
      }
      saveMeta(k, { ...meta, synced: remote.attempts.map((a) => a.id), dirty: needsPush })
      pulledFor.current = k
      lastPull.current = Date.now()
      if (next !== local) { suppress.current = true; stateRef.current = next; setState(next) }
      return { ok: true, needsPush }
    } catch {
      setSync(typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'error')
      return { ok: false }
    }
  }, [])

  /** Kirim semua perubahan yang belum terkirim. Mengembalikan true bila berhasil. */
  const flush = useCallback(() => {
    const k = keyRef.current
    const id = uidRef.current
    if (!k || !id) return Promise.resolve(true)
    if (inflight.current) { again.current = true; return inflight.current }
    setSync('syncing')
    inflight.current = (async () => {
      try {
        if (pulledFor.current !== k) {
          const r = await reconcile(k, id)
          if (!r.ok) return false
        }
        do {
          again.current = false
          const snap = stateRef.current
          let meta = loadMeta(k)
          if (meta.wipe) {
            await cloud.wipeAttempts(id)
            meta = { ...meta, wipe: false, synced: [] }
            saveMeta(k, meta)
          }
          const done = new Set(meta.synced)
          const fresh = snap.attempts.filter((a) => !done.has(a.id))
          if (fresh.length) await cloud.pushAttempts(id, fresh)
          await cloud.pushRest(id, snap)
          const m2 = loadMeta(k)
          saveMeta(k, { ...m2, synced: [...new Set([...m2.synced, ...fresh.map((a) => a.id)])], dirty: again.current })
        } while (again.current)
        setSync('saved')
        return true
      } catch {
        setSync(typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'error')
        return false
      } finally {
        inflight.current = null
      }
    })()
    return inflight.current
  }, [reconcile])

  // Muat data saat akun/mode berganti: cache lokal dulu (cepat), lalu cocokkan dengan server.
  useEffect(() => {
    clearTimeout(timer.current)
    setLegacyCount(0)
    pulledFor.current = null
    if (!key) {
      setState(emptyState())
      setHydratedKey(null)
      setSync('idle')
      return undefined
    }
    const local = loadState(key)
    stateRef.current = local
    setState(local)
    setHydratedKey(null)
    if (!uid) {
      setSync('idle')
      setHydratedKey(key)
      return undefined
    }
    let alive = true
    ;(async () => {
      setSync('syncing')
      const r = await reconcile(key, uid)
      if (!alive) return
      suppress.current = true // hydrated berubah di render yang sama: bukan perubahan dari pengguna
      setHydratedKey(key)
      if (!r.ok) return
      const meta = loadMeta(key)
      if (!meta.importedLegacy && hasState(LEGACY_KEY)) {
        const old = loadState(LEGACY_KEY)
        if (old.attempts.length > 0 || Object.keys(old.notes).length > 0) setLegacyCount(old.attempts.length || 1)
      }
      if (r.needsPush) flush()
      else setSync('saved')
    })()
    return () => { alive = false }
  }, [key, uid, flush, reconcile])

  // Simpan ke cache lokal setiap state berubah; untuk akun online, jadwalkan pengiriman.
  useEffect(() => {
    if (!key || !hydrated || keyRef.current !== key) return
    saveState(state, key)
    if (suppress.current) { suppress.current = false; return }
    if (uid) {
      saveMeta(key, { ...loadMeta(key), dirty: true })
      if (inflight.current) again.current = true
      clearTimeout(timer.current)
      timer.current = setTimeout(flush, 1200)
    }
  }, [state, hydrated, key, uid, flush])

  // Tarik perubahan dari perangkat lain saat tab kembali aktif; kirim sisa perubahan saat tab disembunyikan / online lagi.
  useEffect(() => {
    if (!uid) return undefined
    const refresh = async () => {
      const k = keyRef.current
      if (!k || inflight.current || loadMeta(k).dirty || Date.now() - lastPull.current < 30000) return
      lastPull.current = Date.now()
      try {
        const r = await cloud.pullAll(uid)
        if (keyRef.current !== k || inflight.current || loadMeta(k).dirty) return
        const cur = stateRef.current
        const next = { ...cur, ...(r.rest ?? {}), attempts: r.attempts }
        saveMeta(k, { ...loadMeta(k), synced: r.attempts.map((a) => a.id) })
        if (stable(body(next)) !== stable(body(cur))) { suppress.current = true; setState(next) }
        setSync('saved')
      } catch { /* abaikan, coba lagi nanti */ }
    }
    const onVis = () => {
      if (document.visibilityState === 'visible') refresh()
      else if (keyRef.current && loadMeta(keyRef.current).dirty) flush()
    }
    const onOnline = () => { if (keyRef.current && loadMeta(keyRef.current).dirty) flush(); else refresh() }
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('online', onOnline)
    return () => { document.removeEventListener('visibilitychange', onVis); window.removeEventListener('online', onOnline) }
  }, [uid, flush])

  const update = useCallback((fn) => setState((prev) => fn(prev)), [])

  const api = useMemo(() => {
    const mode = uid ? 'cloud' : 'guest'
    const profileName = uid ? auth.name : state.profile.name || 'Tamu'
    return {
      state, hydrated, sync, mode, profileName, email: auth.email, legacyCount,
      retrySync: () => { clearTimeout(timer.current); return flush() },
      addAttempt: (attempt) => update((s) => ({ ...s, attempts: [...s.attempts, attempt] })),
      setNote: (topicId, text) => update((s) => ({ ...s, notes: { ...s.notes, [topicId]: text } })),
      toggleBookmark: (qid) =>
        update((s) => ({ ...s, bookmarks: s.bookmarks.includes(qid) ? s.bookmarks.filter((id) => id !== qid) : [...s.bookmarks, qid] })),
      toggleVerified: (qid) =>
        update((s) => ({ ...s, verified: s.verified.includes(qid) ? s.verified.filter((id) => id !== qid) : [...s.verified, qid] })),
      importBackup: (raw) => {
        const { state: next, addedAttempts } = mergeImported(state, raw)
        update(() => next)
        return addedAttempts
      },
      importLegacy: () => {
        const { state: next } = mergeStates(state, loadState(LEGACY_KEY))
        update(() => next)
        if (key) saveMeta(key, { ...loadMeta(key), importedLegacy: true })
        setLegacyCount(0)
      },
      dismissLegacy: () => {
        if (key) saveMeta(key, { ...loadMeta(key), importedLegacy: true })
        setLegacyCount(0)
      },
      setProfile: (name) => update((s) => ({ ...s, profile: { ...s.profile, name: name.trim().slice(0, 40) } })),
      setPlan: (patch) => update((s) => ({ ...s, plan: { ...s.plan, ...patch } })),
      addSkb: (title) => update((s) => ({ ...s, skb: [...s.skb, { id: `skb-${Date.now()}`, title, done: false, note: '' }] })),
      updateSkb: (id, patch) => update((s) => ({ ...s, skb: s.skb.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeSkb: (id) => update((s) => ({ ...s, skb: s.skb.filter((x) => x.id !== id) })),
      setAgent: (patch) => update((s) => ({ ...s, agent: { ...s.agent, ...patch } })),
      importVacancies: (list, replace = false) => update((s) => {
        const base = replace ? [] : s.vacancies ?? []
        const ids = new Set(base.map((v) => v.id))
        return { ...s, vacancies: [...base, ...list.filter((v) => !ids.has(v.id))].slice(0, 2000) }
      }),
      removeVacancy: (id) => update((s) => ({ ...s, vacancies: (s.vacancies ?? []).filter((v) => v.id !== id) })),
      clearVacancies: () => update((s) => ({ ...s, vacancies: [] })),
      setSkbTarget: (target) => update((s) => ({ ...s, skbTarget: target })),
      patchSkbTarget: (patch) => update((s) => (s.skbTarget ? { ...s, skbTarget: { ...s.skbTarget, ...patch } } : s)),
      saveSkbModule: (key, patch) => update((s) => {
        const mods = s.skbModules ?? {}
        if (!mods[key] && Object.keys(mods).length >= 20) return s
        const cur = mods[key] ?? { kisi: [], questions: [] }
        return { ...s, skbModules: { ...mods, [key]: { ...cur, ...patch, updated: new Date().toISOString() } } }
      }),
      addSkbQuestions: (key, list) => update((s) => {
        const mods = s.skbModules ?? {}
        const cur = mods[key] ?? { kisi: [], questions: [] }
        return { ...s, skbModules: { ...mods, [key]: { ...cur, questions: [...cur.questions, ...list].slice(0, 400), updated: new Date().toISOString() } } }
      }),
      removeSkbQuestion: (key, id) => update((s) => {
        const cur = s.skbModules?.[key]
        return cur ? { ...s, skbModules: { ...s.skbModules, [key]: { ...cur, questions: cur.questions.filter((q) => q.id !== id) } } } : s
      }),
      toggleSkbVerified: (key, id) => update((s) => {
        const cur = s.skbModules?.[key]
        return cur ? { ...s, skbModules: { ...s.skbModules, [key]: { ...cur, questions: cur.questions.map((q) => (q.id === id ? { ...q, verified: !q.verified } : q)) } } } : s
      }),
      removeSkbModule: (key) => update((s) => { const { [key]: _x, ...rest } = s.skbModules ?? {}; return { ...s, skbModules: rest } }),
      addSkbRun: (run) => update((s) => ({ ...s, skbRuns: [...(s.skbRuns ?? []), run].slice(-40) })),
      reset: () => {
        if (uid && key) saveMeta(key, { ...loadMeta(key), wipe: true, synced: [] })
        update((s) => ({ ...emptyState(), profile: s.profile }))
      },
      logout: async () => {
        if (uid && key) {
          clearTimeout(timer.current)
          const ok = await flush()
          if (!ok && !window.confirm('Sebagian data belum terkirim ke server (mungkin sedang offline). Jika keluar sekarang, data itu akan hilang dari perangkat ini. Tetap keluar?')) return
          await auth.signOut()
          clearState(key)
        } else {
          await auth.signOut()
        }
      },
    }
  }, [state, hydrated, sync, uid, key, auth, legacyCount, update, flush])

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useStore() {
  return useContext(StoreContext)
}
