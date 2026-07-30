import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_BASE } from '../utils/apiBase'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [sifre, setSifre]       = useState('')
  const [hata, setHata]         = useState(null)
  const [yukleniyor, setYukleniyor] = useState(false)

  const { girisYap } = useAuth()
  const navigate     = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setYukleniyor(true)
    setHata(null)

    try {
      const yanit = await fetch(`${API_BASE}/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password: sifre }),
      })

      if (!yanit.ok) {
        setHata('E-posta veya sifre hatali.')
        return
      }

      const veri = await yanit.json()
      girisYap(veri.token, { fullName: veri.fullName, role: veri.role })
      navigate('/dashboard')
    } catch {
      setHata('Sunucuya baglanılamadi. API calisiyor mu?')
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <div style={styles.sayfa}>
      <div style={styles.kutu}>
        <h2 style={styles.baslik}>Calisan Girisi</h2>

        <form onSubmit={handleSubmit}>
          <div style={styles.alan}>
            <label style={styles.etiket}>E-posta</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={styles.girdi}
              placeholder="ornek@dentapp.com"
            />
          </div>

          <div style={styles.alan}>
            <label style={styles.etiket}>Sifre</label>
            <input
              type="password"
              value={sifre}
              onChange={e => setSifre(e.target.value)}
              required
              style={styles.girdi}
              placeholder="••••••••"
            />
          </div>

          {hata && <p style={styles.hata}>{hata}</p>}

          <button type="submit" disabled={yukleniyor} style={styles.buton}>
            {yukleniyor ? 'Giris yapiliyor...' : 'Giris Yap'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  sayfa:   { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E8F5EE' },
  kutu:    { background: '#fff', padding: 40, borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.1)', width: '100%', maxWidth: 380 },
  baslik:  { margin: '0 0 28px', textAlign: 'center', color: '#1F6B4C' },
  alan:    { marginBottom: 18 },
  etiket:  { display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#444' },
  girdi:   { width: '100%', padding: '10px 12px', border: '1px solid #ccc', borderRadius: 6, fontSize: 15, boxSizing: 'border-box' },
  hata:    { color: '#d32f2f', fontSize: 14, margin: '0 0 14px' },
  buton:   { width: '100%', padding: 12, background: '#1F6B4C', color: '#fff', border: 'none', borderRadius: 6, fontSize: 16, cursor: 'pointer', fontWeight: 600 },
}
