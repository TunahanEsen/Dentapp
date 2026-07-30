import { useState, useEffect } from 'react'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../context/AuthContext'
import { silOnay, hataGoster } from '../../utils/dialog'

const ROLLER = ['Admin', 'Staff']
const BOSH_FORM = { fullName: '', email: '', password: '', role: 'Staff', calisanId: '' }

export default function KullanicilarPage() {
  const { apiFetch }  = useApi()
  const { kullanici: benimHesabim } = useAuth()

  const [kullanicilar, setKullanicilar] = useState([])
  const [calisanlar,   setCalisanlar]   = useState([])
  const [yukleniyor,   setYukleniyor]   = useState(true)
  const [modalMod,     setModalMod]     = useState(null)
  const [secilen,      setSecilen]      = useState(null)
  const [form,         setForm]         = useState(BOSH_FORM)
  const [kaydediyor,   setKaydediyor]   = useState(false)
  const [hata,         setHata]         = useState(null)

  useEffect(() => { getir() }, [])

  async function getir() {
    try {
      setYukleniyor(true)
      const [k, c] = await Promise.all([
        apiFetch('/api/kullanicilar'),
        apiFetch('/api/calisanlar'),
      ])
      setKullanicilar(k)
      setCalisanlar(c)
    } finally {
      setYukleniyor(false)
    }
  }

  function yeniAc() {
    setForm(BOSH_FORM)
    setSecilen(null)
    setHata(null)
    setModalMod('yeni')
  }

  function duzenleAc(k) {
    setForm({ fullName: k.fullName, email: k.email, password: '', role: k.role, calisanId: k.calisanId?.toString() || '' })
    setSecilen(k)
    setHata(null)
    setModalMod('duzenle')
  }

  function kapat() { setModalMod(null); setSecilen(null) }

  async function gonder(e) {
    e.preventDefault()
    setKaydediyor(true)
    setHata(null)
    const calisanIdVal = form.calisanId ? Number(form.calisanId) : null
    try {
      if (modalMod === 'yeni') {
        await apiFetch('/api/kullanicilar', {
          method: 'POST',
          body: JSON.stringify({ fullName: form.fullName, email: form.email, password: form.password, role: form.role, calisanId: calisanIdVal }),
        })
      } else {
        await apiFetch(`/api/kullanicilar/${secilen.id}`, {
          method: 'PUT',
          body: JSON.stringify({ fullName: form.fullName, role: form.role, calisanId: calisanIdVal }),
        })
      }
      kapat()
      await getir()
    } catch (e) {
      setHata(e.message)
    } finally {
      setKaydediyor(false)
    }
  }

  async function sil(id, ad) {
    if (!(await silOnay(`"${ad}" kullanıcısını silmek istediğinize emin misiniz?`))) return
    try {
      await apiFetch(`/api/kullanicilar/${id}`, { method: 'DELETE' })
      await getir()
    } catch (e) {
      await hataGoster(e.message)
    }
  }

  // Seçili formda hangi calisanlar zaten başka kullanıcıya bağlı?
  const bagliCalisanIdler = kullanicilar
    .filter(k => k.calisanId && (!secilen || k.id !== secilen.id))
    .map(k => k.calisanId)

  const adminSayisi = kullanicilar.filter(k => k.role === 'Admin').length

  return (
    <div style={s.sayfa}>
      <div style={s.baslikSatir}>
        <div>
          <h1 style={s.baslik}>Kullanıcı Yönetimi</h1>
          <p style={s.altBaslik}>{kullanicilar.length} kullanıcı · {adminSayisi} admin</p>
        </div>
        <button style={s.ekleBtn} onClick={yeniAc}>+ Yeni Kullanıcı</button>
      </div>

      {yukleniyor ? (
        <p style={s.bilgi}>Yükleniyor...</p>
      ) : (
        <div className="tablo-sarici" style={s.tabloSarici}>
          <table style={s.tablo}>
            <thead>
              <tr style={s.thSatir}>
                {['Ad Soyad', 'E-posta', 'Rol', 'Bağlı Çalışan', 'Kayıt Tarihi', 'İşlemler'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {kullanicilar.map(k => {
                const benim = k.email === benimHesabim?.email
                return (
                  <tr key={k.id} style={{ ...s.tr, ...(benim ? s.benimSatir : {}) }}>
                    <td style={s.td}>
                      <div style={s.adSatir}>
                        <span style={{ ...s.avatar, background: k.role === 'Admin' ? '#1F6B4C' : '#546e7a' }}>
                          {k.fullName.charAt(0).toUpperCase()}
                        </span>
                        <span>{k.fullName}</span>
                        {benim && <span style={s.benimRozet}>Sen</span>}
                      </div>
                    </td>
                    <td style={{ ...s.td, color: '#666' }}>{k.email}</td>
                    <td style={s.td}>
                      <span style={k.role === 'Admin' ? s.rozetAdmin : s.rozetStaff}>
                        {k.role === 'Admin' ? '👑 Admin' : '👤 Staff'}
                      </span>
                    </td>
                    <td style={s.td}>
                      {k.calisanAd
                        ? <span style={s.calisanRozet}>🔗 {k.calisanAd}</span>
                        : <span style={s.bagliDegil}>—</span>
                      }
                    </td>
                    <td style={{ ...s.td, color: '#999', fontSize: 13 }}>
                      {new Date(k.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td style={s.td}>
                      <button style={s.duzenleBtn} onClick={() => duzenleAc(k)}>Düzenle</button>
                      <button
                        style={{ ...s.silBtn, opacity: benim ? 0.4 : 1 }}
                        onClick={() => !benim && sil(k.id, k.fullName)}
                        disabled={benim}
                        title={benim ? 'Kendi hesabınızı silemezsiniz' : ''}
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalMod && (
        <div style={s.overlay} onClick={kapat}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalBaslik}>
              {modalMod === 'yeni' ? 'Yeni Kullanıcı Oluştur' : 'Kullanıcıyı Düzenle'}
            </h2>

            <form onSubmit={gonder}>
              <div style={s.alan}>
                <label style={s.etiket}>Ad Soyad</label>
                <input style={s.girdi} required value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })} />
              </div>

              {modalMod === 'yeni' && (
                <>
                  <div style={s.alan}>
                    <label style={s.etiket}>E-posta</label>
                    <input style={s.girdi} type="email" required value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div style={s.alan}>
                    <label style={s.etiket}>Şifre</label>
                    <input style={s.girdi} type="password" required minLength={6} value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder="En az 6 karakter" />
                  </div>
                </>
              )}

              <div style={s.alan}>
                <label style={s.etiket}>Rol</label>
                <div style={s.rolGrid}>
                  {ROLLER.map(r => (
                    <label key={r} style={{ ...s.rolSecim, ...(form.role === r ? s.rolSecimAktif : {}) }}>
                      <input type="radio" name="rol" value={r} checked={form.role === r}
                        onChange={() => setForm({ ...form, role: r })} style={{ display: 'none' }} />
                      <span style={s.rolIkon}>{r === 'Admin' ? '👑' : '👤'}</span>
                      <span style={s.rolAd}>{r}</span>
                      <span style={s.rolAciklama}>
                        {r === 'Admin' ? 'Tam yetki, kullanıcı yönetimi' : 'Modüllere erişim, yönetim yok'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={s.alan}>
                <label style={s.etiket}>Bağlı Çalışan <span style={{ color: '#94a3b8', fontWeight: 400 }}>(Görev ataması için gerekli)</span></label>
                <select style={s.girdi} value={form.calisanId}
                  onChange={e => setForm({ ...form, calisanId: e.target.value })}>
                  <option value="">— Bağlantı yok —</option>
                  {calisanlar.map(c => {
                    const bagliMi = bagliCalisanIdler.includes(c.id)
                    return (
                      <option key={c.id} value={c.id} disabled={bagliMi}>
                        {c.adSoyad} — {c.unvan}{bagliMi ? ' (zaten bağlı)' : ''}
                      </option>
                    )
                  })}
                </select>
                {form.calisanId && (
                  <p style={s.ipucuMetin}>
                    Bu kullanıcı yalnızca kendisine atanan görevleri görecektir.
                  </p>
                )}
              </div>

              {hata && <p style={s.hataMesaji}>{hata}</p>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
                <button type="button" onClick={kapat} style={s.iptalBtn}>İptal</button>
                <button type="submit" disabled={kaydediyor} style={s.kaydetBtn}>
                  {kaydediyor ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  sayfa:       { padding: 32, fontFamily: 'sans-serif' },
  baslikSatir: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  baslik:      { margin: '0 0 4px', fontSize: 26, color: '#1F6B4C' },
  altBaslik:   { margin: 0, color: '#888', fontSize: 14 },
  ekleBtn:     { padding: '10px 20px', background: '#1F6B4C', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  bilgi:       { textAlign: 'center', color: '#aaa', padding: 40 },

  tabloSarici: { background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' },
  tablo:       { width: '100%', borderCollapse: 'collapse' },
  thSatir:     { background: '#f5f6fa' },
  th:          { padding: '12px 16px', fontSize: 12, color: '#888', fontWeight: 600, textAlign: 'left', borderBottom: '1px solid #eee' },
  tr:          { borderBottom: '1px solid #f5f5f5' },
  benimSatir:  { background: '#F5FAF7' },
  td:          { padding: '14px 16px', fontSize: 14, verticalAlign: 'middle' },

  adSatir:    { display: 'flex', alignItems: 'center', gap: 10 },
  avatar:     { width: 32, height: 32, borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 },
  benimRozet: { fontSize: 11, background: '#E8F5EE', color: '#2D8A62', padding: '2px 8px', borderRadius: 20 },

  rozetAdmin:   { background: '#E8F5EE', color: '#1F6B4C', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600 },
  rozetStaff:   { background: '#f5f5f5', color: '#546e7a', padding: '4px 12px', borderRadius: 20, fontSize: 13 },
  calisanRozet: { background: '#eff6ff', color: '#1d4ed8', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  bagliDegil:   { color: '#cbd5e1', fontSize: 13 },

  duzenleBtn: { padding: '5px 12px', background: '#E8F5EE', color: '#2D8A62', border: 'none', borderRadius: 6, cursor: 'pointer', marginRight: 6, fontSize: 13 },
  silBtn:     { padding: '5px 12px', background: '#fce4ec', color: '#c62828', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 },

  overlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:      { background: '#fff', borderRadius: 12, padding: 32, width: '100%', maxWidth: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' },
  modalBaslik:{ margin: '0 0 24px', color: '#1F6B4C' },
  alan:       { marginBottom: 18 },
  etiket:     { display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 },
  girdi:      { width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 7, fontSize: 14, boxSizing: 'border-box' },
  ipucuMetin: { margin: '6px 0 0', fontSize: 12, color: '#7c3aed', background: '#f5f3ff', padding: '6px 10px', borderRadius: 6 },
  hataMesaji: { color: '#c62828', fontSize: 13, margin: '0 0 12px', padding: '8px 12px', background: '#fce4ec', borderRadius: 6 },

  rolGrid:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  rolSecim:      { display: 'flex', flexDirection: 'column', gap: 4, padding: '14px 16px', borderRadius: 8, cursor: 'pointer', border: '2px solid #eee', background: '#fafafa' },
  rolSecimAktif: { border: '2px solid #1a237e', background: '#E8F5EE' },
  rolIkon:       { fontSize: 20 },
  rolAd:         { fontWeight: 700, fontSize: 14, color: '#333' },
  rolAciklama:   { fontSize: 12, color: '#888' },

  iptalBtn:  { padding: '9px 20px', background: '#f5f5f5', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 14 },
  kaydetBtn: { padding: '9px 24px', background: '#1F6B4C', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 14, fontWeight: 600 },
}
