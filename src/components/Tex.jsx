import { useEffect, useState } from 'react'

// KaTeX dimuat saat pertama dibutuhkan (tidak membebani halaman lain). Output KaTeX aman: trust dimatikan.
let katexPromise = null
let katexReady = null
const loadKatex = () => (katexPromise ??= Promise.all([import('katex'), import('katex/dist/katex.min.css')]).then(([m]) => (katexReady = m.default ?? m)))

export function renderTex(katex, src, display) {
  return katex.renderToString(src, { displayMode: display, throwOnError: false, strict: 'ignore', trust: false, maxExpand: 1000, maxSize: 20, output: 'html' })
}

// Hasil render disimpan agar rumus yang sama tidak dihitung ulang saat daftar soal dibuka-tutup.
const cache = new Map()
const renderCached = (katex, src, display) => {
  const key = `${display ? 'D' : 'I'}${src}`
  let html = cache.get(key)
  if (html === undefined) { html = renderTex(katex, src, display); cache.set(key, html) }
  return html
}

export default function Tex({ src, display = false }) {
  const [katex, setKatex] = useState(katexReady)
  useEffect(() => {
    if (katex) return undefined
    let alive = true
    loadKatex().then((k) => { if (alive) setKatex(k) }).catch(() => {})
    return () => { alive = false }
  }, [katex])
  const Tag = display ? 'div' : 'span'
  if (!katex) return <Tag className={display ? 'tex-block tex-raw' : 'tex-raw'}>{src}</Tag>
  return <Tag className={display ? 'tex-block' : 'tex-inline'} dangerouslySetInnerHTML={{ __html: renderCached(katex, src, display) }} />
}
