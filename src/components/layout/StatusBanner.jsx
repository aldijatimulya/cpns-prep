import { Info } from 'lucide-react'
import { examConfig } from '../../data'

export default function StatusBanner() {
  if (examConfig.status !== 'official_kepmen_674_2026') return null
  return (
    <div className="banner" role="note">
      <Info size={18} aria-hidden="true" />
      <p>
        <strong>Mengacu Kepmenpan-RB No. 674 Tahun 2026.</strong> Komposisi SKD dan nilai ambang batas sudah sesuai SK.
        Bobot SKD:SKB, materi SKB, dan aturan hasil akhir (Permenpan-RB 18/2026) belum tercakup. Soal di aplikasi ini
        berstatus <em>draft</em> sampai Anda verifikasi.
      </p>
    </div>
  )
}
