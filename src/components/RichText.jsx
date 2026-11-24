// Teks biasa dengan rumus LaTeX: $...$ (sebaris) dan $$...$$ (baris sendiri).
// Teks di luar tanda $ tampil apa adanya (tanpa Markdown), jadi aman dipakai untuk materi dan soal.
import Tex from './Tex'

const MATH = /\$\$[\s\S]+?\$\$|\$(?=\S)[^$\n]*?\S\$(?!\d)/g

export default function RichText({ text }) {
  const s = text == null ? '' : String(text)
  if (!s.includes('$')) return <>{s}</>
  const out = []
  let last = 0
  let n = 0
  for (const m of s.matchAll(MATH)) {
    if (m.index > last) out.push(s.slice(last, m.index))
    const t = m[0]
    const display = t.startsWith('$$')
    out.push(<Tex key={n++} src={(display ? t.slice(2, -2) : t.slice(1, -1)).trim()} display={display} />)
    last = m.index + t.length
  }
  if (last < s.length) out.push(s.slice(last))
  return <>{out}</>
}
