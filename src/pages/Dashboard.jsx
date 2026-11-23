import { Link } from 'react-router-dom'
import StatusBanner from '../components/layout/StatusBanner'
import { useStore } from '../contexts/StoreContext'
import { categories, examConfig, masteredAccuracy, questions, topics } from '../data'
import { overall, pct, topicStats } from '../utils/stats'
import { CatHistory, Heatmap } from '../components/Heatmap'

const statusClass = {
  'Not Started': 'st-none',
  Learning: 'st-learn',
  'Needs Improvement': 'st-weak',
  Mastered: 'st-ok',
}

export default function Dashboard() {
  const { state } = useStore()
  const ov = overall(state.attempts)
  const stats = topicStats(state.attempts)

  const allTopics = topics
  const weakest = allTopics
    .filter((t) => stats[t.id].accuracy != null && stats[t.id].status !== 'Mastered')
    .sort((a, b) => stats[a.id].accuracy - stats[b.id].accuracy)
    .slice(0, 3)
  const untouched = allTopics
    .filter((t) => stats[t.id].answered === 0 && t.priority === 'high' && questions.some((q) => q.topic_id === t.id))
    .slice(0, 3)
  const recs = weakest.length ? weakest : untouched

  return (
    <>
      <header className="page-head">
        <h1>Dashboard</h1>
        <p>Ringkasan latihan dan prioritas belajar Anda.</p>
      </header>
      <StatusBanner />

      <section className="cards" aria-label="Ringkasan">
        <div className="card metric"><span>Sesi latihan</span><strong>{ov.sessions}</strong></div>
        <div className="card metric"><span>Soal dijawab</span><strong>{ov.answered}</strong></div>
        <div className="card metric"><span>Akurasi keseluruhan</span><strong>{pct(ov.accuracy)}</strong></div>
        <div className="card metric"><span>Soal tersedia</span><strong>{questions.length}</strong><small>draft, perlu verifikasi</small></div>
      </section>

      <section className="card">
        <h2>Prioritas belajar</h2>
        {recs.length === 0 ? (
          <p className="muted">Belum ada data. Mulai satu sesi latihan agar rekomendasi muncul.</p>
        ) : (
          <ul className="rec-list">
            {recs.map((t) => (
              <li key={t.id}>
                <div>
                  <strong>{t.name}</strong>
                  <small>{t.category} · {stats[t.id].accuracy != null ? `akurasi ${pct(stats[t.id].accuracy)}` : 'belum dicoba'}</small>
                </div>
                <Link className="btn small" to={`/practice?topic=${t.id}`}>Latih</Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Heatmap attempts={state.attempts} />
      <CatHistory attempts={state.attempts} />

      {categories.map((c) => (
        <section className="card" key={c.id}>
          <h2>{c.id} <span className="muted">· {c.name}</span></h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Topik</th><th>Dijawab</th><th>Akurasi</th><th>Status</th></tr>
              </thead>
              <tbody>
                {c.topics.map((t) => {
                  const s = stats[t.id]
                  return (
                    <tr key={t.id}>
                      <td><Link to={`/learn/${t.id}`}>{t.name}</Link></td>
                      <td>{s.answered}</td>
                      <td>
                        <div className="bar" aria-label={`Akurasi ${pct(s.accuracy)}`}>
                          <span style={{ width: `${(s.accuracy ?? 0) * 100}%` }} />
                          <i style={{ left: `${masteredAccuracy * 100}%` }} title="Target internal" />
                        </div>
                        <small>{pct(s.accuracy)}</small>
                      </td>
                      <td><span className={`pill ${statusClass[s.status]}`}>{s.status}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
      <p className="muted foot">
        Target internal Mastered: akurasi ≥ {masteredAccuracy * 100}% (≥10 jawaban, ≥2 sesi). Bukan standar
        kelulusan resmi. Ambang batas referensi: TWK {examConfig.sections[0].threshold}, TIU {examConfig.sections[1].threshold}, TKP {examConfig.sections[2].threshold}.
      </p>
    </>
  )
}
