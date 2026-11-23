import { Link } from 'react-router-dom'
import { Brain, Landmark, Users } from 'lucide-react'
import { categories, curriculum, questionsForTopic } from '../data'

const meta = {
  TWK: { icon: Landmark, cls: 'c-twk', blurb: 'Pancasila, UUD 1945, nasionalisme, bahasa, dan wawasan kebangsaan.' },
  TIU: { icon: Brain, cls: 'c-tiu', blurb: 'Verbal, numerik, dan figural. Dilatih lewat tempo dan pola.' },
  TKP: { icon: Users, cls: 'c-tkp', blurb: 'Pelayanan publik, jejaring kerja, sosial budaya, TIK, profesionalisme.' },
}

export default function LearningCenter() {
  return (
    <>
      <header className="page-head">
        <h1>Materi</h1>
        <p>Peta belajar SKD v{curriculum.version}. {curriculum.disclaimer}</p>
      </header>
      <section className="catcards" aria-label="Kategori">
        {categories.map((c) => {
          const m = meta[c.id] ?? meta.TWK
          const Icon = m.icon
          const n = c.topics.reduce((a, t) => a + questionsForTopic(t.id).length, 0)
          return (
            <a key={c.id} href={`#cat-${c.id}`} className={`catcard ${m.cls}`}>
              <span className="catico"><Icon size={26} aria-hidden="true" /></span>
              <strong>{c.id}</strong>
              <span>{c.name}</span>
              <small>{c.topics.length} topik · {n} soal · {c.questions_in_exam} soal di ujian (referensi)</small>
              <em>{m.blurb}</em>
            </a>
          )
        })}
      </section>
      {categories.map((c) => (
        <section key={c.id} id={`cat-${c.id}`}>
          <h2 className="section-title">{c.id} <span className="muted">· {c.name}</span></h2>
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
        <p>Materi SKB bergantung pada jabatan dan instansi. Modul ini dibuka setelah jabatan target dipilih. Sementara itu, catat materi SKB Anda di menu Rencana.</p>
      </section>
    </>
  )
}
