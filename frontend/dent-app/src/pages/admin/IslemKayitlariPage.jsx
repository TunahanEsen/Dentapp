import { useState, useEffect, useMemo } from 'react'
import { useApi }  from '../../hooks/useApi'
import { useAuth } from '../../context/AuthContext'
import { silOnay, hataGoster } from '../../utils/dialog'
import { csvIndir, islemRaporuYazdir } from '../../utils/export'

const BOSH_FORM = {
  doktorId:     '',
  tedaviId:     '',
  odemeYontemi: 'Nakit',
  farkliTutar:  false,
  odenenTutar:  '',
  notlar:       '',
}

function paraBirim(sayi) {
  return Number(sayi).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺'
}

function saatStr(dt) {
  return new Date(dt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

export default function IslemKayitlariPage() {
  const { apiFetch }  = useApi()
  const { kullanici } = useAuth()
  const isAdmin       = kullanici?.role === 'Admin'

  const bugun = new Date().toISOString().split('T')[0]

  const [kayitlar,   setKayitlar]   = useState([])
  const [doktorlar,  setDoktorlar]  = useState([])
  const [tedaviler,  setTedaviler]  = useState([])
  const [tarih,      setTarih]      = useState(bugun)
  const [form,       setForm]       = useState(BOSH_FORM)
  const [kaydediyor, setKaydediyor] = useState(false)
  const [basarili,   setBasarili]   = useState(false)

  useEffect(() => {
    apiFetch('/api/calisanlar').then(c => {
      const hekimler = c.filter(x => x.unvan.toLowerCase().includes('hekim') || x.unvan.toLowerCase().includes('doktor'))
      setDoktorlar(hekimler.length > 0 ? hekimler : c)
    })
    apiFetch('/api/tedaviler').then(setTedaviler)
  }, [])

  useEffect(() => { kayitlariGetir() }, [tarih])

  async function kayitlariGetir() {
    const data = await apiFetch(`/api/islem-kayitlari?tarih=${tarih}`)
    setKayitlar(data)
  }

  // Seçili tedavinin sistem fiyatı
  const secilenTedavi = tedaviler.find(t => t.id === Number(form.tedaviId))

  function formGuncelle(alan, deger) {
    setForm(prev => {
      const yeni = { ...prev, [alan]: deger }
      // Tedavi değişince farkliTutar'ı sıfırla
      if (alan === 'tedaviId') {
        yeni.farkliTutar = false
        yeni.odenenTutar = ''
        yeni.notlar      = ''
      }
      // Farklı tutar tiklenince sistem fiyatını ön doldur
      if (alan === 'farkliTutar' && deger === true && secilenTedavi) {
        yeni.odenenTutar = String(secilenTedavi.temelFiyat)
      }
      if (alan === 'farkliTutar' && deger === false) {
        yeni.odenenTutar = ''
        yeni.notlar      = ''
      }
      return yeni
    })
  }

  async function gonder(e) {
    e.preventDefault()
    if (!form.doktorId || !form.tedaviId) return
    setKaydediyor(true)
    try {
      await apiFetch('/api/islem-kayitlari', {
        method: 'POST',
        body: JSON.stringify({
          doktorId:     Number(form.doktorId),
          tedaviId:     Number(form.tedaviId),
          odemeYontemi: form.odemeYontemi,
          farkliTutar:  form.farkliTutar,
          odenenTutar:  form.farkliTutar && form.odenenTutar ? Number(form.odenenTutar) : null,
          notlar:       form.farkliTutar && form.notlar ? form.notlar : null,
        }),
      })
      setForm(BOSH_FORM)
      setBasarili(true)
      setTimeout(() => setBasarili(false), 2500)
      // Bugünün listesini yenile
      if (tarih === bugun) await kayitlariGetir()
    } catch (err) {
      await hataGoster(err.message)
    } finally {
      setKaydediyor(false)
    }
  }

  async function kayitSil(id) {
    if (!(await silOnay('Bu kaydı silmek istediğinize emin misiniz?'))) return
    await apiFetch(`/api/islem-kayitlari/${id}`, { method: 'DELETE' })
    await kayitlariGetir()
  }

  // Günlük özet hesapla
  const ozet = useMemo(() => {
    const toplam  = kayitlar.reduce((t, k) => t + Number(k.farkliTutar ? k.odenenTutar ?? k.sistemFiyati : k.sistemFiyati), 0)
    const nakit   = kayitlar.filter(k => k.odemeYontemi === 'Nakit').reduce((t, k) => t + Number(k.farkliTutar ? k.odenenTutar ?? k.sistemFiyati : k.sistemFiyati), 0)
    const kart    = kayitlar.filter(k => k.odemeYontemi === 'Kart').reduce((t, k)  => t + Number(k.farkliTutar ? k.odenenTutar ?? k.sistemFiyati : k.sistemFiyati), 0)
    return { toplam, nakit, kart, sayi: kayitlar.length }
  }, [kayitlar])

  // Tedavileri kategoriye göre grupla
  const tedaviGruplari = useMemo(() => {
    const gruplar = {}
    tedaviler.forEach(t => {
      if (!gruplar[t.kategori]) gruplar[t.kategori] = []
      gruplar[t.kategori].push(t)
    })
    return gruplar
  }, [tedaviler])

  const efektifTutar = k => k.farkliTutar ? (k.odenenTutar ?? k.sistemFiyati) : k.sistemFiyati

  return (
    <div style={s.sayfa}>
      <div style={s.baslikSatir}>
        <div>
          <h1 style={s.baslik}>İşlem Kaydı</h1>
          <p style={s.altBaslik}>Tedavi bazlı günlük işlem girişi</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={s.exportBtn} onClick={() => csvIndir(
            kayitlar.map(k => ({
              'Tarih':          new Date(k.tarih).toLocaleDateString('tr-TR'),
              'Saat':           new Date(k.tarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
              'Doktor':         k.doktorAd,
              'Tedavi':         k.tedaviAd,
              'Kategori':       k.tedaviKategori,
              'Ödeme Yöntemi':  k.odemeYontemi,
              'Sistem Fiyatı':  k.sistemFiyati,
              'Ödenen Tutar':   efektifTutar(k),
              'Not':            k.notlar ?? '',
            })),
            `islem-kayitlari-${tarih}`
          )}>⬇ CSV</button>
          <button style={s.exportBtn} onClick={() => islemRaporuYazdir(kayitlar, tarih, ozet)}>
            🖨 PDF
          </button>
        </div>
      </div>

      <div className="islem-icerik" style={s.icerik}>
        {/* ─── SOL: FORM ─── */}
        <div style={s.formPanel}>
          <h2 style={s.panelBaslik}>Yeni İşlem</h2>

          <form onSubmit={gonder}>
            {/* Doktor */}
            <div style={s.alan}>
              <label style={s.etiket}>Doktor *</label>
              <select style={s.girdi} required value={form.doktorId}
                onChange={e => formGuncelle('doktorId', e.target.value)}>
                <option value="">— Seçiniz —</option>
                {doktorlar.map(d => (
                  <option key={d.id} value={d.id}>{d.adSoyad}</option>
                ))}
              </select>
            </div>

            {/* Tedavi */}
            <div style={s.alan}>
              <label style={s.etiket}>Tedavi *</label>
              <select style={s.girdi} required value={form.tedaviId}
                onChange={e => formGuncelle('tedaviId', e.target.value)}>
                <option value="">— Seçiniz —</option>
                {Object.entries(tedaviGruplari).map(([kategori, liste]) => (
                  <optgroup key={kategori} label={kategori}>
                    {liste.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.ad} — {paraBirim(t.temelFiyat)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Sistem Fiyatı */}
            {secilenTedavi && (
              <div style={s.fiyatKutu}>
                <span style={s.fiyatEtiket}>Sistem Fiyatı</span>
                <span style={s.fiyatDeger}>{paraBirim(secilenTedavi.temelFiyat)}</span>
              </div>
            )}

            {/* Ödeme Yöntemi */}
            <div style={s.alan}>
              <label style={s.etiket}>Ödeme Yöntemi</label>
              <div style={s.odemeGrid}>
                {['Nakit', 'Kart'].map(y => (
                  <button key={y} type="button"
                    onClick={() => formGuncelle('odemeYontemi', y)}
                    style={{ ...s.odemeBtn, ...(form.odemeYontemi === y ? s.odemeBtnAktif : {}) }}>
                    {y === 'Nakit' ? '💵' : '💳'} {y}
                  </button>
                ))}
              </div>
            </div>

            {/* Farklı Tutar */}
            <label style={s.checkSatir}>
              <input
                type="checkbox"
                checked={form.farkliTutar}
                onChange={e => formGuncelle('farkliTutar', e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#1F6B4C' }}
              />
              <span style={{ fontSize: 14, color: '#334155', userSelect: 'none' }}>
                Sistem fiyatından farklı tutar alındı
              </span>
            </label>

            {/* Koşullu alanlar */}
            {form.farkliTutar && (
              <div style={s.farkliKutu}>
                <div style={s.alan}>
                  <label style={s.etiket}>Alınan Tutar (₺) *</label>
                  <input
                    style={s.girdi}
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={form.odenenTutar}
                    onChange={e => formGuncelle('odenenTutar', e.target.value)}
                  />
                  {secilenTedavi && form.odenenTutar && (
                    <p style={{
                      margin: '5px 0 0', fontSize: 12,
                      color: Number(form.odenenTutar) < secilenTedavi.temelFiyat ? '#dc2626' : '#166534',
                    }}>
                      {Number(form.odenenTutar) < secilenTedavi.temelFiyat
                        ? `▼ ${paraBirim(secilenTedavi.temelFiyat - Number(form.odenenTutar))} indirim`
                        : `▲ ${paraBirim(Number(form.odenenTutar) - secilenTedavi.temelFiyat)} fark`
                      }
                    </p>
                  )}
                </div>
                <div style={s.alan}>
                  <label style={s.etiket}>Notlar</label>
                  <textarea
                    style={{ ...s.girdi, height: 72, resize: 'vertical' }}
                    placeholder="Fiyat farkının sebebini yazınız..."
                    value={form.notlar}
                    onChange={e => formGuncelle('notlar', e.target.value)}
                  />
                </div>
              </div>
            )}

            <button type="submit" disabled={kaydediyor || !form.doktorId || !form.tedaviId}
              style={{ ...s.kaydetBtn, opacity: (!form.doktorId || !form.tedaviId) ? 0.5 : 1 }}>
              {kaydediyor ? 'Kaydediliyor...' : 'Kaydet'}
            </button>

            {basarili && (
              <div style={s.basariliMesaj}>✓ İşlem başarıyla kaydedildi</div>
            )}
          </form>
        </div>

        {/* ─── SAĞ: GÜNLÜK LİSTE ─── */}
        <div style={s.listePanel}>
          {/* Tarih seçici */}
          <div style={s.tarihSatir}>
            <h2 style={s.panelBaslik}>Günlük Kayıtlar</h2>
            <input type="date" style={s.tarihInput} value={tarih} max={bugun}
              onChange={e => setTarih(e.target.value)} />
          </div>

          {/* Özet kartlar */}
          <div className="islem-ozet" style={s.ozetGrid}>
            <div style={s.ozetKart}>
              <span style={s.ozetEtiket}>Toplam</span>
              <span style={{ ...s.ozetDeger, color: '#1F6B4C' }}>{paraBirim(ozet.toplam)}</span>
            </div>
            <div style={s.ozetKart}>
              <span style={s.ozetEtiket}>💵 Nakit</span>
              <span style={s.ozetDeger}>{paraBirim(ozet.nakit)}</span>
            </div>
            <div style={s.ozetKart}>
              <span style={s.ozetEtiket}>💳 Kart</span>
              <span style={s.ozetDeger}>{paraBirim(ozet.kart)}</span>
            </div>
            <div style={s.ozetKart}>
              <span style={s.ozetEtiket}>İşlem</span>
              <span style={s.ozetDeger}>{ozet.sayi}</span>
            </div>
          </div>

          {/* Kayıt listesi */}
          {kayitlar.length === 0 ? (
            <div style={s.bosListe}>Bu tarihte kayıt bulunmuyor.</div>
          ) : (
            <div style={s.liste}>
              {kayitlar.map(k => {
                const tutar     = efektifTutar(k)
                const farkVar   = k.farkliTutar
                const indirimli = farkVar && Number(k.odenenTutar) < Number(k.sistemFiyati)
                return (
                  <div key={k.id} style={s.kayitKart}>
                    <div style={s.kayitUst}>
                      <div style={s.kayitBilgi}>
                        <span style={s.kayitDoktor}>{k.doktorAd}</span>
                        <span style={s.kayitTedavi}>{k.tedaviAd}</span>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{k.tedaviKategori}</span>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ ...s.kayitTutar, color: indirimli ? '#dc2626' : '#1F6B4C' }}>
                          {paraBirim(tutar)}
                          {farkVar && (
                            <span style={{ fontSize: 10, marginLeft: 4, color: indirimli ? '#dc2626' : '#166534' }}>
                              {indirimli ? '▼' : '▲'}
                            </span>
                          )}
                        </div>
                        {farkVar && (
                          <div style={{ fontSize: 10, color: '#94a3b8', textDecoration: 'line-through' }}>
                            {paraBirim(k.sistemFiyati)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={s.kayitAlt}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ ...s.odemeRozet, ...(k.odemeYontemi === 'Nakit' ? s.nakitRozet : s.kartRozet) }}>
                          {k.odemeYontemi === 'Nakit' ? '💵' : '💳'} {k.odemeYontemi}
                        </span>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{saatStr(k.tarih)}</span>
                        {k.notlar && (
                          <span style={s.notRozet} title={k.notlar}>📝 Not</span>
                        )}
                      </div>
                      {isAdmin && (
                        <button onClick={() => kayitSil(k.id)} style={s.silBtn}>Sil</button>
                      )}
                    </div>

                    {k.notlar && (
                      <div style={s.notMetin}>{k.notlar}</div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const s = {
  sayfa:       { padding: '24px 28px', fontFamily: 'sans-serif' },
  baslikSatir: { marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 },
  baslik:      { margin: '0 0 4px', fontSize: 24, color: '#1F6B4C' },
  altBaslik:   { margin: 0, color: '#94a3b8', fontSize: 13 },
  exportBtn:   { padding: '9px 16px', background: '#fff', color: '#555', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, cursor: 'pointer' },

  icerik:   { display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20, alignItems: 'start' },

  // Form paneli
  formPanel:   { background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #e8edf2' },
  panelBaslik: { margin: '0 0 18px', fontSize: 16, fontWeight: 700, color: '#1e293b' },

  alan:   { marginBottom: 16 },
  etiket: { display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 },
  girdi:  { width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', color: '#1e293b', background: '#fff' },

  fiyatKutu:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', marginBottom: 16 },
  fiyatEtiket:{ fontSize: 12, color: '#166534', fontWeight: 600 },
  fiyatDeger: { fontSize: 18, fontWeight: 800, color: '#1F6B4C' },

  odemeGrid:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  odemeBtn:      { padding: '10px', border: '2px solid #e2e8f0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#64748b' },
  odemeBtnAktif: { border: '2px solid #1F6B4C', background: '#f0fdf4', color: '#1F6B4C' },

  checkSatir: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, cursor: 'pointer' },

  farkliKutu: { background: '#fefce8', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 16px', marginBottom: 16 },

  kaydetBtn:    { width: '100%', padding: '11px', background: '#1F6B4C', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  basariliMesaj:{ marginTop: 10, padding: '8px 12px', background: '#f0fdf4', color: '#166534', borderRadius: 7, fontSize: 13, fontWeight: 600, textAlign: 'center' },

  // Liste paneli
  listePanel: { background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #e8edf2' },
  tarihSatir: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 },
  tarihInput: { padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13, color: '#334155' },

  ozetGrid:  { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 18 },
  ozetKart:  { background: '#f8fafc', borderRadius: 10, padding: '12px 14px', border: '1px solid #e8edf2' },
  ozetEtiket:{ display: 'block', fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' },
  ozetDeger: { display: 'block', fontSize: 16, fontWeight: 800, color: '#1e293b' },

  bosListe: { textAlign: 'center', padding: '40px 0', color: '#cbd5e1', fontSize: 14 },
  liste:    { display: 'flex', flexDirection: 'column', gap: 10 },

  kayitKart:  { background: '#f8fafc', borderRadius: 10, padding: '14px', border: '1px solid #e8edf2' },
  kayitUst:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  kayitBilgi: { display: 'flex', flexDirection: 'column', gap: 2 },
  kayitDoktor:{ fontWeight: 700, fontSize: 14, color: '#1e293b' },
  kayitTedavi:{ fontSize: 13, color: '#475569' },
  kayitTutar: { fontSize: 17, fontWeight: 800 },

  kayitAlt: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 },

  odemeRozet:{ padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  nakitRozet:{ background: '#fef9c3', color: '#854d0e' },
  kartRozet: { background: '#eff6ff', color: '#1d4ed8' },

  notRozet:  { padding: '3px 8px', borderRadius: 20, fontSize: 11, background: '#f5f3ff', color: '#7c3aed', cursor: 'help' },
  notMetin:  { marginTop: 8, padding: '8px 10px', background: '#fafafa', borderRadius: 6, fontSize: 12, color: '#64748b', borderLeft: '3px solid #e2e8f0' },

  silBtn:  { padding: '3px 10px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontSize: 11 },
}
