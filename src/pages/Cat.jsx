import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import TutorPanel from '../components/TutorPanel'
import HeroArt from '../components/ui/HeroArt'
import { useStore } from '../contexts/StoreContext'
import { examConfig, isCorrect, maxPoints, pointsFor, questions, topicById } from '../data'
import { catDurationSec, composeCat, thresholdFor } from '../utils/cat'
import { fmtTime, pct } from '../utils/stats'
import { FigOptions, OptionSvg, StemFigure, hasFigureOptions } from '../components/FigureQuestion'

export default function Cat() {
  const [session, setSession] = useState(null)
  const [result, setResult] = useState(null)
  if (result) return <CatResult result={result} onAgain={() => { setResult(null); setSession(null) }} />
  if (session) return <CatSession session={session} onFinish={setResult} />
  return <CatSetup onStart={setSession} />
}

function CatSetup({ onStart }) {
  const { state } = useStore()
  const [onlyVerified, setOnlyVerified] = useState(false)
  const pool = questions.filter((q) => !onlyVerified || state.verified.includes(q.id))
  const avail = Object.fromEntries(
    examConfig.sections.map((s) => [s.category, pool.filter((q) => q.category === s.category).length]),
  )
  const counts = examConfig.sections.map((s) => ({ ...s, n: Math.min(s.questions, avail[s.category]), avail: avail[s.category] }))
  const total = counts.reduce((a, c) => a + c.n, 0)
  const partial = counts.some((c) => c.n < c.questions)

  const start = () => {
    const comp = composeCat(pool)
    onStart({
      id: `cat-${Date.now()}`,
      ...comp,
      durationSec: catDurationSec(comp.questions.length),
      startedAt: Date.now(),
    })
  }

  return (
    <>
      <section className="hero sim">
        <div className="hero-text">
          <small className="hero-kicker">Simulasi</small>
          <h1>Simulasi CAT</h1>
          <p>Kerjakan satu set penuh dalam satu tarikan napas untuk melatih tempo dan ketahanan.</p>
          <ul className="ticks">
            <li>Waktu berjalan nyata, otomatis selesai saat habis</li>
            <li>Penilaian otomatis per subtes</li>
            <li>Pembahasan lengkap setelah selesai</li>
          </ul>
        </div>
        <HeroArt />
      </section>
      <div className="banner" role="note">
        <p>
          Komposisi dan ambang batas memakai <strong>referensi pola 2024</strong> (belum resmi untuk 2026).
          Pembagian subtopik di dalam tiap subtes adalah perkiraan belajar. Skor TKP memakai bobot ilustrasi,
          jadi hanya perkiraan kasar.
        </p>
      </div>
      <section className="card">
        <h2>Komposisi set ini</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Subtes</th><th>Soal</th><th>Tersedia</th><th>Ambang batas</th></tr></thead>
            <tbody>
              {counts.map((c) => {
                const t = thresholdFor(c, c.n)
                return (
                  <tr key={c.category}>
                    <td>{c.category}</td>
                    <td>{c.n} / {c.questions}</td>
                    <td>{c.avail}</td>
                    <td>{t.value}{t.approx ? ' (diskalakan)' : ''}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p>
          Total {total} soal · waktu {Math.round(catDurationSec(total) / 60)} menit.
          {partial
            ? ' Bank belum cukup untuk komposisi penuh, jadi set diperkecil proporsional dan ambang batas diskalakan (perkiraan).'
            : ' Komposisi penuh.'}
        </p>
        <label className="check">
          <input type="checkbox" checked={onlyVerified} onChange={(e) => setOnlyVerified(e.target.checked)} />
          Hanya soal yang sudah saya verifikasi
        </label>
        <p>
          <button className="btn" disabled={total === 0} onClick={start}>
            {total === 0 ? 'Belum ada soal' : `Mulai simulasi (${total} soal)`}
          </button>
        </p>
      </section>
    </>
  )
}

function CatSession({ session, onFinish }) {
  const { addAttempt } = useStore()
  const { questions: qs, durationSec } = session
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [flags, setFlags] = useState({})
  const [now, setNow] = useState(Date.now())
  const times = useRef({})
  const lastSwitch = useRef(Date.now())
  const finished = useRef(false)

  const flushTime = useCallback((i) => {
    const t = Date.now()
    const id = qs[i].id
    times.current[id] = (times.current[id] ?? 0) + (t - lastSwitch.current) / 1000
    lastSwitch.current = t
  }, [qs])

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true
    flushTime(index)
    const items = qs.map((q) => {
      const chosen = answers[q.id] ?? null
      return {
        qid: q.id,
        topic_id: q.topic_id,
        category: q.category,
        chosen,
        points: pointsFor(q, chosen),
        max: maxPoints(q),
        correct: isCorrect(q, chosen),
        flagged: !!flags[q.id],
        seconds: Math.round(times.current[q.id] ?? 0),
      }
    })
    const thresholds = Object.fromEntries(
      examConfig.sections.map((s) => [s.category, thresholdFor(s, session.sections[s.category].n)]),
    )
    const attempt = {
      id: session.id,
      kind: 'cat',
      date: new Date().toISOString(),
      scope: { category: 'ALL', topic: 'ALL' },
      timed: true,
      partial: session.partial,
      thresholds,
      duration_sec: Math.round((Date.now() - session.startedAt) / 1000),
      items,
    }
    addAttempt(attempt)
    onFinish(attempt)
  }, [addAttempt, answers, flags, flushTime, index, onFinish, qs, session])

  const finishRef = useRef(finish)
  useEffect(() => { finishRef.current = finish }, [finish])

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const remaining = durationSec - (now - session.startedAt) / 1000
  useEffect(() => {
    if (remaining <= 0) finishRef.current()
  }, [remaining])

  const go = (i) => {
    if (i < 0 || i >= qs.length || i === index) return
    flushTime(index)
    setIndex(i)
  }

  const q = qs[index]
  const answered = Object.keys(answers).length
  const flagged = Object.values(flags).filter(Boolean).length

  const endNow = () => {
    const blank = qs.length - answered
    const msg = `Akhiri simulasi sekarang? ${blank} soal belum dijawab, ${flagged} ditandai ragu-ragu.`
    if (window.confirm(msg)) finish()
  }

  return (
    <>
      <div className="session-bar card">
        <span>Soal {index + 1} / {qs.length}</span>
        <span>Dijawab {answered}</span>
        <span className={remaining < 300 ? 'timer warn' : 'timer'} role="timer" aria-live="off">
          {fmtTime(remaining)}
        </span>
      </div>

      <section className="card">
        <div className="row">
          <small>{q.category} · {topicById[q.topic_id]?.name}</small>
          <button
            className={flags[q.id] ? 'btn small' : 'btn small ghost'}
            aria-pressed={!!flags[q.id]}
            onClick={() => setFlags((f) => ({ ...f, [q.id]: !f[q.id] }))}
          >
            {flags[q.id] ? 'Ragu-ragu ✓' : 'Tandai ragu-ragu'}
          </button>
        </div>
        <p className="stem">{q.stem}</p>
        <StemFigure q={q} />
        <div className={hasFigureOptions(q) ? 'options fig' : 'options'} role="radiogroup" aria-label="Pilihan jawaban">
          {q.options.map((o) => (
            <button
              key={o.key}
              role="radio"
              aria-checked={answers[q.id] === o.key}
              aria-label={o.svg ? `Pilihan ${o.key}: ${o.text}` : undefined}
              className={answers[q.id] === o.key ? 'opt chosen' : 'opt'}
              onClick={() => setAnswers((a) => ({ ...a, [q.id]: o.key }))}
            >
              <b>{o.key}</b>
              {o.svg ? <OptionSvg o={o} /> : <span>{o.text}</span>}
            </button>
          ))}
        </div>
        <div className="row nav-row">
          <button className="btn ghost" onClick={() => go(index - 1)} disabled={index === 0}>Sebelumnya</button>
          <button className="btn" onClick={() => go(index + 1)} disabled={index === qs.length - 1}>Berikutnya</button>
        </div>
      </section>

      <section className="card">
        {examConfig.sections.map((s) => {
          const idxs = qs.map((x, i) => [x, i]).filter(([x]) => x.category === s.category)
          if (!idxs.length) return null
          return (
            <div key={s.category}>
              <small>{s.category}</small>
              <div className="qgrid" aria-label={`Navigasi soal ${s.category}`}>
                {idxs.map(([x, i]) => (
                  <button
                    key={x.id}
                    aria-label={`Soal ${i + 1}${answers[x.id] ? ', dijawab' : ', belum dijawab'}${flags[x.id] ? ', ragu-ragu' : ''}`}
                    className={`${i === index ? 'cur' : ''} ${answers[x.id] ? 'done' : ''} ${flags[x.id] ? 'flag' : ''}`}
                    onClick={() => go(i)}
                  >{i + 1}</button>
                ))}
              </div>
            </div>
          )
        })}
        <p className="muted legend">Terisi = dijawab · pojok bertanda = ragu-ragu · kosong = belum dijawab</p>
        <button className="btn danger" onClick={endNow}>Akhiri simulasi</button>
      </section>
    </>
  )
}

function CatResult({ result, onAgain }) {
  const [detailed, setDetailed] = useState(false)
  const [filter, setFilter] = useState('wrong')
  const byId = useMemo(() => Object.fromEntries(questions.map((q) => [q.id, q])), [])

  const secs = examConfig.sections.map((s) => {
    const its = result.items.filter((i) => i.category === s.category)
    const points = its.reduce((a, i) => a + i.points, 0)
    const max = its.reduce((a, i) => a + i.max, 0)
    const th = result.thresholds[s.category]
    return { s, n: its.length, points, max, th, ok: its.length === 0 ? null : points >= th.value }
  })
  const present = secs.filter((x) => x.n > 0)
  const total = present.reduce((a, x) => a + x.points, 0)
  const totalMax = present.reduce((a, x) => a + x.max, 0)
  const totalTh = present.reduce((a, x) => a + x.th.value, 0)
  const allOk = present.every((x) => x.ok)

  const topicRows = useMemo(() => {
    const m = {}
    for (const it of result.items) {
      const r = (m[it.topic_id] ??= { points: 0, max: 0, n: 0, wrong: 0 })
      r.points += it.points; r.max += it.max; r.n += 1
      if (!it.correct) r.wrong += 1
    }
    return Object.entries(m).map(([id, r]) => ({ id, ...r, acc: r.points / r.max })).sort((a, b) => a.acc - b.acc)
  }, [result])

  const shown = result.items.filter((i) =>
    filter === 'all' ? true : filter === 'flag' ? i.flagged : !i.correct,
  )

  return (
    <>
      <header className="page-head">
        <h1>Hasil simulasi CAT</h1>
        <p>Waktu {fmtTime(result.duration_sec)} · {result.items.filter((i) => i.chosen).length} dari {result.items.length} dijawab</p>
      </header>

      <section className="card">
        <h2>Skor per subtes</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Subtes</th><th>Skor</th><th>Ambang batas (ref.)</th><th>Status</th></tr></thead>
            <tbody>
              {secs.filter((x) => x.n > 0).map((x) => (
                <tr key={x.s.category}>
                  <td>{x.s.category}{x.s.category === 'TKP' ? ' *' : ''}</td>
                  <td>{x.points} / {x.max}</td>
                  <td>{x.th.value}{x.th.approx ? ' (diskalakan)' : ''}</td>
                  <td><span className={`pill ${x.ok ? 'st-ok' : 'st-weak'}`}>{x.ok ? 'Mencapai' : 'Belum mencapai'}</span></td>
                </tr>
              ))}
              <tr>
                <td><strong>Total</strong></td>
                <td><strong>{total} / {totalMax}</strong></td>
                <td>{totalTh}</td>
                <td><span className={`pill ${allOk ? 'st-ok' : 'st-weak'}`}>{allOk ? 'Semua subtes mencapai' : 'Ada subtes belum mencapai'}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="muted foot">
          Ambang batas ini referensi pola 2024. Mencapainya bukan jaminan lolos karena peringkat dalam kuota formasi
          yang menentukan. {result.partial && 'Set ini lebih kecil dari komposisi penuh, ambang batas diskalakan proporsional (perkiraan). '}
          * Skor TKP memakai bobot ilustrasi.
        </p>
      </section>

      <section className="card">
        <h2>Per topik (terlemah dulu)</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Topik</th><th>Soal</th><th>Akurasi</th></tr></thead>
            <tbody>
              {topicRows.map((r) => (
                <tr key={r.id}>
                  <td><Link to={`/learn/${r.id}`}>{topicById[r.id]?.name}</Link></td>
                  <td>{r.n}</td>
                  <td>{pct(r.acc)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="row actions">
        <button className="btn" onClick={onAgain}>Simulasi lagi</button>
        <Link className="btn ghost" to="/">Dashboard</Link>
        <label className="check">
          <input type="checkbox" checked={detailed} onChange={(e) => setDetailed(e.target.checked)} />
          Pembahasan rinci
        </label>
        <label>
          <span className="sr-only">Tampilkan</span>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="wrong">Salah atau kosong</option>
            <option value="flag">Ragu-ragu</option>
            <option value="all">Semua</option>
          </select>
        </label>
      </div>

      <ul className="qlist">
        {shown.length === 0 && <li className="card muted">Tidak ada soal pada filter ini.</li>}
        {shown.map((it) => {
          const q = byId[it.qid]
          const best = q.answer ?? [...q.options].sort((a, b) => b.score - a.score)[0].key
          return (
            <li key={it.qid} className={`card review ${it.correct ? 'ok' : it.chosen ? 'bad' : 'skip'}`}>
              <small>{topicById[it.topic_id]?.name} · {it.seconds} dtk · {it.points}/{it.max} poin{it.flagged ? ' · ragu-ragu' : ''}</small>
              <p className="stem">{q.stem}</p>
              <StemFigure q={q} />
              {hasFigureOptions(q) && <FigOptions q={q} chosen={it.chosen} />}
              <p>Jawaban Anda: <b>{it.chosen ?? 'kosong'}</b> · {q.answer ? 'Kunci' : 'Opsi terbaik'}: <b>{best}</b></p>
              <p>{detailed ? q.explanation.detailed : q.explanation.quick}</p>
              <TutorPanel q={q} chosen={it.chosen} />
            </li>
          )
        })}
      </ul>
    </>
  )
}
