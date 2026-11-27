import { CircleHelp } from 'lucide-react'
import PageHero from '../components/ui/PageHero'

const faqs = [
  {
    q: 'Dari mana mulai belajar?',
    a: 'Buka Bank Soal dan verifikasi soal ke sumber resmi, baca topik berlabel prioritas tinggi di Materi, lalu kerjakan Latihan per topik 10 sampai 20 soal. Simulasi CAT cukup seminggu sekali, lalu lebih sering mendekati ujian.',
  },
  {
    q: 'Apakah data belajar saya tersimpan?',
    a: 'Jika Anda masuk dengan akun email, riwayat latihan, catatan, penanda, dan rencana tersimpan di akun dan bisa dibuka dari perangkat mana pun. Lencana "Tersimpan" di kanan atas menandakan semuanya sudah terkirim. Pada mode tamu, data hanya ada di browser ini dan hilang bila data situs dibersihkan.',
  },
  {
    q: 'Saya lupa password.',
    a: 'Di halaman masuk, klik "Lupa Password?", masukkan email Anda, lalu buka tautan yang dikirim untuk membuat password baru. Cek folder spam bila email tidak muncul.',
  },
  {
    q: 'Email konfirmasi tidak datang.',
    a: 'Tunggu beberapa menit dan cek folder spam. Bila tetap tidak ada, coba daftar ulang dengan email yang sama atau hubungi pengelola aplikasi ini.',
  },
  {
    q: 'Bagaimana pindah dari mode tamu ke akun?',
    a: 'Daftar atau masuk dengan email. Bila ada data tamu di browser ini, Anda akan ditawari untuk menggabungkannya ke akun. Cadangan JSON di Pengaturan juga bisa diimpor kapan saja.',
  },
  {
    q: 'Seberapa akurat soal dan ambang batasnya?',
    a: 'Semua soal berstatus draft buatan sendiri sampai Anda memverifikasinya. Komposisi ujian (110 soal, 100 menit) dan ambang batas (umum: TWK 65, TIU 80, TKP 166; khusus: kumulatif 311/286 dan TIU 85/60) berasal dari Kepmenpan-RB No. 674 Tahun 2026. Isi soal tetap buatan sendiri karena SK hanya memuat aspek dan tujuan tiap subtes. Skor simulasi hanyalah alat ukur belajar, bukan prediksi kelulusan. Cek ketentuan terbaru di sscasn.bkn.go.id.',
  },
  {
    q: 'Apakah ini aplikasi resmi pemerintah?',
    a: 'Bukan. CPNS Prep adalah alat bantu belajar pribadi dan tidak berafiliasi dengan BKN, KemenPANRB, atau instansi mana pun.',
  },
  {
    q: 'Tampilan lama masih muncul setelah update.',
    a: 'Aplikasi menyimpan cache untuk mode offline. Muat ulang keras dengan Ctrl+Shift+R, atau tutup dan buka kembali tab.',
  },
]

export default function Help() {
  return (
    <>
      <PageHero
        art="books"
        kicker={<><CircleHelp size={16} aria-hidden="true" /> Bantuan</>}
        title="Bantuan"
        text="Jawaban singkat untuk pertanyaan yang paling sering muncul."
      />
      <section className="card faq">
        {faqs.map((f) => (
          <details key={f.q}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </section>
    </>
  )
}
