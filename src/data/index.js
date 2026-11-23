import curriculum from './curriculum/curriculum.json'
import examConfig from './exam-config/skd-ref-2024.json'
import seed from './questions/seed.json'
import bankV1 from './questions/bank-v1.json'

const questions = [...seed, ...bankV1]

export { curriculum, examConfig, questions }

export const categories = curriculum.categories.filter((c) => c.topics.length > 0)

export const topics = curriculum.categories.flatMap((c) =>
  c.topics.map((t) => ({ ...t, category: c.id })),
)

export const topicById = Object.fromEntries(topics.map((t) => [t.id, t]))

export const sectionByCategory = Object.fromEntries(
  examConfig.sections.map((s) => [s.category, s]),
)

export function questionsForTopic(topicId) {
  return questions.filter((q) => q.topic_id === topicId)
}

export const targetSeconds = examConfig.internal_targets_not_official.seconds_per_question
export const masteredAccuracy = examConfig.internal_targets_not_official.mastered_accuracy

/** Poin maksimum satu soal: TWK/TIU = 5, TKP = opsi tertinggi (5). */
export function maxPoints(q) {
  const s = sectionByCategory[q.category]
  return s.scoring.type === 'right_wrong' ? s.scoring.correct : s.scoring.max_option
}

/** Poin yang didapat untuk jawaban `chosen` (key opsi atau null). */
export function pointsFor(q, chosen) {
  if (!chosen) return 0
  const s = sectionByCategory[q.category]
  if (s.scoring.type === 'right_wrong') {
    return chosen === q.answer ? s.scoring.correct : s.scoring.wrong
  }
  return q.options.find((o) => o.key === chosen)?.score ?? 0
}

export function isCorrect(q, chosen) {
  if (!chosen) return false
  if (q.answer) return chosen === q.answer
  return pointsFor(q, chosen) === maxPoints(q)
}
