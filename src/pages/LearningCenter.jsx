import { Link } from 'react-router-dom'
import { categories, curriculum, questionsForTopic } from '../data'

export default function LearningCenter() {
  return (
    <>
      <header className="page-head">
        <h1>Materi</h1>
        <p>Peta belajar SKD v{curriculum.version}. {curriculum.disclaimer}</p>
      </header>
      {categories.map((c) => (
        <section key={c.id}>
          <h2 className="section-title">{c.id} <span className="muted">· {c.name} · {c.questions_in_exam} soal di ujian (referensi)</span></h2>
          <div className="grid">
            {c.topics.map((t) => (
              <Link key={t.id} to={`/learn/${t.id}`} className="card topic-card">
                <div className="row">
                  <strong>{t.name}</strong>
                  <span className={`pill pr-${t.priority}`}>{t.priority}</span>
                </div>
                <small>{t.group}{t.official_blueprint ? '' : ' · pendukung'}</small>
                <small className={`lk-${t.likelihood}`}>perkiraan prioritas: {t.likelihood}</small>
                <small>{questionsForTopic(t.id).length} soal tersedia</small>
              </Link>
            ))}
          </div>
        </section>
      ))}
      <section className="card muted-card">
        <strong>SKB</strong>
        <p>Materi SKB bergantung pada jabatan dan instansi. Modul ini dibuka setelah jabatan target dipilih.</p>
      </section>
    </>
  )
}
