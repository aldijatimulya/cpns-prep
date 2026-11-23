import { examConfig, topicById } from '../data'

// Bobot subtopik untuk komposisi simulasi. Ini ASUMSI belajar (dari label likelihood),
// bukan komposisi resmi: kisi-kisi resmi tidak menerbitkan jumlah soal per subtopik.
const WEIGHT = { tinggi: 3, sedang: 2, rendah: 1 }

/** Pengambilan sampel berbobot tanpa pengembalian (Efraimidis-Spirakis). */
function weightedSample(items, n) {
  return items
    .map((it) => ({ it, key: Math.pow(Math.random(), 1 / it.w) }))
    .sort((a, b) => b.key - a.key)
    .slice(0, n)
    .map((x) => x.it.q)
}

const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Susun soal simulasi: urutan TWK, TIU, TKP. Jika bank kurang dari komposisi penuh,
 * ambil sebanyak yang ada (partial = true).
 */
export function composeCat(pool) {
  const questions = []
  const sections = {}
  for (const s of examConfig.sections) {
    const cands = pool.filter((q) => q.category === s.category)
    const perTopic = {}
    for (const q of cands) perTopic[q.topic_id] = (perTopic[q.topic_id] ?? 0) + 1
    const items = cands.map((q) => ({
      q,
      w: (WEIGHT[topicById[q.topic_id]?.likelihood] ?? 2) / perTopic[q.topic_id],
    }))
    const n = Math.min(s.questions, cands.length)
    questions.push(...shuffle(weightedSample(items, n)))
    sections[s.category] = { need: s.questions, n }
  }
  const partial = Object.values(sections).some((x) => x.n < x.need)
  return { questions, sections, partial }
}

/** Ambang batas untuk subtes dengan n soal: penuh = nilai referensi; sebagian = diskalakan (perkiraan). */
export function thresholdFor(section, n) {
  if (n === section.questions) return { value: section.threshold, approx: false, n }
  return { value: Math.round((section.threshold * n) / section.questions), approx: true, n }
}

export function catDurationSec(totalQuestions) {
  return Math.round((examConfig.duration_minutes * 60 * totalQuestions) / examConfig.total_questions)
}
