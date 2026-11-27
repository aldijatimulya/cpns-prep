// Memeriksa konsistensi materi <-> soal <-> kisi-kisi. Jalankan: npm run check:data
import { readFileSync } from 'node:fs'
const r = (p) => JSON.parse(readFileSync(new URL(`../src/data/${p}`, import.meta.url), 'utf8'))
const cur = r('curriculum/curriculum.json')
const qs = ['seed', 'bank-v1', 'bank-v2', 'bank-v3-induktif', 'bank-v3-matriks'].flatMap((f) => { const d = r(`questions/${f}.json`); return Array.isArray(d) ? d : d.questions })
const materi = { ...r('materi/twk.json'), ...r('materi/tiu.json'), ...r('materi/tkp.json') }
const err = [], warn = []
const topics = new Map(cur.categories.flatMap((c) => c.topics.map((t) => [t.id, t])))
const ids = new Set()
const cfg = r('exam-config/skd-2026.json')
const sumQ = cfg.sections.reduce((a, s) => a + s.questions, 0), sumMax = cfg.sections.reduce((a, s) => a + s.max_score, 0)
if (sumQ !== cfg.total_questions) err.push(`konfigurasi: jumlah soal subtes ${sumQ} != ${cfg.total_questions}`)
if (sumMax !== cfg.max_total) err.push(`konfigurasi: skor maks subtes ${sumMax} != ${cfg.max_total}`)
for (const s of cfg.sections) if (s.threshold > s.max_score) err.push(`konfigurasi: ambang ${s.category} melebihi skor maks`)
for (const [k, n] of Object.entries(cfg.needs)) if (n.rule === 'kumulatif_tiu' && (n.cumulative > cfg.max_total || n.tiu_min > 175)) err.push(`konfigurasi: ambang kebutuhan ${k} tidak masuk akal`)
const catOf = new Map(cur.categories.flatMap((c) => c.topics.map((t) => [t.id, c.id])))
for (const q of qs) {
  if (catOf.has(q.topic_id) && catOf.get(q.topic_id) !== q.category) err.push(`${q.id}: kategori ${q.category} != kategori topik ${catOf.get(q.topic_id)}`)
  if (ids.has(q.id)) err.push(`id ganda: ${q.id}`); ids.add(q.id)
  const t = topics.get(q.topic_id)
  if (!t) { err.push(`${q.id}: topic_id tidak dikenal`); continue }
  if (!Number.isInteger(q.indicator) || q.indicator < 0 || q.indicator >= t.indicators.length) err.push(`${q.id}: indicator tidak valid (${q.indicator})`)
  const keys = (q.options ?? []).map((o) => o.key ?? o.id ?? o.label)
  if (q.answer != null && !keys.includes(q.answer)) err.push(`${q.id}: kunci jawaban ${q.answer} tidak ada di opsi ${keys}`)
  if (keys.length < 2) err.push(`${q.id}: opsi kurang dari 2`)
  else if (keys.length !== 5) warn.push(`${q.id}: ${keys.length} opsi (bukan 5)`)
}
for (const [id, t] of topics) {
  const m = materi[id]
  if (!m) { err.push(`${id}: materi belum ada`); continue }
  if (!m.ringkasan) err.push(`${id}: ringkasan kosong`)
  if (m.indikator?.length !== t.indicators.length) err.push(`${id}: materi ${m.indikator?.length} indikator, kisi-kisi ${t.indicators.length}`)
  t.indicators.forEach((_, i) => {
    if (!m.indikator?.[i]?.poin?.length) err.push(`${id}[${i}]: poin materi kosong`)
    const n = qs.filter((q) => q.topic_id === id && q.indicator === i).length
    if (n < 2) warn.push(`${id}[${i}]: hanya ${n} soal`)
  })
}
for (const id of Object.keys(materi)) if (!topics.has(id)) err.push(`materi ${id} tidak ada di kisi-kisi`)
console.log(`${topics.size} topik, ${qs.length} soal, ${Object.keys(materi).length} materi`)
warn.forEach((w) => console.log('PERINGATAN', w))
err.forEach((e) => console.log('GALAT', e))
process.exit(err.length ? 1 : 0)
