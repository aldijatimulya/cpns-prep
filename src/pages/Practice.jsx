import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import TutorPanel from '../components/TutorPanel'
import { useStore } from '../contexts/StoreContext'
import {
  categories, isCorrect, maxPoints, pointsFor, questions, targetSeconds, topicById,
} from '../data'
import { fmtTime, pct, weakQuestionIds } from '../utils/stats'
import { FigOptions, OptionSvg, StemFigure, hasFigureOptions } from '../components/FigureQuestion'

const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function Practice() {
  const [session, setSession] = useState(null)
  const [result, setResult] = useState(null)

  if (result) {
    return <Result result={result} onAgain={() => { setResult(null); setSession(null) }} />
  }
  if (session) {
    return <Session session={session} onFinish={setResult} />
  }
  return <Setup onStart={setSession} />
}

function Setup({ onStart }) {
  const [params] = useSearchParams()
  const initialTopic = params.get('topic') && topicById[params.get('topic')] ? params.get('topic') : 'ALL'
  const [cat, setCat] = useState(initialTopic !== 'ALL' ? topicById[initialTopic].category : 'ALL')
  const [topic, setTopic] = useState(initialTopic)
  const [count, setCount] = useState(10)
  const [timed, setTimed] = useState(true)
  const [onlyVerified, setOnlyVerified] = useState(false)
  const [onlyWeak, setOnlyWeak] = useState(params.get('review') === '1')
  const { state } = useStore()
  const weakIds = useMemo(() => weakQuestionIds(state.attempts, state.bookmarks), [state.attempts, state.bookmarks])

  const topicsOfCat = categories.filter((c) => cat === 'ALL' || c.id === cat).flatMap((c) => c.topics)
  const pool = questions.filter(
    (q) =>
      (cat === 'ALL' || q.category === cat) &&
      (topic === 'ALL' || q.topic_id === topic) &&
      (!onlyVerified || state.verified.includes(q.id)) &&
      (!onlyWeak || weakIds.has(q.id)),
  )
  const n = Math.min(Math.max(1, count), pool.length)
  const estimate = pool.slice(0, n).reduce((s, q) => s + targetSeconds[q.category], 0)

  const start = () => {
    const picked = shuffle(pool).slice(0, n)
    const totalSec = picked.reduce((s, q) => s + targetSeconds[q.category], 0)
    onStart({ id: `s-${Date.now()}`, questions: picked, totalSec, timed, cat, topic, startedAt: Date.now() })
  }

  return (
    <>
      <header className="page-head">
        <h1>Latihan</h1>
        <p>Pilih cakupan, lalu kerjakan dengan batas waktu agar terbiasa dengan tempo ujian.</p>
      </header>
      <section className="card form">
        <label>Kategori
          <select value={cat} onChange={(e) => { setCat(e.target.value); setTopic('ALL') }}>
            <option value="ALL">Semua</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.id} · {c.name}</option>)}
          </select>
        </label>
        <label>Topik
          <select value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option value="ALL">Semua topik</option>
            {topicsOfCat.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        <label>Jumlah soal (tersedia {pool.length})
          <input type="number" min="1" max={Math.max(1, pool.length)} value={count}
            onChange={(e) => setCount(Number(e.target.value) || 1)} />
        </label>
        <label className="check">
          <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} />
          Pakai batas waktu {pool.length ? `(≈ ${fmtTime(estimate)})` : ''}
        </label>
        <label className="check">
          <input type="checkbox" checked={onlyVerified} onChange={(e) => setOnlyVerified(e.target.checked)} />
          Hanya soal yang sudah saya verifikasi
        </label>
        <label className="check">
          <input type="checkbox" checked={onlyWeak} onChange={(e) => setOnlyWeak(e.target.checked)} />
          Ulasan: hanya soal yang terakhir salah, ragu-ragu, atau saya tandai ({weakIds.size})
        </label>
        <button className="btn" disabled={pool.length === 0} onClick={start}>
          {pool.length === 0 ? 'Belum ada soal' : `Mulai (${n} soal)`}
        </button>
      </section>
    </>
  )
}

