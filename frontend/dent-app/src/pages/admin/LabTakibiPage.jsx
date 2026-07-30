import { useState, useEffect, useRef } from 'react'
import { useApi }  from '../../hooks/useApi'
import { useAuth } from '../../context/AuthContext'
import { silOnay, hataGoster } from '../../utils/dialog'

// ─── Sabitler ────────────────────────────────────────────────────────────────

const DURUMLAR = ['Gönderildi', "Lab'da", 'Klinikte', 'Hastaya Verildi', 'İptal']

const DURUM_CFG = {
  'Gönderildi':      { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', ikon: '📤' },
  "Lab'da":          { bg: '#fefce8', color: '#a16207', border: '#fde68a', ikon: '🔬' },
  'Klinikte':        { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0', ikon: '🏥' },
  'Hastaya Verildi': { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe', ikon: '✅' },
  'İptal':           { bg: '#fef2f2', color: '#991b1b', border: '#fecaca', ikon: '❌' },
}

const SIRADAKI = {
  'Gönderildi': "Lab'da",
  "Lab'da":     'Klinikte',
  'Klinikte':   'Hastaya Verildi',
}

const TUR_SECENEKLER = ['Kron', 'Köprü', 'Protez', 'Veneer', 'İmplant Üstü', 'Braket Retainer', 'Diğer']

const BOŞ_FORM = {
  labAdi: '', tur: 'Kron', doktorId: '',
  gonderimTarihi: '', tahminiTeslim: '', notlar: '', ucret: '',
}

const BOŞ_LAB = { ad: '', telefon: '', notlar: '' }

// ─── Yardımcı ────────────────────────────────────────────────────────────────

function kisaTarih(str) {
  if (!str) return '—'
  return new Date(str + 'T00:00:00').toLocaleDateString('tr-TR')
}

function bugun() {
  return new Date().toISOString().split('T')[0]
}

function gecikmiMi(tahminiTeslim, durum) {
  if (durum === 'Hastaya Verildi' || durum === 'İptal') return false
  if (!tahminiTeslim) return false
  return new Date(tahminiTeslim + 'T00:00:00') < new Date(new Date().toDateString())
}

// ─── Ana Bileşen ─────────────────────────────────────────────────────────────

export default function LabTakibiPage() {
  const { apiFetch }  = useApi()
  const { kullanici } = useAuth()
  const isAdmin       = kullanici?.role === 'Admin'

  const [liste,      setListe]      = useState([])
  const [lablar,     setLablar]     = useState([])
  const [doktorlar,  setDoktorlar]  = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [filtre,     setFiltre]     = useState('Tümü')
  const [modal,      setModal]      = useState(null)   // null | 'yeni' | 'duzenle' | 'durum' | 'lablar'
  const [secili,     setSecili]     = useState(null)
  const [form,       setForm]       = useState(BOŞ_FORM)
  const [labForm,    setLabForm]    = useState(BOŞ_LAB)
  const [seciliLab,  setSeciliLab]  = useState(null)
  const [kaydediyor, setKaydediyor] = useState(false)

  useEffect(() => { verileriGetir() }, [])

  async function verileriGetir() {
    try {
      setYukleniyor(true)
      const [lt, lb, cal] = await Promise.all([
        apiFetch('/api/lab-takibi'),
        apiFetch('/api/lablar'),
        apiFetch('/api/calisanlar'),
      ])
      setListe(lt)
      setLablar(lb)
      setDoktorlar(cal.filter(c => c.unvan?.toLowerCase().includes('doktor') || c.unvan?.toLowerCase().includes('dr')))
    } finally {
      setYukleniyor(false)
    }
  }

  // ── Filtre hesapla ──────────────────────────────────────────────────────────

  const gecikmisSayisi = liste.filter(k => gecikmiMi(k.tahminiTeslim, k.durum)).length

  const filtrelenmis = liste.filter(k => {
    if (filtre === 'Tümü')     return true
    if (filtre === 'Gecikmiş') return gecikmiMi(k.tahminiTeslim, k.durum)
    return k.durum === filtre
  })

  // ── Modal aç/kapat ──────────────────────────────────────────────────────────

  function yeniAc() {
    setForm({ ...BOŞ_FORM, gonderimTarihi: bugun() })
    setModal('yeni')
  }

  function duzenlemeAc(kayit) {
    setSecili(kayit)
    setForm({
      labAdi:         kayit.labAdi,
      tur:            kayit.tur,
      doktorId:       kayit.doktorId?.toString() ?? '',
      gonderimTarihi: kayit.gonderimTarihi,
      tahminiTeslim:  kayit.tahminiTeslim,
      notlar:         kayit.notlar ?? '',
      ucret:          kayit.ucret?.toString() ?? '',
    })
    setModal('duzenle')
  }

  function labelarYonet() {
    setSeciliLab(null)
    setLabForm(BOŞ_LAB)
    setModal('lablar')
  }

  // ── CRUD — Lab Takibi ────────────────────────────────────────────────────────

  async function formGonder(e) {
    e.preventDefault()
    setKaydediyor(true)
    const body = {
      labAdi:         form.labAdi,
      tur:            form.tur,
      doktorId:       form.doktorId ? Number(form.doktorId) : null,
      gonderimTarihi: form.gonderimTarihi,
      tahminiTeslim:  form.tahminiTeslim,
      notlar:         form.notlar || null,
      ucret:          form.ucret  ? parseFloat(form.ucret) : null,
    }
    try {
      if (modal === 'yeni') {
        await apiFetch('/api/lab-takibi', { method: 'POST', body: JSON.stringify(body) })
      } else {
        await apiFetch(`/api/lab-takibi/${secili.id}`, {
          method: 'PUT',
          body: JSON.stringify({ ...body, gercekTeslim: secili.gercekTeslim ?? null, durum: secili.durum }),
        })
      }
      setModal(null)
      await verileriGetir()
    } catch (err) { await hataGoster(err.message) }
    finally { setKaydediyor(false) }
  }

  async function durumIlerlet(kayit) {
    const sonraki = SIRADAKI[kayit.durum]
    if (!sonraki) return
    const body = {
      durum:        sonraki,
      gercekTeslim: sonraki === 'Hastaya Verildi' ? bugun() : null,
    }
    try {
      await apiFetch(`/api/lab-takibi/${kayit.id}/durum`, { method: 'PUT', body: JSON.stringify(body) })
      await verileriGetir()
    } catch (err) { await hataGoster(err.message) }
  }

  async function iptalEt(kayit) {
    if (!(await silOnay(`"${kayit.tur} — ${kayit.labAdi}" siparişini iptal etmek istiyor musunuz?`))) return
    try {
      await apiFetch(`/api/lab-takibi/${kayit.id}/durum`, {
        method: 'PUT', body: JSON.stringify({ durum: 'İptal', gercekTeslim: null }),
      })
      await verileriGetir()
    } catch (err) { await hataGoster(err.message) }
  }

  async function kayitSil(kayit) {
    if (!isAdmin) return
    if (!(await silOnay(`"${kayit.tur} — ${kayit.labAdi}" kaydını silmek istediğinize emin misiniz?`))) return
    try {
      await apiFetch(`/api/lab-takibi/${kayit.id}`, { method: 'DELETE' })
      await verileriGetir()
    } catch (err) { await hataGoster(err.message) }
  }

  // ── CRUD — Lablar ────────────────────────────────────────────────────────────

  async function labKaydet(e) {
    e.preventDefault()
    setKaydediyor(true)
    const body = { ad: labForm.ad, telefon: labForm.telefon || null, notlar: labForm.notlar || null }
    try {
      if (seciliLab) {
        await apiFetch(`/api/lablar/${seciliLab.id}`, { method: 'PUT', body: JSON.stringify(body) })
      } else {
        await apiFetch('/api/lablar', { method: 'POST', body: JSON.stringify(body) })
      }
      setSeciliLab(null)
      setLabForm(BOŞ_LAB)
      const lb = await apiFetch('/api/lablar')
      setLablar(lb)
    } catch (err) { await hataGoster(err.message) }
    finally { setKaydediyor(false) }
  }

  async function labSil(lab) {
    if (!(await silOnay(`"${lab.ad}" laboratuvarını silmek istediğinize emin misiniz?`))) return
    try {
      await apiFetch(`/api/lablar/${lab.id}`, { method: 'DELETE' })
      const lb = await apiFetch('/api/lablar')
      setLablar(lb)
    } catch (err) { await hataGoster(err.message) }
  }

  // ── UI ───────────────────────────────────────────────────────────────────────

  const FILTRELER = ['Tümü', ...DURUMLAR, 'Gecikmiş']

  const sayi = (f) => {
    if (f === 'Tümü')     return liste.length
    if (f === 'Gecikmiş') return gecikmisSayisi
    return liste.filter(k => k.durum === f).length
  }

  return (
    <div style={s.sayfa}>
      {/* Başlık */}
      <div style={s.baslikSatir}>
        <div>
          <h1 style={s.baslik}>Laboratuvar Takibi</h1>
          <p style={s.altBaslik}>
            {liste.length} sipariş &nbsp;·&nbsp;
            {liste.filter(k => !['Hastaya Verildi','İptal'].includes(k.durum)).length} aktif
            {gecikmisSayisi > 0 && <span style={s.gecikAlert}>&nbsp;·&nbsp; ⚠ {gecikmisSayisi} gecikmiş</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {isAdmin && (
            <button onClick={labelarYonet} style={s.lablarBtn}>Labları Yönet</button>
          )}
          <button onClick={yeniAc} style={s.ekleBtn}>+ Yeni Sipariş</button>
        </div>
      </div>

      {/* Filtre Pills */}
      <div style={s.filterSatir}>
        {FILTRELER.map(f => {
          const aktif  = filtre === f
          const gecLen = f === 'Gecikmiş' && gecikmisSayisi > 0
          return (
            <button key={f} onClick={() => setFiltre(f)}
              style={{ ...s.pill, ...(aktif ? s.pillAktif : {}), ...(gecLen ? s.pillGec : {}) }}>
              {f === 'Gecikmiş' ? '⚠ Gecikmiş' : f}
              <span style={{ ...s.pillSayi, ...(aktif ? { background: '#fff', color: '#1F6B4C' } : {}) }}>
                {sayi(f)}
              </span>
            </button>
          )
        })}
      </div>

      {/* Tablo */}
      <div className="rapor-tablo-sarici" style={s.tabloSarici}>
        <table style={s.tablo}>
          <thead>
            <tr style={s.thSatir}>
              <th style={s.th}>Lab</th>
              <th style={s.th}>Tür</th>
              <th style={s.th}>Doktor</th>
              <th style={s.th}>Gönderim</th>
              <th style={s.th}>Tahmini Teslim</th>
              <th style={s.th}>Durum</th>
              <th style={{ ...s.th, textAlign: 'right' }}>Ücret</th>
              <th style={s.th}></th>
            </tr>
          </thead>
          <tbody>
            {yukleniyor ? (
              <tr><td colSpan={8} style={s.bilgi}>Yükleniyor...</td></tr>
            ) : filtrelenmis.length === 0 ? (
              <tr><td colSpan={8} style={s.bilgi}>Kayıt bulunamadı.</td></tr>
            ) : filtrelenmis.map(k => {
              const gec      = gecikmiMi(k.tahminiTeslim, k.durum)
              const cfg      = DURUM_CFG[k.durum] ?? DURUM_CFG['Gönderildi']
              const sonraki  = SIRADAKI[k.durum]
              const iptalOk  = !['Hastaya Verildi', 'İptal'].includes(k.durum)
              return (
                <tr key={k.id} style={{ ...s.tdSatir, ...(gec ? s.gecSatir : {}) }}>
                  <td style={s.td}>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>{k.labAdi}</span>
                  </td>
                  <td style={s.td}>{k.tur}</td>
                  <td style={s.td}>{k.doktorAd ?? <span style={{ color: '#94a3b8' }}>—</span>}</td>
                  <td style={s.td}>{kisaTarih(k.gonderimTarihi)}</td>
                  <td style={s.td}>
                    <span style={{ color: gec ? '#dc2626' : 'inherit', fontWeight: gec ? 700 : 400 }}>
                      {gec && '⚠ '}{kisaTarih(k.tahminiTeslim)}
                    </span>
                    {k.gercekTeslim && (
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                        Gerçek: {kisaTarih(k.gercekTeslim)}
                      </div>
                    )}
                  </td>
                  <td style={s.td}>
                    <span style={{ ...s.durumRozet, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      {cfg.ikon} {k.durum}
                    </span>
                  </td>
                  <td style={{ ...s.td, textAlign: 'right', fontWeight: 600 }}>
                    {k.ucret != null ? `${k.ucret.toLocaleString('tr-TR')} ₺` : <span style={{ color: '#94a3b8' }}>—</span>}
                  </td>
                  <td style={{ ...s.td, whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                      {sonraki && (
                        <button onClick={() => durumIlerlet(k)} style={s.ilerleBtn} title={`→ ${sonraki}`}>
                          → {sonraki}
                        </button>
                      )}
                      {iptalOk && (
                        <button onClick={() => iptalEt(k)} style={s.iptalBtn2} title="İptal et">✕</button>
                      )}
                      <button onClick={() => duzenlemeAc(k)} style={s.duzBtn} title="Düzenle">✏️</button>
                      {isAdmin && (
                        <button onClick={() => kayitSil(k)} style={s.silBtn} title="Sil">🗑</button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Modal: Yeni / Düzenle ── */}
      {(modal === 'yeni' || modal === 'duzenle') && (
        <div style={s.overlay} onClick={() => setModal(null)}>
          <div style={s.modalKutu} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalBaslik}>{modal === 'yeni' ? 'Yeni Sipariş' : 'Siparişi Düzenle'}</h2>
            <form onSubmit={formGonder}>
              <div style={s.ikiliGrid}>
                <div style={s.alan}>
                  <label style={s.etiket}>Laboratuvar *</label>
                  <select style={s.girdi} required value={form.labAdi}
                    onChange={e => setForm({ ...form, labAdi: e.target.value })}>
                    <option value="">— Seçiniz —</option>
                    {lablar.filter(l => l.aktif).map(l => (
                      <option key={l.id} value={l.ad}>{l.ad}</option>
                    ))}
                    <option value="__diger__">Diğer (manuel giriş)</option>
                  </select>
                  {form.labAdi === '__diger__' && (
                    <input style={{ ...s.girdi, marginTop: 6 }} placeholder="Lab adı giriniz..."
                      value={form._manuelLab ?? ''}
                      onChange={e => setForm({ ...form, _manuelLab: e.target.value, labAdi: e.target.value })} />
                  )}
                </div>
                <div style={s.alan}>
                  <label style={s.etiket}>İş Türü *</label>
                  <select style={s.girdi} required value={form.tur}
                    onChange={e => setForm({ ...form, tur: e.target.value })}>
                    {TUR_SECENEKLER.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div style={s.alan}>
                <label style={s.etiket}>Sorumlu Doktor</label>
                <select style={s.girdi} value={form.doktorId}
                  onChange={e => setForm({ ...form, doktorId: e.target.value })}>
                  <option value="">— Seçiniz —</option>
                  {doktorlar.map(d => (
                    <option key={d.id} value={d.id}>{d.adSoyad} — {d.unvan}</option>
                  ))}
                </select>
              </div>

              <div style={s.ikiliGrid}>
                <div style={s.alan}>
                  <label style={s.etiket}>Gönderim Tarihi *</label>
                  <input style={s.girdi} type="date" required value={form.gonderimTarihi}
                    onChange={e => setForm({ ...form, gonderimTarihi: e.target.value })} />
                </div>
                <div style={s.alan}>
                  <label style={s.etiket}>Tahmini Teslim *</label>
                  <input style={s.girdi} type="date" required value={form.tahminiTeslim}
                    min={form.gonderimTarihi}
                    onChange={e => setForm({ ...form, tahminiTeslim: e.target.value })} />
                </div>
              </div>

              <div style={s.ikiliGrid}>
                <div style={s.alan}>
                  <label style={s.etiket}>Ücret (₺)</label>
                  <input style={s.girdi} type="number" min="0" step="0.01" placeholder="0.00"
                    value={form.ucret}
                    onChange={e => setForm({ ...form, ucret: e.target.value })} />
                </div>
                <div style={s.alan}>
                  <label style={s.etiket}>Notlar</label>
                  <input style={s.girdi} placeholder="Opsiyonel..."
                    value={form.notlar}
                    onChange={e => setForm({ ...form, notlar: e.target.value })} />
                </div>
              </div>

              <div style={s.modalBtnSatir}>
                <button type="button" onClick={() => setModal(null)} style={s.iptalBtnModal}>İptal</button>
                <button type="submit" disabled={kaydediyor} style={s.kaydetBtn}>
                  {kaydediyor ? 'Kaydediliyor...' : modal === 'yeni' ? 'Sipariş Oluştur' : 'Güncelle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Labları Yönet ── */}
      {modal === 'lablar' && (
        <div style={s.overlay} onClick={() => setModal(null)}>
          <div style={{ ...s.modalKutu, maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalBaslik}>Laboratuvarları Yönet</h2>

            {/* Lab formu */}
            <form onSubmit={labKaydet} style={{ background: '#f8fafc', borderRadius: 10, padding: 16, marginBottom: 18, border: '1px solid #e8edf2' }}>
              <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: 13, color: '#334155' }}>
                {seciliLab ? `"${seciliLab.ad}" düzenleniyor` : 'Yeni Laboratuvar'}
              </p>
              <div style={s.ikiliGrid}>
                <div style={s.alan}>
                  <label style={s.etiket}>Lab Adı *</label>
                  <input style={s.girdi} required placeholder="Laboratuvar adı..."
                    value={labForm.ad}
                    onChange={e => setLabForm({ ...labForm, ad: e.target.value })} />
                </div>
                <div style={s.alan}>
                  <label style={s.etiket}>Telefon</label>
                  <input style={s.girdi} placeholder="0212 555 00 00"
                    value={labForm.telefon}
                    onChange={e => setLabForm({ ...labForm, telefon: e.target.value })} />
                </div>
              </div>
              <div style={s.alan}>
                <label style={s.etiket}>Notlar</label>
                <input style={s.girdi} placeholder="Uzmanlık alanı vb..."
                  value={labForm.notlar}
                  onChange={e => setLabForm({ ...labForm, notlar: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                {seciliLab && (
                  <button type="button" onClick={() => { setSeciliLab(null); setLabForm(BOŞ_LAB) }} style={s.iptalBtnModal}>
                    Vazgeç
                  </button>
                )}
                <button type="submit" disabled={kaydediyor} style={s.kaydetBtn}>
                  {kaydediyor ? '...' : seciliLab ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>

            {/* Lab listesi */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
              {lablar.length === 0 && <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>Henüz laboratuvar eklenmemiş.</p>}
              {lablar.map(l => (
                <div key={l.id} style={s.labSatir}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{l.ad}</span>
                    {l.telefon && <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>{l.telefon}</span>}
                    {l.notlar && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{l.notlar}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => { setSeciliLab(l); setLabForm({ ad: l.ad, telefon: l.telefon ?? '', notlar: l.notlar ?? '' }) }}
                      style={s.duzBtn}>✏️</button>
                    <button onClick={() => labSil(l)} style={s.silBtn}>🗑</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 18, textAlign: 'right' }}>
              <button onClick={() => setModal(null)} style={s.iptalBtnModal}>Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Stiller ─────────────────────────────────────────────────────────────────

const s = {
  sayfa:       { padding: '24px 28px', fontFamily: 'sans-serif' },
  baslikSatir: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 },
  baslik:      { margin: '0 0 4px', fontSize: 24, color: '#1F6B4C' },
  altBaslik:   { margin: 0, color: '#94a3b8', fontSize: 13 },
  gecikAlert:  { color: '#dc2626', fontWeight: 700 },

  ekleBtn:   { padding: '9px 18px', background: '#1F6B4C', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  lablarBtn: { padding: '9px 18px', background: '#fff', color: '#334155', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },

  filterSatir: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 },
  pill:        { padding: '6px 14px', background: '#f1f5f9', border: '1.5px solid #e2e8f0', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 },
  pillAktif:   { background: '#1F6B4C', color: '#fff', borderColor: '#1F6B4C' },
  pillGec:     { borderColor: '#fca5a5', color: '#dc2626' },
  pillSayi:    { background: 'rgba(0,0,0,0.12)', color: '#fff', borderRadius: 20, fontSize: 10, padding: '1px 6px', fontWeight: 700 },

  tabloSarici: { background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e8edf2', overflow: 'hidden' },
  tablo:       { width: '100%', borderCollapse: 'collapse' },
  thSatir:     { background: '#f8fafc' },
  th:          { padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e8edf2' },
  tdSatir:     { borderBottom: '1px solid #f1f5f9', transition: 'background .15s' },
  gecSatir:    { background: '#fff5f5' },
  td:          { padding: '12px 14px', fontSize: 13, color: '#334155', verticalAlign: 'middle' },
  bilgi:       { textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 14 },

  durumRozet:  { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' },

  ilerleBtn:  { padding: '4px 10px', background: '#1F6B4C', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' },
  iptalBtn2:  { padding: '4px 8px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontSize: 12 },
  duzBtn:     { padding: '4px 8px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', fontSize: 12 },
  silBtn:     { padding: '4px 8px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontSize: 12 },

  labSatir:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#fff', border: '1px solid #e8edf2', borderRadius: 8, padding: '10px 14px' },

  overlay:       { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalKutu:     { background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 520, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', maxHeight: '92vh', overflowY: 'auto' },
  modalBaslik:   { margin: '0 0 20px', color: '#1F6B4C', fontSize: 18, fontWeight: 800 },
  ikiliGrid:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  alan:          { marginBottom: 14 },
  etiket:        { display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 },
  girdi:         { width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' },
  modalBtnSatir: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 },
  iptalBtnModal: { padding: '9px 20px', background: '#f5f5f5', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 14 },
  kaydetBtn:     { padding: '9px 24px', background: '#1F6B4C', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 14, fontWeight: 700 },
}
