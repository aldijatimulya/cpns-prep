// SVG berasal dari data soal milik sendiri (pembangkit kode), bukan input pengguna.
// Jangan memasukkan SVG dari sumber yang tidak tepercaya ke data soal.

export function StemFigure({ q }) {
  if (!q.stem_svg) return null
  return (
    <div
      className="stemfig"
      role="img"
      aria-label={q.stem_alt || 'Gambar soal'}
      dangerouslySetInnerHTML={{ __html: q.stem_svg }}
    />
  )
}

export const hasFigureOptions = (q) => q.options.some((o) => o.svg)

export function OptionSvg({ o }) {
  return <span className="figwrap" aria-hidden="true" dangerouslySetInnerHTML={{ __html: o.svg }} />
}

/** Tampilan hanya-baca semua opsi gambar, untuk bank soal dan pembahasan. */
export function FigOptions({ q, chosen }) {
  return (
    <div className="figopts">
      {q.options.map((o) => (
        <div
          key={o.key}
          className={`figopt${q.answer === o.key ? ' right' : ''}${chosen === o.key ? ' picked' : ''}`}
          title={o.text}
        >
          <b>{o.key}</b>
          <OptionSvg o={o} />
        </div>
      ))}
    </div>
  )
}
