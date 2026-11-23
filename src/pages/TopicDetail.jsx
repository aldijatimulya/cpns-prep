import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen } from 'lucide-react'
import PageHero from '../components/ui/PageHero'
import { useStore } from '../contexts/StoreContext'
import { questionsForTopic, targetSeconds, topicById } from '../data'
import { pct, topicStats } from '../utils/stats'

export default function TopicDetail() {
  const { topicId } = useParams()
  const { state, setNote } = useStore()
  const topic = topicById[topicId]

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

      <section className="card">
        <h2>Indikator yang dipelajari</h2>
        <ul className="plain">
          {topic.indicators.map((i) => <li key={i}>{i}</li>)}
        </ul>
        <h3>Bentuk soal</h3>
        <p>{topic.question_types.join(' · ')}</p>
        <p className="muted">Target waktu internal: {targetSeconds[topic.category]} detik per soal.</p>
        <h3>Perkiraan prioritas: {topic.likelihood}</h3>
        <p className="muted">Dasar: {topic.likelihood_basis}. Ini perkiraan belajar, bukan data resmi.</p>
      </section>

      <section className="card">
        <h2>Latihan</h2>
        <p>{qs.length} soal tersedia · {s.answered} dijawab · akurasi {pct(s.accuracy)} · status {s.status}</p>
        {qs.length > 0
          ? <Link className="btn" to={`/practice?topic=${topic.id}`}>Latihan topik ini</Link>
          : <p className="muted">Belum ada soal untuk topik ini.</p>}
      </section>

      <section className="card">
        <h2>Materi</h2>
        <p className="muted">Teks materi untuk topik ini belum ditulis (tahap Learning Foundation, v1.0). Gunakan catatan di bawah untuk sementara.</p>
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
