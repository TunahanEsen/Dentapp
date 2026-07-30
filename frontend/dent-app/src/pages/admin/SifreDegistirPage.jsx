import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'

export default function SifreDegistirPage() {
  const { apiFetch } = useApi()
  const navigate     = useNavigate()

  const [form, setForm] = useState({
    mevcutSifre:   '',
    yeniSifre:     '',
    yeniSifreTekrar: '',
  })
  const [yukleniyor,  setYukleniyor]  = useState(false)
  const [hata,        setHata]        = useState('')
  const [basarili,    setBasarili]    = useState(false)
  const [goster, setGoster] = useState({ mevcut: false, yeni: false, tekrar: false })

  function guncelle(alan, deger) {
    setForm(f => ({ ...f, [alan]: deger }))
    setHata('')
  }

  async function gonder(e) {
    e.preventDefault()
    setHata('')

    if (form.yeniSifre.length < 6) {
      setHata('Yeni şifre en az 6 karakter olmalıdır.')
      return
    }
    if (form.yeniSifre !== form.yeniSifreTekrar) {
      setHata('Yeni şifreler eşleşmiyor.')
      return
    }
    if (form.mevcutSifre === form.yeniSifre) {
      setHata('Yeni şifre mevcut şifreyle aynı olamaz.')
      return
    }

    setYukleniyor(true)
    try {
      await apiFetch('/api/auth/sifre-degistir', {
        method: 'PUT',
        body: JSON.stringify({
          mevcutSifre: form.mevcutSifre,
          yeniSifre:   form.yeniSifre,
        }),
      })
      setBasarili(true)
      setForm({ mevcutSifre: '', yeniSifre: '', yeniSifreTekrar: '' })
    } catch (err) {
      setHata(err.message || 'Bir hata oluştu.')
    } finally {
      setYukleniyor(false)
    }
  }

  if (basarili) {
    return (
      <div style={s.sayfa}>
        <div style={s.kart}>
          <div style={s.basariKutu}>
            <div style={s.basariIkon}>✓</div>
            <h2 style={{ margin: '0 0 8px', color: '#15803d', fontSize: 20 }}>Şifre Güncellendi!</h2>
            <p style={{ margin: '0 0 24px', color: '#5A7A6A', fontSize: 14 }}>
              Şifreniz başarıyla değiştirildi. Bir sonraki girişinizde yeni şifrenizi kullanın.
            </p>
            <button style={s.tamBtn} onClick={() => navigate('/dashboard')}>
              Panele Dön
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={s.sayfa}>
      <div style={s.kart}>
        <div style={s.kartBaslik}>
          <span style={s.kilit}>🔒</span>
          <div>
            <h1 style={s.baslik}>Şifremi Değiştir</h1>
            <p style={s.altBaslik}>Hesap güvenliğiniz için güçlü bir şifre seçin.</p>
          </div>
        </div>

        <form onSubmit={gonder} style={s.form}>
          <SifreAlani
            id="mevcut"
            etiket="Mevcut Şifre"
            deger={form.mevcutSifre}
            onChange={v => guncelle('mevcutSifre', v)}
            goster={goster.mevcut}
            onGosterToggle={() => setGoster(g => ({ ...g, mevcut: !g.mevcut }))}
          />

          <div style={s.ayrac} />

          <SifreAlani
            id="yeni"
            etiket="Yeni Şifre"
            deger={form.yeniSifre}
            onChange={v => guncelle('yeniSifre', v)}
            goster={goster.yeni}
            onGosterToggle={() => setGoster(g => ({ ...g, yeni: !g.yeni }))}
            ipucu="En az 6 karakter"
          />
          <SifreAlani
            id="tekrar"
            etiket="Yeni Şifre (Tekrar)"
            deger={form.yeniSifreTekrar}
            onChange={v => guncelle('yeniSifreTekrar', v)}
            goster={goster.tekrar}
            onGosterToggle={() => setGoster(g => ({ ...g, tekrar: !g.tekrar }))}
            eslesme={form.yeniSifre && form.yeniSifreTekrar
              ? form.yeniSifre === form.yeniSifreTekrar
              : null}
          />

          {/* Güç göstergesi */}
          {form.yeniSifre && (
            <GucGostergesi sifre={form.yeniSifre} />
          )}

          {hata && (
            <div style={s.hataKutu}>⚠️ {hata}</div>
          )}

          <div style={s.btnSatir}>
            <button type="button" style={s.iptalBtn} onClick={() => navigate(-1)}>
              Vazgeç
            </button>
            <button type="submit" style={s.kaydetBtn} disabled={yukleniyor}>
              {yukleniyor ? 'Güncelleniyor...' : '🔒 Şifremi Güncelle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── ŞİFRE GİRİŞ ALANI ────────────────────────────────────────────────────────
function SifreAlani({ id, etiket, deger, onChange, goster, onGosterToggle, ipucu, eslesme }) {
  const cerceveBorder = eslesme === null ? '#ddd'
    : eslesme ? '#16a34a' : '#dc2626'

  return (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor={id} style={s.etiket}>{etiket}</label>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type={goster ? 'text' : 'password'}
          required
          value={deger}
          onChange={e => onChange(e.target.value)}
          style={{ ...s.girdi, borderColor: cerceveBorder, paddingRight: 44 }}
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={onGosterToggle}
          style={s.gozBtn}
          aria-label={goster ? 'Gizle' : 'Göster'}
        >
          {goster ? '🙈' : '👁️'}
        </button>
      </div>
      {ipucu && <p style={s.ipucu}>{ipucu}</p>}
      {eslesme === false && <p style={{ ...s.ipucu, color: '#dc2626' }}>Şifreler eşleşmiyor</p>}
      {eslesme === true  && <p style={{ ...s.ipucu, color: '#16a34a' }}>✓ Şifreler eşleşiyor</p>}
    </div>
  )
}

// ─── ŞİFRE GÜÇ GÖSTERGESİ ────────────────────────────────────────────────────
function GucGostergesi({ sifre }) {
  const puan = [
    sifre.length >= 8,
    /[A-Z]/.test(sifre),
    /[0-9]/.test(sifre),
    /[^A-Za-z0-9]/.test(sifre),
  ].filter(Boolean).length

  const etiketler = ['Çok Zayıf', 'Zayıf', 'Orta', 'Güçlü', 'Çok Güçlü']
  const renkler   = ['#dc2626', '#f97316', '#eab308', '#22c55e', '#16a34a']
  const renk      = renkler[puan]
  const etiket    = etiketler[puan]

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: '#888' }}>Şifre Gücü</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: renk }}>{etiket}</span>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i < puan ? renk : '#e5e7eb',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <p style={{ margin: '6px 0 0', fontSize: 11, color: '#888', lineHeight: 1.6 }}>
        Güçlü şifre için: büyük harf, rakam ve özel karakter ekleyin.
      </p>
    </div>
  )
}

