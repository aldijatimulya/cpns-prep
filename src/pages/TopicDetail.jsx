import { useEffect, useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, BookOpen, Lightbulb, ListChecks } from 'lucide-react'
import PageHero from '../components/ui/PageHero'
import RichText from '../components/RichText'
import { useStore } from '../contexts/StoreContext'
import { materiFor, questionById, questionsForIndicator, questionsForTopic, targetSeconds, topicById } from '../data'
import { pct, topicStats } from '../utils/stats'

export default function TopicDetail() {
  const { topicId } = useParams()
  const [params] = useSearchParams()
  const focus = params.get('i')
  const { state, setNote } = useStore()
  const topic = topicById[topicId]
  const materi = topic ? materiFor(topic.id) : null

  // Akurasi per indikator dari riwayat latihan (soal -> indikator lewat bank soal).
  const perInd = useMemo(() => {
    const m = {}
    if (!topic) return m
    for (const a of state.attempts) {
      for (const it of a.items) {
        if (it.topic_id !== topic.id || it.chosen == null) continue
        const i = questionById[it.qid]?.indicator
        if (i == null) continue
        m[i] ??= { n: 0, pts: 0, max: 0 }
        m[i].n += 1; m[i].pts += it.points; m[i].max += it.max
      }
    }
    return m
  }, [state.attempts, topic])

  useEffect(() => {
    if (focus == null) return
    const el = document.getElementById(`ind-${focus}`)
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
  }, [focus, topicId])

  if (!topic) {
    return (
      <>
        <h1>Topik tidak ditemukan</h1>
        <Link to="/learn">Kembali ke Materi</Link>
      </>
    )
  }
  const qs = questionsForTopic(topic.id)
  const s = topicStats(state.attempts)[topic.id]

  return (
    <>
      <PageHero
        art="books"
        kicker={<><BookOpen size={16} aria-hidden="true" /> {topic.category}</>}
        title={topic.name}
        text={`${topic.category} · ${topic.group} · prioritas ${topic.priority}`}
        actions={<Link className="btn light" to="/learn"><ArrowLeft size={16} aria-hidden="true" /> Kembali ke Materi</Link>}
      />

      {topic.note && <div className="banner" role="note"><p>{topic.note}</p></div>}

      {materi && (
        <section className="card">
          <h2>Ringkasan</h2>
          <p><RichText text={materi.ringkasan} /></p>
          <p className="muted">Materi ini draft buatan sendiri dan belum diverifikasi terhadap sumber resmi. Cek ulang pasal, tanggal, dan angka sebelum dihafal.</p>
        </section>
      )}

      {topic.indicators.map((text, i) => {
        const m = materi?.indikator?.[i]
        const list = questionsForIndicator(topic.id, i)
        const st = perInd[i]
        return (
          <section key={i} id={`ind-${i}`} className={`card ind-card${String(i) === focus ? ' focus' : ''}`}>
            <div className="ind-head">
              <span className="ind-no">{i + 1}</span>
              <div>
                <small className="muted">Indikator kisi-kisi</small>
                <h2>{text}</h2>
              </div>
            </div>
            {m ? (
              <ul className="plain ind-points">{m.poin.map((p) => <li key={p}><RichText text={p} /></li>)}</ul>
            ) : (
              <p className="muted">Materi untuk indikator ini belum ditulis.</p>
            )}
            {m?.contoh && (
              <div className="ind-example">
                <strong>Contoh</strong>
                <p><RichText text={m.contoh.soal} /></p>
                <p><b>Jawab:</b> <RichText text={m.contoh.jawab} /></p>
              </div>
            )}
            <div className="ind-foot">
              <span><ListChecks size={16} aria-hidden="true" /> {list.length} soal terikat · {st ? `${st.n} dijawab, akurasi ${pct(st.max ? st.pts / st.max : null)}` : 'belum dicoba'}</span>
              {list.length > 0 && <Link className="btn small" to={`/practice?topic=${topic.id}&ind=${i}`}>Latih indikator ini</Link>}
              {list.length > 0 && <Link className="btn small ghost" to="/bank">Lihat di Bank Soal</Link>}
            </div>
          </section>
        )
      })}

      {materi?.fakta?.length > 0 && (
        <section className="card">
          <h2><Lightbulb size={18} className="ico-teal" aria-hidden="true" /> Fakta kunci</h2>
          <table className="facts">
            <tbody>{materi.fakta.map(([k, v]) => <tr key={k}><th scope="row">{k}</th><td><RichText text={v} /></td></tr>)}</tbody>
          </table>
        </section>
      )}

      {materi?.jebakan?.length > 0 && (
        <section className="card">
          <h2><AlertTriangle size={18} className="ico-warn" aria-hidden="true" /> Jebakan umum</h2>
          <ul className="plain">{materi.jebakan.map((j) => <li key={j}><RichText text={j} /></li>)}</ul>
        </section>
      )}

      <section className="card">
        <h2>Latihan topik</h2>
        <p>{qs.length} soal tersedia · {s.answered} dijawab · akurasi {pct(s.accuracy)} · status {s.status}</p>
        <p className="muted">Bentuk soal: {topic.question_types.join(' · ')}. Target waktu internal {targetSeconds[topic.category]} detik per soal. Perkiraan prioritas {topic.likelihood} ({topic.likelihood_basis}); ini perkiraan belajar, bukan data resmi.</p>
        {qs.length > 0
          ? <Link className="btn" to={`/practice?topic=${topic.id}`}>Latihan semua indikator</Link>
          : <p className="muted">Belum ada soal untuk topik ini.</p>}
        {materi?.sumber?.length > 0 && <p className="muted">Rujukan untuk verifikasi: {materi.sumber.join('; ')}.</p>}
      </section>

      <section className="card">
        <h2>Catatan saya</h2>
        <label className="sr-only" htmlFor="note">Catatan</label>
        <textarea
          id="note"
          rows={6}
          placeholder="Rumus, pasal kunci, jebakan umum..."
          value={state.notes[topic.id] ?? ''}
          onChange={(e) => setNote(topic.id, e.target.value)}
        />
      </section>
    </>
  )
}
