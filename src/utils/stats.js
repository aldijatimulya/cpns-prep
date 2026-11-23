import { masteredAccuracy, targetSeconds, topics } from '../data'

/** Agregasi per topik dari seluruh riwayat percobaan. */
export function topicStats(attempts) {
  const map = {}
  for (const t of topics) map[t.id] = { answered: 0, points: 0, max: 0, sessions: new Set() }
  for (const a of attempts) {
    for (const it of a.items) {
      const m = map[it.topic_id]
      if (!m || it.chosen == null) continue
      m.answered += 1
      m.points += it.points
      m.max += it.max
      m.sessions.add(a.id)
    }
  }
  const out = {}
  for (const [id, m] of Object.entries(map)) {
    const accuracy = m.max > 0 ? m.points / m.max : null
    out[id] = {
      answered: m.answered,
      sessions: m.sessions.size,
      accuracy,
      status: statusOf(m.answered, m.sessions.size, accuracy),
    }
  }
  return out
}

// Kriteria internal (bukan standar resmi): Mastered = akurasi >= target,
// minimal 10 jawaban dan 2 sesi.
function statusOf(answered, sessions, accuracy) {
  if (answered === 0) return 'Not Started'
  if (answered < 10 || sessions < 2) return 'Learning'
  return accuracy >= masteredAccuracy ? 'Mastered' : 'Needs Improvement'
}

export function overall(attempts) {
  let points = 0
  let max = 0
  let answered = 0
  for (const a of attempts) {
    for (const it of a.items) {
      if (it.chosen == null) continue
      points += it.points
      max += it.max
      answered += 1
    }
  }
  return { answered, accuracy: max ? points / max : null, sessions: attempts.length }
}

export const pct = (x) => (x == null ? '–' : `${Math.round(x * 100)}%`)

/** Skor per subtes dari satu percobaan. */
export function sectionScores(attempt) {
  const out = {}
  for (const it of attempt.items) {
    const s = (out[it.category] ??= { points: 0, max: 0, answered: 0 })
    s.points += it.points
    s.max += it.max
    if (it.chosen) s.answered += 1
  }
  return out
}

/** Data heatmap: topik x sesi terakhir (akurasi), plus rata-rata detik per soal vs target. */
export function heatmap(attempts, nCols = 8) {
  const cols = attempts.slice(-nCols)
  const offset = attempts.length - cols.length
  const rows = []
  for (const t of topics) {
    let pts = 0
    let max = 0
    let secs = 0
    let secN = 0
    const cells = cols.map((a) => {
      let p = 0
      let m = 0
      let n = 0
      for (const it of a.items) {
        if (it.topic_id === t.id && it.chosen) { p += it.points; m += it.max; n += 1 }
      }
      return { acc: m ? p / m : null, n }
    })
    for (const a of attempts) {
      for (const it of a.items) {
        if (it.topic_id !== t.id || !it.chosen) continue
        pts += it.points
        max += it.max
        if (it.seconds > 0) { secs += it.seconds; secN += 1 }
      }
    }
    if (max === 0) continue
    const target = targetSeconds[t.category]
    const avgSec = secN ? secs / secN : null
    rows.push({ topic: t, cells, acc: pts / max, avgSec, target, slow: avgSec != null && avgSec > target * 1.25 })
  }
  rows.sort((a, b) => a.acc - b.acc)
  return {
    cols: cols.map((a, i) => ({ n: offset + i + 1, date: a.date, kind: a.kind ?? 'latihan' })),
    rows,
  }
}

export function fmtTime(sec) {
  const s = Math.max(0, Math.round(sec))
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

/** Soal yang hasil terakhirnya belum penuh, atau pernah ditandai ragu-ragu pada percobaan terakhir. */
export function weakQuestionIds(attempts, bookmarks = []) {
  const last = new Map()
  for (const a of attempts) for (const it of a.items) last.set(it.qid, it)
  const ids = new Set(bookmarks)
  for (const [qid, it] of last) if (it.chosen && (it.points < it.max || it.flagged)) ids.add(qid)
  return ids
}

const dayKey = (d) => {
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}

/** Jumlah soal dijawab per hari untuk n hari terakhir (terlama dulu) dan streak hari beruntun. */
export function dailyActivity(attempts, days = 7, now = new Date()) {
  const counts = {}
  for (const a of attempts) {
    const k = dayKey(a.date)
    counts[k] = (counts[k] ?? 0) + a.items.filter((i) => i.chosen).length
  }
  const out = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    out.push({ key: dayKey(d), label: d.toLocaleDateString('id-ID', { weekday: 'short' }), n: counts[dayKey(d)] ?? 0 })
  }
  let streak = 0
  for (let i = 0; ; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    if (counts[dayKey(d)] > 0) streak++
    else if (i > 0) break
    else if (i === 0) continue
    if (i > 3650) break
  }
  return { days: out, streak, today: out[out.length - 1].n }
}

export function daysUntil(dateStr, now = new Date()) {
  if (!dateStr) return null
  const t = new Date(`${dateStr}T00:00:00`)
  const n = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((t - n) / 86400000)
}
