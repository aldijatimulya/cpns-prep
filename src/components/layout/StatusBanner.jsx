import { AlertTriangle } from 'lucide-react'
import { examConfig } from '../../data'

export default function StatusBanner() {
  if (examConfig.status !== 'reference_unverified_2026') return null
  return (
    <div className="banner" role="note">
      <AlertTriangle size={18} aria-hidden="true" />
      <p>
        <strong>Angka ujian masih referensi pola 2024.</strong> Jumlah soal, durasi, dan nilai ambang batas
        belum diumumkan resmi untuk 2026. Pantau sscasn.bkn.go.id dan menpan.go.id. Soal di aplikasi ini
        berstatus <em>draft</em> sampai Anda verifikasi.
      </p>
    </div>
  )
}