function Session({ session, onFinish }) {
  const { addAttempt } = useStore()
  const { questions: qs, totalSec, timed } = session
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState({})
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
        seconds: Math.round(times.current[q.id] ?? 0),
      }
    })
    const attempt = {
      id: session.id,
      date: new Date().toISOString(),
      scope: { category: session.cat, topic: session.topic },
      timed,
      duration_sec: Math.round((Date.now() - session.startedAt) / 1000),
      items,
    }
    addAttempt(attempt)
    onFinish(attempt)
  }, [answers, addAttempt, flushTime, index, onFinish, qs, session, timed])

  const finishRef = useRef(finish)
  useEffect(() => { finishRef.current = finish }, [finish])

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const remaining = totalSec - (now - session.startedAt) / 1000
  useEffect(() => {
    if (timed && remaining <= 0) finishRef.current()
  }, [timed, remaining])

  const go = (i) => {
    if (i < 0 || i >= qs.length) return
    flushTime(index)
    setIndex(i)
  }

  const q = qs[index]
  const answeredCount = Object.keys(answers).length

  return (
    <>
      <div className="session-bar card">
        <span>Soal {index + 1} / {qs.length}</span>
        <span>Dijawab {answeredCount}</span>
        {timed && (
          <span className={remaining < 60 ? 'timer warn' : 'timer'} role="timer" aria-live="off">
            {fmtTime(remaining)}
          </span>
        )}
      </div>

      <section className="card">
        <small>{q.category} · {topicById[q.topic_id]?.name}</small>
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
          {index < qs.length - 1
            ? <button className="btn" onClick={() => go(index + 1)}>Berikutnya</button>
            : <button className="btn" onClick={finish}>Selesai dan lihat hasil</button>}
        </div>
      </section>

      <section className="card">
        <div className="qgrid" aria-label="Navigasi soal">
          {qs.map((x, i) => (
            <button
              key={x.id}
              aria-label={`Soal ${i + 1}${answers[x.id] ? ', dijawab' : ''}`}
              className={`${i === index ? 'cur' : ''} ${answers[x.id] ? 'done' : ''}`}
              onClick={() => go(i)}
            >{i + 1}</button>
          ))}
        </div>
        <button className="link-btn" onClick={() => { if (window.confirm('Akhiri sesi sekarang?')) finish() }}>
          Akhiri sesi
        </button>
      </section>
    </>
  )
}

function Result({ result, onAgain }) {
  const [detailed, setDetailed] = useState(false)
  const byId = useMemo(() => Object.fromEntries(questions.map((q) => [q.id, q])), [])
  const points = result.items.reduce((s, i) => s + i.points, 0)
  const max = result.items.reduce((s, i) => s + i.max, 0)
  const answered = result.items.filter((i) => i.chosen).length
  const right = result.items.filter((i) => i.correct).length

  return (
    <>
      <header className="page-head">
        <h1>Hasil latihan</h1>
        <p>Waktu {fmtTime(result.duration_sec)} · {answered} dari {result.items.length} dijawab</p>
      </header>
      <section className="cards">
        <div className="card metric"><span>Skor</span><strong>{points} / {max}</strong></div>
        <div className="card metric"><span>Akurasi</span><strong>{pct(max ? points / max : null)}</strong></div>
        <div className="card metric"><span>Jawaban terbaik</span><strong>{right}</strong><small>dari {result.items.length}</small></div>
      </section>
      <div className="row actions">
        <button className="btn" onClick={onAgain}>Latihan lagi</button>
        <Link className="btn ghost" to="/">Dashboard</Link>
        <label className="check">
          <input type="checkbox" checked={detailed} onChange={(e) => setDetailed(e.target.checked)} />
          Pembahasan rinci
        </label>
      </div>
      <ul className="qlist">
        {result.items.map((it, n) => {
          const q = byId[it.qid]
          const best = q.answer ?? [...q.options].sort((a, b) => b.score - a.score)[0].key
          return (
            <li key={it.qid} className={`card review ${it.correct ? 'ok' : it.chosen ? 'bad' : 'skip'}`}>
              <small>{n + 1}. {topicById[it.topic_id]?.name} · {it.seconds} dtk · {it.points}/{it.max} poin</small>
              <p className="stem">{q.stem}</p>
              <StemFigure q={q} />
              {hasFigureOptions(q) && <FigOptions q={q} chosen={it.chosen} />}
              <p>
                Jawaban Anda: <b>{it.chosen ?? 'kosong'}</b> · {q.answer ? 'Kunci' : 'Opsi terbaik'}: <b>{best}</b>
              </p>
              <p>{detailed ? q.explanation.detailed : q.explanation.quick}</p>
              <TutorPanel q={q} chosen={it.chosen} />
            </li>
          )
        })}
      </ul>
    </>
  )
}
