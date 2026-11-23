import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { loadState, mergeImported, saveState } from '../services/storage'

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [state, setState] = useState(loadState)

  const update = useCallback((fn) => {
    setState((prev) => {
      const next = fn(prev)
      saveState(next)
      return next
    })
  }, [])

  const api = useMemo(
    () => ({
      state,
      addAttempt: (attempt) => update((s) => ({ ...s, attempts: [...s.attempts, attempt] })),
      setNote: (topicId, text) => update((s) => ({ ...s, notes: { ...s.notes, [topicId]: text } })),
      toggleBookmark: (qid) =>
        update((s) => ({
          ...s,
          bookmarks: s.bookmarks.includes(qid)
            ? s.bookmarks.filter((id) => id !== qid)
            : [...s.bookmarks, qid],
        })),
      toggleVerified: (qid) =>
        update((s) => ({
          ...s,
          verified: s.verified.includes(qid)
            ? s.verified.filter((id) => id !== qid)
            : [...s.verified, qid],
        })),
      importBackup: (raw) => {
        const { state: next, addedAttempts } = mergeImported(state, raw)
        update(() => next)
        return addedAttempts
      },
      setPlan: (patch) => update((s) => ({ ...s, plan: { ...s.plan, ...patch } })),
      addSkb: (title) => update((s) => ({ ...s, skb: [...s.skb, { id: `skb-${Date.now()}`, title, done: false, note: '' }] })),
      updateSkb: (id, patch) => update((s) => ({ ...s, skb: s.skb.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeSkb: (id) => update((s) => ({ ...s, skb: s.skb.filter((x) => x.id !== id) })),
      reset: () => update(() => ({ attempts: [], notes: {}, bookmarks: [], verified: [], plan: { examDate: '', dailyTarget: 20 }, skb: [] })),
    }),
    [state, update],
  )

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useStore() {
  return useContext(StoreContext)
}
