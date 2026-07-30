import { useState, useEffect, useCallback } from 'react'
import { silOnay, hataGoster } from '../../utils/dialog'
import {
  ComposedChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip as PieTooltip
} from 'recharts'
import { useApi } from '../../hooks/useApi'
import { csvIndir, yazdir } from '../../utils/export'

// ─── SABİTLER ────────────────────────────────────────────────────────────────
const GELİR_KATEGORİLERİ = ['Tedavi Geliri', 'Danışmanlık', 'Diğer Gelir']
const GİDER_KATEGORİLERİ = ['Malzeme', 'Maaş', 'Kira', 'Ekipman', 'Elektrik/Su', 'Diğer Gider']
const PASTA_RENKLERİ     = ['#1F6B4C','#2D8A62','#0288d1','#00838f','#2e7d32','#558b2f','#f57f17','#e65100','#c62828','#ad1457']

const AY_ADLARI = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']

function buAy()  { return new Date().getMonth() + 1 }
function buYil() { return new Date().getFullYear() }

function paraBiçim(sayi) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(sayi)
}

// ─── ANA SAYFA ────────────────────────────────────────────────────────────────
export default function FinansPage() {
  const { apiFetch } = useApi()
  const [yil, setYil] = useState(buYil())
  const [ay,  setAy]  = useState(buAy())

  const [islemler,      setIslemler]      = useState([])
  const [yillikOzet,    setYillikOzet]    = useState([])
  const [kategoriler,   setKategoriler]   = useState([])
  const [oncekiAyGelir, setOncekiAyGelir] = useState(0)
  const [oncekiAyGider, setOncekiAyGider] = useState(0)
  const [yukleniyor,    setYukleniyor]    = useState(true)
  const [modalAcik,     setModalAcik]     = useState(false)

  const getir = useCallback(async () => {
    setYukleniyor(true)
    const oncekiAy_  = ay === 1 ? 12 : ay - 1
    const oncekiYil_ = ay === 1 ? yil - 1 : yil
    try {
      const [isl, yil_, kat, onceki] = await Promise.all([
        apiFetch(`/api/gelir-gider?yil=${yil}&ay=${ay}`),
        apiFetch(`/api/gelir-gider/yillik?yil=${yil}`),
        apiFetch(`/api/gelir-gider/kategoriler?yil=${yil}&ay=${ay}`),
        apiFetch(`/api/gelir-gider?yil=${oncekiYil_}&ay=${oncekiAy_}`),
      ])
      setIslemler(isl)
      setYillikOzet(yil_)
      setKategoriler(kat)
      setOncekiAyGelir(onceki.filter(i => i.tur === 'Gelir').reduce((t, i) => t + i.miktar, 0))
      setOncekiAyGider(onceki.filter(i => i.tur === 'Gider').reduce((t, i) => t + i.miktar, 0))
    } finally {
      setYukleniyor(false)
    }
  }, [yil, ay])

  useEffect(() => { getir() }, [getir])

  async function sil(id) {
    if (!(await silOnay('Bu kaydı silmek istiyor musunuz?'))) return
    await apiFetch(`/api/gelir-gider/${id}`, { method: 'DELETE' })
    getir()
  }

  // Ay özeti hesapla
  const toplamGelir  = islemler.filter(i => i.tur === 'Gelir').reduce((t, i) => t + i.miktar, 0)
  const toplamGider  = islemler.filter(i => i.tur === 'Gider').reduce((t, i) => t + i.miktar, 0)
  const netDurum     = toplamGelir - toplamGider

  // Pasta grafik verisi
  const pastaVeri = kategoriler.map(k => ({
    name: `${k.kategori} (${k.tur})`,
    value: Number(k.toplam)
  }))

  const yilSecenekleri = Array.from({ length: 5 }, (_, i) => buYil() - i)

  return (
    <div style={s.sayfa}>
      {/* Başlık + Filtreler */}
      <div style={s.baslikSatir}>
        <div>
          <h1 style={s.baslik}>Gelir / Gider Takibi</h1>
          <p style={s.altBaslik}>Finansal durumu izle ve kayıt ekle</p>
        </div>
        <div style={s.filtreler}>
          <select style={s.filtreSec} value={ay} onChange={e => setAy(Number(e.target.value))}>
            {AY_ADLARI.map((ad, i) => <option key={i} value={i + 1}>{ad}</option>)}
          </select>
          <select style={s.filtreSec} value={yil} onChange={e => setYil(Number(e.target.value))}>
            {yilSecenekleri.map(y => <option key={y}>{y}</option>)}
          </select>
          <button style={s.exportBtn} onClick={() => csvIndir(
            islemler.map(i => ({
              'Tarih': i.tarih, 'Tür': i.tur, 'Kategori': i.kategori,
              'Açıklama': i.aciklama, 'Miktar': i.miktar
            })), `gelir-gider-${yil}-${ay}`)}>⬇ CSV</button>
          <button style={s.exportBtn} onClick={() => yazdir('finans-tablo', `Gelir/Gider — ${AY_ADLARI[ay-1]} ${yil}`)}>🖨 PDF</button>
          <button style={s.ekleBtn} onClick={() => setModalAcik(true)}>+ Yeni Kayıt</button>
        </div>
      </div>

      {/* Özet Kartlar */}
      <div style={s.kartlar}>
        <OzetKart baslik="Toplam Gelir" deger={paraBiçim(toplamGelir)} renk="#2e7d32" arka="#e8f5e9" ikon="💰"
          onceki={oncekiAyGelir} />
        <OzetKart baslik="Toplam Gider" deger={paraBiçim(toplamGider)} renk="#c62828" arka="#fce4ec" ikon="💸"
          onceki={oncekiAyGider} tersDegerlendirme />
        <OzetKart
          baslik="Net Durum"
          deger={paraBiçim(netDurum)}
          renk={netDurum >= 0 ? '#2e7d32' : '#c62828'}
          arka={netDurum >= 0 ? '#e8f5e9' : '#fce4ec'}
          ikon={netDurum >= 0 ? '📈' : '📉'}
          onceki={oncekiAyGelir - oncekiAyGider}
        />
        <OzetKart baslik="İşlem Sayısı" deger={islemler.length} renk="#1565c0" arka="#E8F5EE" ikon="🧾" />
      </div>

      {yukleniyor ? <p style={s.bilgi}>Yükleniyor...</p> : (
        <>
          {/* Grafikler */}
          <div className="grafik-grid" style={s.grafikGrid}>
            {/* ComposedChart — Yıllık Gelir/Gider + Net Kâr Çizgisi */}
            <div style={s.grafikKutu}>
              <h3 style={s.grafikBaslik}>{yil} Yılı Aylık Gelir / Gider</h3>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={yillikOzet} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="ayAdi" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₺${(v/1000).toFixed(0)}K`} />
                  <Tooltip formatter={(val) => paraBiçim(val)} />
                  <Legend />
                  <Bar dataKey="gelir" name="Gelir" fill="#2e7d32" radius={[4,4,0,0]} />
                  <Bar dataKey="gider" name="Gider" fill="#c62828" radius={[4,4,0,0]} />
                  <Line type="monotone" dataKey="net" name="Net Kâr" stroke="#7c3aed"
                    strokeWidth={2} dot={{ r: 3, fill: '#7c3aed' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Gider Kategori Dağılımı */}
            <div style={s.grafikKutu}>
              <h3 style={s.grafikBaslik}>{AY_ADLARI[ay - 1]} Gider Dağılımı</h3>
              {kategoriler.filter(k => k.tur === 'Gider').length === 0 ? (
                <p style={s.bilgi}>Bu ay gider kaydı yok.</p>
              ) : (() => {
                const giderVeri = kategoriler
                  .filter(k => k.tur === 'Gider')
                  .map(k => ({ name: k.kategori, value: Number(k.toplam) }))
                return (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={giderVeri} cx="50%" cy="50%"
                        innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value">
                        {giderVeri.map((_, i) => (
                          <Cell key={i} fill={PASTA_RENKLERİ[i % PASTA_RENKLERİ.length]} />
                        ))}
                      </Pie>
                      <PieTooltip formatter={(val, name) => [paraBiçim(val), name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )
              })()}
            </div>
          </div>

          {/* İşlem Listesi */}
          <div style={s.listeKutu}>
            <h3 style={s.grafikBaslik}>{AY_ADLARI[ay - 1]} {yil} — İşlemler</h3>
            {islemler.length === 0 ? (
              <p style={s.bilgi}>Bu ay kayıt yok.</p>
            ) : (
              <table id="finans-tablo" style={s.tablo}>
                <thead>
                  <tr style={s.thSatir}>
                    {['Tarih', 'Tür', 'Kategori', 'Açıklama', 'Miktar', ''].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {islemler.map(i => (
                    <tr key={i.id} style={s.tr}>
                      <td style={s.td}>{new Date(i.tarih + 'T00:00:00').toLocaleDateString('tr-TR')}</td>
                      <td style={s.td}>
                        <span style={{ ...(i.tur === 'Gelir' ? s.rozetYesil : s.rozetKirmizi) }}>
                          {i.tur === 'Gelir' ? '▲' : '▼'} {i.tur}
                        </span>
                      </td>
                      <td style={s.td}>{i.kategori}</td>
                      <td style={{ ...s.td, color: '#666' }}>{i.aciklama || '—'}</td>
                      <td style={{ ...s.td, fontWeight: 700, color: i.tur === 'Gelir' ? '#2e7d32' : '#c62828', textAlign: 'right' }}>
                        {i.tur === 'Gelir' ? '+' : '-'}{paraBiçim(i.miktar)}
                      </td>
                      <td style={s.td}>
                        <button style={s.silBtn} onClick={() => sil(i.id)}>Sil</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f5f6fa' }}>
                    <td colSpan={4} style={{ ...s.td, fontWeight: 700 }}>Toplam</td>
                    <td style={{ ...s.td, fontWeight: 700, textAlign: 'right', color: netDurum >= 0 ? '#2e7d32' : '#c62828' }}>
                      {netDurum >= 0 ? '+' : ''}{paraBiçim(netDurum)}
                    </td>
                    <td style={s.td} />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </>
      )}

      {/* Yeni Kayıt Modalı */}
      {modalAcik && (
        <KayitModal
          apiFetch={apiFetch}
          secilenYil={yil}
          secilenAy={ay}
          onKapat={() => setModalAcik(false)}
          onKaydet={() => { setModalAcik(false); getir() }}
        />
      )}
    </div>
  )
}

// ─── ÖZET KART ────────────────────────────────────────────────────────────────
function OzetKart({ baslik, deger, renk, arka, ikon, onceki, tersDegerlendirme }) {
  let degisim = null
  if (onceki !== undefined && onceki !== null && onceki !== 0) {
    const buAyDeger = typeof deger === 'string'
      ? parseFloat(deger.replace(/[^\d,-]/g, '').replace(',', '.')) || 0
      : Number(deger)
    const yuzde = ((buAyDeger - onceki) / Math.abs(onceki)) * 100
    const artti = tersDegerlendirme ? yuzde < 0 : yuzde > 0
    degisim = { yuzde: Math.abs(yuzde).toFixed(0), artti, ok: yuzde > 0 ? '▲' : '▼' }
  }

  return (
    <div style={{ ...s.ozetKart, background: arka }}>
      <span style={s.ozetIkon}>{ikon}</span>
      <div style={{ flex: 1 }}>
        <p style={{ ...s.ozetDeger, color: renk }}>{deger}</p>
        <p style={s.ozetBaslik}>{baslik}</p>
        {degisim && (
          <p style={{ margin: '4px 0 0', fontSize: 11, color: degisim.artti ? '#2e7d32' : '#c62828', fontWeight: 600 }}>
            {degisim.ok} %{degisim.yuzde} geçen aya göre
          </p>
        )}
      </div>
    </div>
  )
}

// ─── YENİ KAYIT MODALI ────────────────────────────────────────────────────────
function KayitModal({ apiFetch, secilenYil, secilenAy, onKapat, onKaydet }) {
  const bugun = `${secilenYil}-${String(secilenAy).padStart(2,'0')}-${String(new Date().getDate()).padStart(2,'0')}`
  const [form, setForm] = useState({ tur: 'Gelir', kategori: GELİR_KATEGORİLERİ[0], miktar: '', tarih: bugun, aciklama: '' })
  const [kaydediyor, setKaydediyor] = useState(false)

  const kategoriler = form.tur === 'Gelir' ? GELİR_KATEGORİLERİ : GİDER_KATEGORİLERİ

  function turDegistir(yeniTur) {
    const varsayilanKat = yeniTur === 'Gelir' ? GELİR_KATEGORİLERİ[0] : GİDER_KATEGORİLERİ[0]
    setForm({ ...form, tur: yeniTur, kategori: varsayilanKat })
  }

  async function gonder(e) {
    e.preventDefault()
    setKaydediyor(true)
    try {
      await apiFetch('/api/gelir-gider', {
        method: 'POST',
        body: JSON.stringify({ ...form, miktar: parseFloat(form.miktar) })
      })
      onKaydet()
    } catch (e) { await hataGoster(e.message) }
    finally { setKaydediyor(false) }
  }

  return (
    <div style={s.overlay} onClick={onKapat}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <h2 style={s.modalBaslik}>Yeni Kayıt Ekle</h2>

        {/* Gelir / Gider Seçimi */}
        <div style={s.turSecimSatir}>
          {['Gelir', 'Gider'].map(t => (
            <button key={t} type="button"
              style={{ ...s.turBtn, ...(form.tur === t ? (t === 'Gelir' ? s.turBtnGelir : s.turBtnGider) : {}) }}
              onClick={() => turDegistir(t)}>
              {t === 'Gelir' ? '▲ Gelir' : '▼ Gider'}
            </button>
          ))}
        </div>

        <form onSubmit={gonder}>
          <div style={s.ikiliGrid}>
            <div style={s.alan}>
              <label style={s.etiket}>Kategori</label>
              <select style={s.girdi} value={form.kategori}
                onChange={e => setForm({ ...form, kategori: e.target.value })}>
                {kategoriler.map(k => <option key={k}>{k}</option>)}
              </select>
            </div>
            <div style={s.alan}>
              <label style={s.etiket}>Tarih</label>
              <input style={s.girdi} type="date" required value={form.tarih}
                onChange={e => setForm({ ...form, tarih: e.target.value })} />
            </div>
          </div>

          <div style={s.alan}>
            <label style={s.etiket}>Miktar (₺)</label>
            <input style={s.girdi} type="number" min="0.01" step="0.01" required
              placeholder="0.00" value={form.miktar}
              onChange={e => setForm({ ...form, miktar: e.target.value })} />
          </div>

          <div style={s.alan}>
            <label style={s.etiket}>Açıklama (opsiyonel)</label>
            <input style={s.girdi} placeholder="Not ekle..."
              value={form.aciklama} onChange={e => setForm({ ...form, aciklama: e.target.value })} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
            <button type="button" onClick={onKapat} style={s.iptalBtn}>İptal</button>
            <button type="submit" disabled={kaydediyor} style={s.kaydetBtn}>
              {kaydediyor ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── STİLLER ─────────────────────────────────────────────────────────────────
const s = {
  sayfa:       { padding: 32, fontFamily: 'sans-serif' },
  baslikSatir: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  baslik:      { margin: '0 0 4px', fontSize: 26, color: '#1F6B4C' },
  altBaslik:   { margin: 0, color: '#888', fontSize: 14 },
  filtreler:   { display: 'flex', gap: 8, alignItems: 'center' },
  filtreSec:   { padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, background: '#fff' },
  ekleBtn:     { padding: '10px 20px', background: '#1F6B4C', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  exportBtn:   { padding: '10px 16px', background: '#fff', color: '#555', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
  bilgi:       { textAlign: 'center', color: '#aaa', padding: 40 },

  // Özet kartlar
  kartlar:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 },
  ozetKart:   { borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  ozetIkon:   { fontSize: 32 },
  ozetDeger:  { margin: 0, fontSize: 22, fontWeight: 700 },
  ozetBaslik: { margin: '4px 0 0', color: '#888', fontSize: 13 },

  // Grafik
  grafikGrid:   { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginBottom: 24 },
  grafikKutu:   { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  grafikBaslik: { margin: '0 0 16px', fontSize: 15, color: '#1F6B4C', fontWeight: 700 },

  // İşlem listesi
  listeKutu:    { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  tablo:        { width: '100%', borderCollapse: 'collapse' },
  thSatir:      { background: '#f5f6fa' },
  th:           { padding: '10px 14px', fontSize: 12, color: '#888', fontWeight: 600, textAlign: 'left', borderBottom: '1px solid #eee' },
  tr:           { borderBottom: '1px solid #f5f5f5' },
  td:           { padding: '11px 14px', fontSize: 14, verticalAlign: 'middle' },
  rozetYesil:   { background: '#e8f5e9', color: '#2e7d32', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  rozetKirmizi: { background: '#fce4ec', color: '#c62828', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  silBtn:       { padding: '4px 12px', background: '#fce4ec', color: '#c62828', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 },

  // Modal
  overlay:       { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:         { background: '#fff', borderRadius: 12, padding: 32, width: '100%', maxWidth: 460, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' },
  modalBaslik:   { margin: '0 0 20px', color: '#1F6B4C' },
  turSecimSatir: { display: 'flex', gap: 8, marginBottom: 20 },
  turBtn:        { flex: 1, padding: 12, border: '2px solid #eee', borderRadius: 8, background: '#f5f5f5', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#888' },
  turBtnGelir:   { background: '#e8f5e9', color: '#2e7d32', border: '2px solid #2e7d32' },
  turBtnGider:   { background: '#fce4ec', color: '#c62828', border: '2px solid #c62828' },
  ikiliGrid:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  alan:          { marginBottom: 16 },
  etiket:        { display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 },
  girdi:         { width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 7, fontSize: 14, boxSizing: 'border-box' },
  iptalBtn:      { padding: '9px 20px', background: '#f5f5f5', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 14 },
  kaydetBtn:     { padding: '9px 24px', background: '#1F6B4C', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 14, fontWeight: 600 },
}
