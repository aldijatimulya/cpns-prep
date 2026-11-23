import { Link } from 'react-router-dom'
import { examConfig } from '../data'
import { heatmap, pct, sectionScores } from '../utils/stats'

const WEAK = 0.6

// Warna tetap (tidak mengikuti tema) agar kontras teks terjaga; teks selalu gelap.
// Sel lemah (< 60%) memakai pola garis dan huruf tebal, jadi tidak hanya mengandalkan warna.
function cell(acc) {
  if (acc == null) return { className: 'heat-empty', style: undefined }
  if (acc < WEAK) return { className: 'heat-weak', style: undefined }
  return { className: 'heat-ok', style: { background: `hsl(170 45% ${95 - acc * 45}%)` } }
}

const fmtDate = (iso) => new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })

export function Heatmap({ attempts }) {
  const hm = heatmap(attempts)
  return (
    <section className="card">
      <h2>Heatmap kelemahan</h2>
      {hm.rows.length === 0 ? (
        <p className="muted">Belum ada data. Selesaikan satu sesi latihan atau simulasi agar heatmap terisi.</p>
      ) : (
        <>
          <p className="muted">Baris diurutkan dari topik terlemah. Kolom: {hm.cols.length} sesi terakhir. Sel bergaris = akurasi di bawah {WEAK * 100}%.</p>
          <div className="table-wrap">
            <table className="heat">
              <thead>
                <tr>
                  <th>Topik</th>
                  {hm.cols.map((c) => (
                    <th key={c.n}>#{c.n}{c.kind === 'cat' ? ' CAT' : ''}<small>{fmtDate(c.date)}</small></th>
                  ))}
                  <th>Total</th>
                  <th>Detik/soal</th>
                </tr>
              </thead>
              <tbody>
                {hm.rows.map((r) => (
                  <tr key={r.topic.id}>
                    <th scope="row"><Link to={`/learn/${r.topic.id}`}>{r.topic.name}</Link><small>{r.topic.category}</small></th>
                    {r.cells.map((c, i) => {
                      const k = cell(c.acc)
                      return (
                        <td key={i} className={k.className} style={k.style}
                          title={c.acc == null ? 'Tidak ada soal' : `${c.n} soal, akurasi ${pct(c.acc)}`}>
                          {c.acc == null ? '·' : pct(c.acc)}
                        </td>
                      )
                    })}
                    <td className={cell(r.acc).className} style={cell(r.acc).style}><strong>{pct(r.acc)}</strong></td>
                    <td>{r.avgSec == null ? '–' : `${Math.round(r.avgSec)} / ${r.target}`}{r.slow ? ' lambat' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted foot">Detik/soal: rata-rata Anda / target internal. "lambat" bila lebih dari 125% target.</p>
        </>
      )}
    </section>
  )
}

export function CatHistory({ attempts }) {
  const cats = attempts.filter((a) => a.kind === 'cat')
  if (cats.length === 0) return null
  return (
    <section className="card">
      <h2>Riwayat simulasi CAT</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Tanggal</th>{examConfig.sections.map((s) => <th key={s.category}>{s.category}</th>)}<th>Total</th><th>Durasi</th></tr>
          </thead>
          <tbody>
            {[...cats].reverse().map((a) => {
              const sc = sectionScores(a)
              let total = 0
              return (
                <tr key={a.id}>
                  <td>{fmtDate(a.date)}{a.partial ? ' *' : ''}</td>
                  {examConfig.sections.map((s) => {
                    const x = sc[s.category]
                    if (!x) return <td key={s.category}>–</td>
                    total += x.points
                    const ok = x.points >= (a.thresholds?.[s.category]?.value ?? Infinity)
                    return <td key={s.category}>{x.points}/{x.max} {ok ? '✓' : ''}</td>
                  })}
                  <td><strong>{total}</strong></td>
                  <td>{Math.round(a.duration_sec / 60)} mnt</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="muted foot">✓ = mencapai ambang batas referensi 2024. * = set diperkecil, ambang batas diskalakan.</p>
    </section>
  )
}
