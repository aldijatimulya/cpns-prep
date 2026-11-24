// Mesin analisis Agent AI: kecocokan jurusan, perkiraan peluang, kesiapan SKD, titik lemah, dan strategi.
// Seluruhnya aturan deterministik di perangkat; AI (opsional) hanya menjelaskan hasilnya.
import { examConfig, questionById, topicById } from '../data'

const STOP = new Set(['dan', 'atau', 'program', 'studi', 'prodi', 'jurusan', 'ilmu', 'ilmu-ilmu', 'bidang', 'dengan', 'untuk', 'pada', 'di', 's1', 's2', 'd3', 'd4', 'sarjana', 'the', 'of'])
const ALL = /semua\s*(jurusan|prodi|program)|^semua$|seluruh\s*(jurusan|prodi)|^all\b|segala\s*jurusan/i

export const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
const tokens = (s) => norm(s).split(' ').filter((w) => w && !STOP.has(w))

/** Skor 0..1 kecocokan satu jurusan pengguna terhadap satu entri jurusan lowongan. */
export function majorMatch(user, entry) {
  if (!norm(user) || !norm(entry)) return 0
  if (ALL.test(String(entry).trim())) return 0.4
  const a = norm(user)
  const b = norm(entry)
  if (a === b) return 1
  if (a.includes(b) || b.includes(a)) return 0.9
  const ta = tokens(user)
  const tb = tokens(entry)
  if (!ta.length || !tb.length) return 0
  const shared = ta.filter((w) => tb.includes(w)).length
  const r = shared / Math.min(ta.length, tb.length)
  return r >= 1 ? 0.75 : r >= 0.5 ? 0.55 : shared > 0 ? 0.25 : 0
}

export function linearity(user, vacancy) {
  if (!vacancy.jurusan?.length) return { score: 0.3, label: 'Syarat jurusan tidak dicantumkan', level: 'unknown', best: null }
  let best = 0
  let bestEntry = null
  for (const e of vacancy.jurusan) { const m = majorMatch(user, e); if (m > best) { best = m; bestEntry = e } }
  const level = best >= 0.9 ? 'linear' : best >= 0.5 ? 'mungkin' : best === 0.4 ? 'terbuka' : 'tidak'
  const label = { linear: 'Linear', mungkin: 'Mungkin linear (cek daftar resmi)', terbuka: 'Terbuka untuk semua jurusan', tidak: 'Tidak linear' }[level]
  return { score: best, label, level, best: bestEntry }
}

const degreeOk = (userDegree, vacancy) => {
  if (!vacancy.jenjang?.length) return true
  const u = userDegree.toUpperCase().replace(/\s+/g, '')
  const eq = (x) => (x === 'D4' ? 'S1' : x)
  return vacancy.jenjang.some((j) => eq(j) === eq(u))
}

export function competition(v) {
  if (v.kuota == null || v.kuota <= 0 || v.pelamar == null) return { ratio: null, label: 'Data pelamar belum ada', score: 0.5, level: 'unknown' }
  const ratio = v.pelamar / v.kuota
  const level = ratio <= 3 ? 'longgar' : ratio <= 10 ? 'sedang' : ratio <= 30 ? 'ketat' : 'sangat ketat'
  const score = ratio <= 3 ? 1 : ratio <= 10 ? 0.7 : ratio <= 30 ? 0.4 : 0.15
  return { ratio, label: `${level} (${Math.round(ratio * 10) / 10} pelamar per formasi)`, score, level }
}