// ─── STİLLER ─────────────────────────────────────────────────────────────────
const s = {
  sayfa:       { padding: 32, fontFamily: 'sans-serif', display: 'flex', justifyContent: 'center' },
  kart:        { background: '#fff', borderRadius: 14, padding: '32px 36px', width: '100%', maxWidth: 480, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },

  kartBaslik:  { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid #f0f0f0' },
  kilit:       { fontSize: 36 },
  baslik:      { margin: '0 0 4px', fontSize: 20, color: '#1F6B4C', fontWeight: 700 },
  altBaslik:   { margin: 0, fontSize: 13, color: '#888' },

  form:        { display: 'flex', flexDirection: 'column' },
  ayrac:       { height: 1, background: '#f0f0f0', margin: '8px 0 20px' },
  etiket:      { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
  girdi:       { width: '100%', padding: '10px 44px 10px 12px', border: '1.5px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit' },
  gozBtn:      { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4, lineHeight: 1 },
  ipucu:       { margin: '4px 0 0', fontSize: 12, color: '#9ca3af' },

  hataKutu:    { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 16 },

  btnSatir:    { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 },
  iptalBtn:    { padding: '10px 20px', background: '#f5f5f5', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer', color: '#555' },
  kaydetBtn:   { padding: '10px 24px', background: '#1F6B4C', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },

  basariKutu:  { textAlign: 'center', padding: '20px 0' },
  basariIkon:  { width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontWeight: 700 },
  tamBtn:      { padding: '11px 28px', background: '#1F6B4C', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
}
