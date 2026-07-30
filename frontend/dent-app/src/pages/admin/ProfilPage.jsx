import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../context/AuthContext'

export default function ProfilPage() {
  const { apiFetch }            = useApi()
  const { kullanici, girisYap, token } = useAuth()
  const navigate                = useNavigate()

  const [profil,      setProfil]      = useState(null)
  const [yukleniyor,  setYukleniyor]  = useState(true)
  const [duzenleme,   setDuzenleme]   = useState(false)
  const [form,        setForm]        = useState({ fullName: '', email: '' })
  const [kaydediyor,  setKaydediyor]  = useState(false)
  const [hata,        setHata]        = useState('')
  const [basari,      setBasari]      = useState('')

  useEffect(() => {
    apiFetch('/api/auth/me')
      .then(data => {
        setProfil(data)
        setForm({ fullName: data.fullName, email: data.email })
      })
      .catch(() => setProfil(null))
      .finally(() => setYukleniyor(false))
  }, [])

  function duzenlemeBaslat() {
    setForm({ fullName: profil.fullName, email: profil.email })
    setHata('')
    setBasari('')
    setDuzenleme(true)
  }

  function iptalEt() {
    setDuzenleme(false)
    setHata('')
  }

  async function kaydet(e) {
    e.preventDefault()
    setHata('')
    setBasari('')

    if (!form.fullName.trim() || !form.email.trim()) {
      setHata('Ad ve e-posta boş olamaz.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setHata('Geçerli bir e-posta adresi girin.')
      return
    }

    setKaydediyor(true)
    try {
      const sonuc = await apiFetch('/api/auth/profil', {
        method: 'PUT',
        body: JSON.stringify({ fullName: form.fullName.trim(), email: form.email.trim() }),
      })
      setProfil(p => ({ ...p, fullName: sonuc.fullName, email: sonuc.email }))
      // AuthContext'i de güncelle
      girisYap(token, { ...kullanici, fullName: sonuc.fullName, email: sonuc.email })
      setDuzenleme(false)
      setBasari('Profil başarıyla güncellendi.')
      setTimeout(() => setBasari(''), 4000)
    } catch (err) {
      setHata(err.message || 'Bir hata oluştu.')
    } finally {
      setKaydediyor(false)
    }
  }

  if (yukleniyor) {
    return (
      <div style={s.sayfa}>
        <div style={s.yukleniyorKutu}>Yükleniyor...</div>
      </div>
    )
  }

  const baslangicHarfleri = profil
    ? profil.fullName.split(' ').map(k => k[0]).join('').substring(0, 2).toUpperCase()
    : '?'

  const rolRenk  = profil?.role === 'Admin' ? '#1F6B4C' : '#7c3aed'
  const rolLabel = profil?.role === 'Admin' ? 'Yönetici' : 'Personel'

  const kayitTarihi = profil?.createdAt
    ? new Date(profil.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '-'

  return (
    <div style={s.sayfa}>
      <div style={s.ustBaslik}>
        <h1 style={s.baslik}>👤 Profilim</h1>
        <p style={s.altYazi}>Hesap bilgilerinizi buradan görüntüleyebilir ve düzenleyebilirsiniz.</p>
      </div>

      <div style={s.icerik}>
        {/* Sol — avatar + özet */}
        <div style={s.solPanel}>
          <div style={s.avatarDaire}>
            <span style={s.avatarHarf}>{baslangicHarfleri}</span>
          </div>
          <h2 style={s.adSoyad}>{profil?.fullName}</h2>
          <span style={{ ...s.rolRozet, background: rolRenk }}>{rolLabel}</span>

          <div style={s.ozet}>
            <div style={s.ozetSatir}>
              <span style={s.ozetEtiket}>📧 E-posta</span>
              <span style={s.ozetDeger}>{profil?.email}</span>
            </div>
            <div style={s.ozetSatir}>
              <span style={s.ozetEtiket}>📅 Kayıt Tarihi</span>
              <span style={s.ozetDeger}>{kayitTarihi}</span>
            </div>
            <div style={s.ozetSatir}>
              <span style={s.ozetEtiket}>🔑 Rol</span>
              <span style={s.ozetDeger}>{rolLabel}</span>
            </div>
          </div>

          <Link to="/dashboard/sifre-degistir" style={s.sifreLink}>
            🔒 Şifremi Değiştir
          </Link>
        </div>

        {/* Sağ — düzenleme formu */}
        <div style={s.sagPanel}>
          <div style={s.kartBaslik}>
            <span style={s.kartBaslikYazi}>Hesap Bilgileri</span>
            {!duzenleme && (
              <button style={s.duzenleBtn} onClick={duzenlemeBaslat}>
                ✏️ Düzenle
              </button>
            )}
          </div>

          {basari && <div style={s.basariKutu}>✓ {basari}</div>}
          {hata   && <div style={s.hataKutu}>⚠️ {hata}</div>}

          {duzenleme ? (
            <form onSubmit={kaydet} style={s.form}>
              <div style={s.alanGrubu}>
                <label style={s.etiket}>Ad Soyad</label>
                <input
                  style={s.girdi}
                  value={form.fullName}
                  onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                  placeholder="Ad Soyad"
                  required
                />
              </div>

              <div style={s.alanGrubu}>
                <label style={s.etiket}>E-posta Adresi</label>
                <input
                  style={s.girdi}
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="ornek@email.com"
                  required
                />
              </div>

              <div style={s.btnSatir}>
                <button type="button" style={s.iptalBtn} onClick={iptalEt}>
                  İptal
                </button>
                <button type="submit" style={s.kaydetBtn} disabled={kaydediyor}>
                  {kaydediyor ? 'Kaydediliyor...' : '💾 Kaydet'}
                </button>
              </div>
            </form>
          ) : (
            <div style={s.bilgiListesi}>
              <BilgiSatiri etiket="Ad Soyad"       deger={profil?.fullName} />
              <BilgiSatiri etiket="E-posta"        deger={profil?.email} />
              <BilgiSatiri etiket="Rol"            deger={rolLabel} />
              <BilgiSatiri etiket="Kayıt Tarihi"   deger={kayitTarihi} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function BilgiSatiri({ etiket, deger }) {
  return (
    <div style={bs.satir}>
      <span style={bs.etiket}>{etiket}</span>
      <span style={bs.deger}>{deger || '-'}</span>
    </div>
  )
}

const bs = {
  satir:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 0', borderBottom: '1px solid #f0f0f0' },
  etiket: { fontSize: 13, color: '#888', fontWeight: 500 },
  deger:  { fontSize: 14, color: '#1a1a1a', fontWeight: 600, textAlign: 'right', maxWidth: '60%', wordBreak: 'break-all' },
}

const s = {
  sayfa:        { padding: '32px 28px', fontFamily: 'sans-serif', minHeight: '100vh', background: '#F5FAF7' },
  yukleniyorKutu: { textAlign: 'center', marginTop: 80, color: '#888' },

  ustBaslik:    { marginBottom: 28 },
  baslik:       { margin: '0 0 6px', fontSize: 22, color: '#1F6B4C', fontWeight: 700 },
  altYazi:      { margin: 0, fontSize: 14, color: '#7a9a8a' },

  icerik:       { display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' },

  // Sol panel
  solPanel:     { background: '#fff', borderRadius: 16, padding: '32px 24px', width: 240,
                  flexShrink: 0, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', textAlign: 'center' },
  avatarDaire:  { width: 90, height: 90, borderRadius: '50%', background: 'linear-gradient(135deg,#1F6B4C,#2d9e71)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
  avatarHarf:   { fontSize: 32, color: '#fff', fontWeight: 700, letterSpacing: 2 },
  adSoyad:      { margin: '0 0 10px', fontSize: 17, color: '#1a1a1a', fontWeight: 700 },
  rolRozet:     { display: 'inline-block', padding: '4px 14px', borderRadius: 20,
                  color: '#fff', fontSize: 12, fontWeight: 600, marginBottom: 20 },

  ozet:         { textAlign: 'left', marginBottom: 20 },
  ozetSatir:    { display: 'flex', flexDirection: 'column', marginBottom: 12 },
  ozetEtiket:   { fontSize: 11, color: '#aaa', marginBottom: 2 },
  ozetDeger:    { fontSize: 13, color: '#333', fontWeight: 500, wordBreak: 'break-all' },

  sifreLink:    { display: 'block', marginTop: 8, padding: '10px 0',
                  background: 'rgba(31,107,76,0.08)', borderRadius: 8,
                  color: '#1F6B4C', fontSize: 13, fontWeight: 600, textDecoration: 'none' },

  // Sağ panel
  sagPanel:     { flex: 1, minWidth: 300, background: '#fff', borderRadius: 16,
                  padding: '28px 32px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' },
  kartBaslik:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #f0f0f0' },
  kartBaslikYazi: { fontSize: 16, fontWeight: 700, color: '#1a1a1a' },
  duzenleBtn:   { padding: '7px 16px', background: '#1F6B4C', color: '#fff', border: 'none',
                  borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600 },

  basariKutu:   { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8,
                  padding: '10px 14px', color: '#15803d', fontSize: 13, marginBottom: 16 },
  hataKutu:     { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
                  padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 16 },

  bilgiListesi: { display: 'flex', flexDirection: 'column' },

  form:         { display: 'flex', flexDirection: 'column', gap: 4 },
  alanGrubu:    { marginBottom: 20 },
  etiket:       { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
  girdi:        { width: '100%', padding: '11px 14px', border: '1.5px solid #ddd', borderRadius: 8,
                  fontSize: 14, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
                  transition: 'border-color 0.2s' },

  btnSatir:     { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 },
  iptalBtn:     { padding: '10px 20px', background: '#f5f5f5', border: 'none', borderRadius: 8,
                  fontSize: 14, cursor: 'pointer', color: '#555' },
  kaydetBtn:    { padding: '10px 24px', background: '#1F6B4C', color: '#fff', border: 'none',
                  borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
}