/** Perkiraan skor SKD per subtes dari simulasi CAT terbaru; bila belum ada, dari seluruh latihan (kurang andal). */
export function readiness(attempts) {
  const cats = attempts.filter((a) => a.kind === 'cat').slice(-3)
  const pool = cats.length ? cats : attempts
  const source = cats.length ? `rata-rata ${cats.length} simulasi CAT terakhir` : 'seluruh latihan (belum ada simulasi CAT)'
  const sections = examConfig.sections.map((sec) => {
    let pts = 0
    let max = 0
    let n = 0
    for (const a of pool) for (const it of a.items) if (it.category === sec.category && it.chosen != null) { pts += it.points; max += it.max; n += 1 }
    const est = max > 0 ? Math.round((pts / max) * sec.max_score) : null
    return { category: sec.category, estimate: est, threshold: sec.threshold, max: sec.max_score, n, gap: est == null ? null : est - sec.threshold, reliable: n >= 20 }
  })
  const known = sections.filter((s) => s.estimate != null)
  const all = known.length === sections.length
  const passing = all && sections.every((s) => s.gap >= 0)
  const near = all && sections.every((s) => s.gap >= -s.threshold * 0.1)
  const level = !known.length ? 'none' : !all ? 'partial' : passing ? 'above' : near ? 'near' : 'below'
  const score = !known.length ? 0.4 : Math.max(0, Math.min(1, known.reduce((a, s) => a + Math.max(0, Math.min(1.1, s.estimate / s.threshold)), 0) / known.length / 1.1))
  return { sections, level, score, source, usedCat: cats.length > 0, total: known.reduce((a, s) => a + s.estimate, 0), allKnown: all }
}

/** Indikator kisi-kisi terlemah: akurasi per (topik, indikator), minimal minN jawaban. */
export function weakIndicators(attempts, { minN = 3, limit = 6 } = {}) {
  const m = new Map()
  for (const a of attempts) {
    for (const it of a.items) {
      if (it.chosen == null) continue
      const q = questionById[it.qid]
      if (!q || q.indicator == null) continue
      const k = `${q.topic_id}#${q.indicator}`
      const e = m.get(k) ?? { topicId: q.topic_id, indicator: q.indicator, n: 0, pts: 0, max: 0 }
      e.n += 1; e.pts += it.points; e.max += it.max
      m.set(k, e)
    }
  }
  return [...m.values()]
    .filter((e) => e.n >= minN && e.max > 0)
    .map((e) => ({ ...e, acc: e.pts / e.max, topic: topicById[e.topicId], text: topicById[e.topicId]?.indicators?.[e.indicator] }))
    .filter((e) => e.topic && e.text)
    .sort((a, b) => a.acc - b.acc || b.n - a.n)
    .slice(0, limit)
}

/** Indikator yang belum pernah dicoba pada topik prioritas tinggi. */
export function untriedIndicators(attempts, limit = 4) {
  const seen = new Set()
  for (const a of attempts) for (const it of a.items) { const q = questionById[it.qid]; if (q && it.chosen != null) seen.add(`${q.topic_id}#${q.indicator}`) }
  const out = []
  for (const t of Object.values(topicById)) {
    if (t.priority !== 'high') continue
    t.indicators.forEach((text, i) => { if (!seen.has(`${t.id}#${i}`)) out.push({ topic: t, indicator: i, text }) })
  }
  return out.slice(0, limit)
}

/** Nilai gabungan 0..100 dan kelompok rekomendasi. Bobot: jurusan 45, peluang 30, kesiapan 25 (aturan internal, bukan standar resmi). */
export function recommend(vacancies, agent, attempts) {
  const rd = readiness(attempts)
  const eligible = []
  const excluded = []
  for (const v of vacancies) {
    if (!agent.major?.trim()) { excluded.push({ v, reason: 'Isi jurusan terlebih dahulu.' }); continue }
    if (!degreeOk(agent.degree || 'S1', v)) { excluded.push({ v, reason: `Jenjang pendidikan tidak sesuai (butuh ${v.jenjang.join('/')}).` }); continue }
    const lin = linearity(agent.major, v)
    if (lin.level === 'tidak') { excluded.push({ v, reason: 'Jurusan tidak cocok dengan syarat lowongan.', lin }); continue }
    const comp = competition(v)
    const score = Math.round((lin.score * 0.45 + comp.score * 0.3 + rd.score * 0.25) * 100)
    const reasons = [`Jurusan: ${lin.label}${lin.best && lin.level !== 'terbuka' ? ` (cocok dengan "${lin.best}")` : ''}.`]
    reasons.push(`Persaingan: ${comp.label}.`)
    if (v.kuota != null) reasons.push(`Kuota formasi: ${v.kuota}.`)
    if (agent.location && v.lokasi && norm(v.lokasi).includes(norm(agent.location))) reasons.push('Lokasi sesuai preferensi Anda.')
    const locBonus = agent.location && v.lokasi && norm(v.lokasi).includes(norm(agent.location)) ? 3 : 0
    const tier = lin.level === 'linear' && comp.score >= 0.4 ? 'Prioritas utama' : lin.level === 'linear' ? 'Linear, persaingan berat' : lin.level === 'mungkin' ? 'Cek kelinearan' : 'Alternatif (jurusan terbuka)'
    eligible.push({ v, lin, comp, score: Math.min(100, score + locBonus), tier, reasons })
  }
  eligible.sort((a, b) => b.score - a.score)
  return { rd, eligible, excluded }
}

export const daysUntil = (iso) => {
  if (!iso) return null
  const d = Math.ceil((new Date(`${iso}T00:00:00`) - new Date()) / 86400000)
  return Number.isFinite(d) ? d : null
}

/** Langkah strategi berbasis aturan dari kondisi pengguna saat ini. */
export function strategy({ rd, weak, untried, plan, top }) {
  const steps = []
  const d = daysUntil(plan?.examDate)
  if (d != null && d > 0) steps.push(`Waktu tersisa sampai tanggal ujian yang Anda isi: ${d} hari (~${Math.max(1, Math.round(d / 7))} minggu). Bagi waktu: 60% memperbaiki titik lemah, 25% simulasi CAT, 15% mengulang topik yang sudah kuat.`)
  else if (d != null) steps.push('Tanggal ujian di Rencana Belajar sudah lewat. Perbarui tanggalnya agar hitungan waktu akurat.')
  else steps.push('Isi tanggal ujian di Rencana Belajar agar strategi bisa disesuaikan dengan sisa waktu.')
  if (rd.level === 'none') steps.push('Belum ada data jawaban. Mulai dengan 1 simulasi CAT agar kemampuan tiap subtes terukur, lalu ulangi analisis ini.')
  else {
    if (!rd.usedCat) steps.push('Perkiraan masih dari latihan biasa. Lakukan minimal 2 simulasi CAT penuh agar perkiraan lebih mendekati kondisi ujian.')
    for (const s of rd.sections) {
      if (s.estimate == null) steps.push(`${s.category}: belum ada data. Kerjakan latihan ${s.category} dulu.`)
      else if (s.gap < 0) steps.push(`${s.category}: perkiraan ${s.estimate} masih di bawah ambang referensi ${s.threshold} (kurang ${-s.gap}). Ini penentu utama karena setiap subtes harus mencapai ambang. Jadikan prioritas pertama.`)
      else if (s.gap < s.threshold * 0.1) steps.push(`${s.category}: perkiraan ${s.estimate}, hanya ${s.gap} di atas ambang ${s.threshold}. Rawan turun saat ujian; beri margin aman.`)
      else steps.push(`${s.category}: perkiraan ${s.estimate}, aman di atas ambang ${s.threshold}. Jaga lewat latihan singkat rutin.`)
    }
  }
  if (weak.length) steps.push(`Titik lemah terbesar: ${weak.slice(0, 3).map((w) => `${w.topic.name} (${w.text}, ${Math.round(w.acc * 100)}%)`).join('; ')}. Baca materi indikatornya lalu latih lewat "Latih indikator ini".`)
  if (untried.length) steps.push(`Indikator topik prioritas yang belum pernah dicoba: ${untried.map((u) => `${u.topic.name} - ${u.text}`).join('; ')}.`)
  if (top) steps.push(`Fokus seleksi: siapkan berkas dan syarat untuk "${top.v.jabatan}" di ${top.v.instansi} lebih dulu${top.v.tutup ? ` (penutupan ${top.v.tutup})` : ''}, lalu tentukan 1 sampai 2 cadangan. Dalam satu periode, umumnya hanya satu formasi yang bisa dipilih, jadi pilih yang paling selaras dengan jurusan dan kuota.`)
  steps.push('Setelah SKD, SKB biasanya menentukan peringkat akhir dan bobotnya berbeda tiap instansi. Pelajari materi SKB jabatan target sejak dini (tambahkan ke Rencana Belajar).')
  return steps
}

/** Ringkasan ringkas untuk dikirim ke model AI (tanpa data pribadi seperti nama atau email). */
export function agentBrief({ agent, rd, weak, untried, plan, eligible, excluded }) {
  return JSON.stringify({
    profil: { jurusan: agent.major, jenjang: agent.degree, preferensi_lokasi: agent.location || null },
    sisa_hari_ke_ujian: daysUntil(plan?.examDate),
    kesiapan_skd: { sumber: rd.source, subtes: rd.sections.map((s) => ({ subtes: s.category, perkiraan: s.estimate, ambang_referensi: s.threshold, maks: s.max, jumlah_jawaban: s.n })) },
    ambang_catatan: 'Ambang dari referensi pola 2024, belum diverifikasi untuk 2026.',
    titik_lemah: weak.map((w) => ({ topik: w.topic.name, indikator: w.text, akurasi_persen: Math.round(w.acc * 100), jumlah_jawaban: w.n })),
    indikator_belum_dicoba: untried.map((u) => ({ topik: u.topic.name, indikator: u.text })),
    lowongan_layak: eligible.slice(0, 8).map((e, i) => ({ peringkat: i + 1, instansi: e.v.instansi, jabatan: e.v.jabatan, lokasi: e.v.lokasi, jenis_formasi: e.v.jenis, kuota: e.v.kuota, pelamar: e.v.pelamar, kelinearan: e.lin.label, persaingan: e.comp.label, nilai_gabungan: e.score, kelompok: e.tier, tutup: e.v.tutup || null, catatan: e.v.catatan || null })),
    jumlah_lowongan_tidak_layak: excluded.length,
  })
}

export const AGENT_SYSTEM = `Anda adalah agen penasihat seleksi CPNS untuk satu pengguna. Anda menerima ringkasan JSON yang sudah dihitung aplikasi (kemampuan, titik lemah, dan daftar lowongan yang diunggah pengguna). Tugas: menjelaskan dan menyusun saran strategi dalam bahasa Indonesia.
Aturan keras:
- Gunakan HANYA data dalam ringkasan. Jangan menambah lowongan, kuota, jumlah pelamar, tanggal, nilai ambang, atau aturan seleksi yang tidak ada di sana. Bila perlu informasi lain, katakan bahwa pengguna harus memeriksa pengumuman resmi (portal SSCASN/instansi).
- Nilai ambang dan perkiraan skor adalah referensi internal, bukan standar resmi 2026. Jangan menyatakan pengguna pasti lulus atau tidak lulus; jelaskan sebagai perkiraan dan sebut ketidakpastiannya.
- Kelinearan jurusan di ringkasan adalah pencocokan teks otomatis; ingatkan pengguna mencocokkannya dengan daftar resmi pada pengumuman formasi.
- Format: judul bagian diawali "## ", butir diawali "- ". Tanpa tabel. Bagian: "## Gambaran kemampuan", "## Rekomendasi lowongan" (untuk tiap lowongan teratas: alasan, peluang, kecocokan jurusan, risiko), "## Strategi langkah demi langkah" (urut waktu, konkret, tautkan ke titik lemah), "## Hal yang perlu Anda pastikan".
- Ringkas dan praktis, maksimal sekitar 450 kata.`
