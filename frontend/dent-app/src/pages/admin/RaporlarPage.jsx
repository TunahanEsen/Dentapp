import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { useApi } from '../../hooks/useApi'
import { csvIndir } from '../../utils/export'

const AY_ADLARI = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
const RENKLER   = ['#1F6B4C','#2D8A62','#0288d1','#7c3aed','#e65100','#d32f2f','#00838f','#558b2f','#ad1457','#f57f17']

function buAy()  { return new Date().getMonth() + 1 }
function buYil() { return new Date().getFullYear() }

function para(v) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(v)
}

function KpiKart({ baslik, deger, ikon, renk, arka, alt }) {
  return (
    <div style={{ ...s.kpiKart, background: arka }}>
      <span style={s.kpiIkon}>{ikon}</span>
      <div>
        <div style={{ ...s.kpiDeger, color: renk }}>{deger}</div>
        <div style={s.kpiBaslik}>{baslik}</div>
        {alt && <div style={s.kpiAlt}>{alt}</div>}
      </div>
    </div>
  )
}

// ─── Özel Tooltip ─────────────────────────────────────────────────────────────
function ParaTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <strong>{label}</strong>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginTop: 4 }}>
          {p.name}: {typeof p.value === 'number' ? para(p.value) : p.value}
        </div>
      ))}
    </div>
  )
}

// ─── ANA SAYFA ────────────────────────────────────────────────────────────────
export default function RaporlarPage() {
  const { apiFetch } = useApi()
  const [sekme, setSekme] = useState('ozet')
  const [yil,   setYil]   = useState(buYil())
  const [ay,    setAy]    = useState(buAy())

  // Veri state'leri
  const [finans,      setFinans]      = useState([])
  const [yillikOzet,  setYillikOzet]  = useState([])
  const [stok,        setStok]        = useState([])
  const [islemler,    setIslemler]    = useState([])
  const [yukleniyor,  setYukleniyor]  = useState(true)

  const getir = useCallback(async () => {
    setYukleniyor(true)
    try {
      const [fin, yil_, stk, isl] = await Promise.all([
        apiFetch(`/api/gelir-gider?yil=${yil}&ay=${ay}`),
        apiFetch(`/api/gelir-gider/yillik?yil=${yil}`),
        apiFetch('/api/stok'),
        apiFetch(`/api/islem-kayitlari/aylik?yil=${yil}&ay=${ay}`),
      ])
      setFinans(fin)
      setYillikOzet(yil_)
      setStok(stk)
      setIslemler(isl)
    } finally {
      setYukleniyor(false)
    }
  }, [yil, ay])

  useEffect(() => { getir() }, [getir])

  // ─── Hesaplamalar ─────────────────────────────────────────────────────────
  const toplamGelir = finans.filter(f => f.tur === 'Gelir').reduce((t, f) => t + f.miktar, 0)
  const toplamGider = finans.filter(f => f.tur === 'Gider').reduce((t, f) => t + f.miktar, 0)
  const netKar      = toplamGelir - toplamGider

  const dusukStok   = stok.filter(k => k.miktar <= k.minimumMiktar)
  const stokDegeri  = stok.reduce((t, k) => t + (k.miktar * (k.birimFiyat || 0)), 0)

  const islemToplam  = islemler.reduce((t, k) => t + (k.farkliTutar ? (k.odenenTutar ?? k.sistemFiyati) : k.sistemFiyati), 0)
  const islemSayisi  = islemler.length

  // Stok kategori dağılımı
  const stokKatMap = {}
  stok.forEach(k => {
    if (!stokKatMap[k.kategori]) stokKatMap[k.kategori] = { sayi: 0, deger: 0 }
    stokKatMap[k.kategori].sayi++
    stokKatMap[k.kategori].deger += k.miktar * (k.birimFiyat || 0)
  })
  const stokKatVeri = Object.entries(stokKatMap).map(([name, v]) => ({ name, ...v }))

  // İşlem kategori dağılımı
  const islemKatMap = {}
  islemler.forEach(k => {
    const kat = k.tedaviKategori || 'Diğer'
    if (!islemKatMap[kat]) islemKatMap[kat] = { sayi: 0, tutar: 0 }
    islemKatMap[kat].sayi++
    islemKatMap[kat].tutar += k.farkliTutar ? (k.odenenTutar ?? k.sistemFiyati) : k.sistemFiyati
  })
  const islemKatVeri = Object.entries(islemKatMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.tutar - a.tutar)

  // Ödeme yöntemi dağılımı
  const odemeMap = {}
  islemler.forEach(k => {
    const tutar = k.farkliTutar ? (k.odenenTutar ?? k.sistemFiyati) : k.sistemFiyati
    odemeMap[k.odemeYontemi] = (odemeMap[k.odemeYontemi] || 0) + tutar
  })
  const odemeVeri = Object.entries(odemeMap).map(([name, value]) => ({ name, value }))

  // Doktor bazlı özet
  const doktorMap = {}
  islemler.forEach(k => {
    if (!doktorMap[k.doktorAd]) doktorMap[k.doktorAd] = { sayi: 0, tutar: 0 }
    doktorMap[k.doktorAd].sayi++
    doktorMap[k.doktorAd].tutar += k.farkliTutar ? (k.odenenTutar ?? k.sistemFiyati) : k.sistemFiyati
  })
  const doktorVeri = Object.entries(doktorMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.tutar - a.tutar)

  const yilSecenekleri = Array.from({ length: 5 }, (_, i) => buYil() - i)

  const SEKMELER = [
    { id: 'ozet',   etiket: '📊 Genel Özet' },
    { id: 'stok',   etiket: '📦 Stok Analizi' },
    { id: 'islem',  etiket: '🦷 İşlem Analizi' },
  ]

  return (
    <div style={s.sayfa}>
      {/* Başlık */}
      <div style={s.baslikSatir}>
        <div>
          <h1 style={s.baslik}>Raporlar</h1>
          <p style={s.altBaslik}>Klinik performans ve analiz özeti</p>
        </div>
        <div style={s.filtreler}>
          <select style={s.sec} value={ay} onChange={e => setAy(Number(e.target.value))}>
            {AY_ADLARI.map((ad, i) => <option key={i} value={i+1}>{ad}</option>)}
          </select>
          <select style={s.sec} value={yil} onChange={e => setYil(Number(e.target.value))}>
            {yilSecenekleri.map(y => <option key={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Sekmeler */}
      <div style={s.sekmeSatir}>
        {SEKMELER.map(sk => (
          <button key={sk.id} style={{ ...s.sekme, ...(sekme === sk.id ? s.sekmeAktif : {}) }}
            onClick={() => setSekme(sk.id)}>
            {sk.etiket}
          </button>
        ))}
      </div>

      {yukleniyor ? (
        <div style={s.yukleniyorKutu}>Yükleniyor...</div>
      ) : (
        <>
          {/* ═══════════════════ GENEL ÖZET ═══════════════════ */}
          {sekme === 'ozet' && (
            <div>
              {/* KPI Kartlar */}
              <div style={s.kpiGrid}>
                <KpiKart baslik="Toplam Gelir"  deger={para(toplamGelir)}  ikon="💰" renk="#2e7d32" arka="#e8f5e9" alt={`${AY_ADLARI[ay-1]} ${yil}`} />
                <KpiKart baslik="Toplam Gider"  deger={para(toplamGider)}  ikon="💸" renk="#c62828" arka="#fce4ec" alt={`${AY_ADLARI[ay-1]} ${yil}`} />
                <KpiKart baslik="Net Kâr"       deger={para(netKar)}       ikon={netKar >= 0 ? '📈' : '📉'} renk={netKar >= 0 ? '#2e7d32' : '#c62828'} arka={netKar >= 0 ? '#e8f5e9' : '#fce4ec'} />
                <KpiKart baslik="İşlem Geliri"  deger={para(islemToplam)}  ikon="🦷" renk="#1565c0" arka="#E3F2FD" alt={`${islemSayisi} işlem`} />
                <KpiKart baslik="Toplam Stok Değeri" deger={para(stokDegeri)} ikon="📦" renk="#6a1b9a" arka="#F3E5F5" alt={`${stok.length} kalem`} />
                <KpiKart baslik="Düşük Stok"    deger={dusukStok.length}   ikon="⚠️" renk="#e65100" arka="#FFF3E0" alt="kritik seviye" />
              </div>

              {/* Yıllık Gelir/Gider Grafiği */}
              <div style={s.grafikKutu}>
                <h3 style={s.grafikBaslik}>{yil} Yılı — Aylık Gelir / Gider ve Net Kâr</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={yillikOzet} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="ayAdi" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₺${(v/1000).toFixed(0)}K`} />
                    <Tooltip content={<ParaTooltip />} />
                    <Legend />
                    <Bar dataKey="gelir" name="Gelir" fill="#2e7d32" radius={[4,4,0,0]} />
                    <Bar dataKey="gider" name="Gider" fill="#c62828" radius={[4,4,0,0]} />
                    <Line type="monotone" dataKey="net" name="Net Kâr" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Yıllık özet tablosu */}
              <div style={s.grafikKutu}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ ...s.grafikBaslik, margin: 0 }}>{yil} Aylık Özet Tablosu</h3>
                  <button style={s.csvBtn} onClick={() => csvIndir(
                    yillikOzet.map(r => ({ 'Ay': r.ayAdi, 'Gelir (₺)': r.gelir, 'Gider (₺)': r.gider, 'Net (₺)': r.net })),
                    `finans-yillik-${yil}`
                  )}>⬇ CSV</button>
                </div>
                <div className="rapor-tablo-sarici"><table style={s.tablo}>
                  <thead>
                    <tr style={{ background: '#f5f6fa' }}>
                      {['Ay','Gelir','Gider','Net Kâr'].map(h => <th key={h} style={s.th}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {yillikOzet.map(r => (
                      <tr key={r.ay} style={{ borderBottom: '1px solid #f0f0f0', background: r.ay === ay ? '#F0FFF8' : 'transparent' }}>
                        <td style={s.td}><strong>{r.ayAdi}</strong>{r.ay === ay && <span style={s.aktifRozet}>bu ay</span>}</td>
                        <td style={{ ...s.td, color: '#2e7d32', fontWeight: 600 }}>{para(r.gelir)}</td>
                        <td style={{ ...s.td, color: '#c62828', fontWeight: 600 }}>{para(r.gider)}</td>
                        <td style={{ ...s.td, fontWeight: 700, color: r.net >= 0 ? '#2e7d32' : '#c62828' }}>{para(r.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f5f6fa', fontWeight: 700 }}>
                      <td style={s.td}>Yıl Toplamı</td>
                      <td style={{ ...s.td, color: '#2e7d32' }}>{para(yillikOzet.reduce((t, r) => t + r.gelir, 0))}</td>
                      <td style={{ ...s.td, color: '#c62828' }}>{para(yillikOzet.reduce((t, r) => t + r.gider, 0))}</td>
                      <td style={{ ...s.td, color: yillikOzet.reduce((t, r) => t + r.net, 0) >= 0 ? '#2e7d32' : '#c62828' }}>
                        {para(yillikOzet.reduce((t, r) => t + r.net, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table></div>
              </div>
            </div>
          )}

          {/* ═══════════════════ STOK ANALİZİ ═══════════════════ */}
          {sekme === 'stok' && (
            <div>
              {/* KPI */}
              <div style={s.kpiGrid}>
                <KpiKart baslik="Toplam Kalem"    deger={stok.length}        ikon="📦" renk="#1F6B4C" arka="#E8F5EE" />
                <KpiKart baslik="Toplam Değer"    deger={para(stokDegeri)}   ikon="💰" renk="#1565c0" arka="#E3F2FD" />
                <KpiKart baslik="Düşük Stok"      deger={dusukStok.length}   ikon="⚠️" renk="#e65100" arka="#FFF3E0" alt="minimum altı" />
                <KpiKart baslik="Normal Seviye"   deger={stok.length - dusukStok.length} ikon="✅" renk="#2e7d32" arka="#e8f5e9" />
              </div>

              <div className="rapor-ikili-grid" style={s.grafikIkiliGrid}>
                {/* Kategori Pasta */}
                <div style={s.grafikKutu}>
                  <h3 style={s.grafikBaslik}>Kategoriye Göre Stok Sayısı</h3>
                  {stokKatVeri.length === 0 ? <p style={s.bos}>Stok verisi yok.</p> : (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={stokKatVeri} dataKey="sayi" nameKey="name"
                          cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3}>
                          {stokKatVeri.map((_, i) => <Cell key={i} fill={RENKLER[i % RENKLER.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v, n) => [v + ' kalem', n]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Kategori Değer Bar */}
                <div style={s.grafikKutu}>
                  <h3 style={s.grafikBaslik}>Kategori Stok Değeri (₺)</h3>
                  {stokKatVeri.length === 0 ? <p style={s.bos}>Stok verisi yok.</p> : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={stokKatVeri} layout="vertical" margin={{ left: 20, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `₺${(v/1000).toFixed(0)}K`} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={90} />
                        <Tooltip formatter={v => para(v)} />
                        <Bar dataKey="deger" name="Değer" fill="#1F6B4C" radius={[0,4,4,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Düşük Stok Tablosu */}
              <div style={s.grafikKutu}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ ...s.grafikBaslik, margin: 0 }}>
                    ⚠️ Kritik Stok Seviyeleri
                    {dusukStok.length > 0 && <span style={s.uyariRozet}>{dusukStok.length} ürün</span>}
                  </h3>
                  <button style={s.csvBtn} onClick={() => csvIndir(
                    stok.map(k => ({
                      'Ürün Adı': k.urunAdi, 'Kategori': k.kategori,
                      'Mevcut': k.miktar, 'Minimum': k.minimumMiktar,
                      'Birim': k.birim, 'Birim Fiyat': k.birimFiyat || 0,
                      'Toplam Değer': k.miktar * (k.birimFiyat || 0)
                    })), 'stok-raporu'
                  )}>⬇ Tüm Stok CSV</button>
                </div>
                {dusukStok.length === 0 ? (
                  <div style={s.basariKutu}>✅ Tüm ürünler yeterli stok seviyesinde.</div>
                ) : (
                  <div className="rapor-tablo-sarici"><table style={s.tablo}>
                    <thead>
                      <tr style={{ background: '#FFF3E0' }}>
                        {['Ürün', 'Kategori', 'Mevcut', 'Minimum', 'Durum'].map(h => <th key={h} style={s.th}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {dusukStok.map(k => {
                        const oran = k.minimumMiktar > 0 ? (k.miktar / k.minimumMiktar) : 1
                        const kritik = oran === 0
                        return (
                          <tr key={k.id} style={{ borderBottom: '1px solid #f0f0f0', background: kritik ? '#FFF8F8' : '#FFFDF8' }}>
                            <td style={{ ...s.td, fontWeight: 600 }}>{k.urunAdi}</td>
                            <td style={s.td}>{k.kategori}</td>
                            <td style={{ ...s.td, color: '#e65100', fontWeight: 700 }}>{k.miktar} {k.birim}</td>
                            <td style={s.td}>{k.minimumMiktar} {k.birim}</td>
                            <td style={s.td}>
                              <span style={kritik ? s.rozetSifir : s.rozetDusuk}>
                                {kritik ? '🔴 Tükendi' : '🟠 Düşük'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table></div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════ İŞLEM ANALİZİ ═══════════════════ */}
          {sekme === 'islem' && (
            <div>
              {/* KPI */}
              <div style={s.kpiGrid}>
                <KpiKart baslik="Toplam İşlem"  deger={islemSayisi}         ikon="🦷" renk="#1F6B4C" arka="#E8F5EE" alt={`${AY_ADLARI[ay-1]} ${yil}`} />
                <KpiKart baslik="Toplam Gelir"  deger={para(islemToplam)}   ikon="💰" renk="#2e7d32" arka="#e8f5e9" />
                <KpiKart baslik="Ort. İşlem Değeri" deger={islemSayisi > 0 ? para(islemToplam / islemSayisi) : '—'} ikon="📊" renk="#1565c0" arka="#E3F2FD" />
                <KpiKart baslik="Aktif Doktor"  deger={Object.keys(doktorMap).length} ikon="👨‍⚕️" renk="#6a1b9a" arka="#F3E5F5" />
              </div>

              {islemler.length === 0 ? (
                <div style={s.bosKutu}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🦷</div>
                  <p style={{ color: '#888', margin: 0 }}>Bu ay henüz işlem kaydı bulunmuyor.</p>
                </div>
              ) : (
                <>
                  <div className="rapor-ikili-grid" style={s.grafikIkiliGrid}>
                    {/* Tedavi Kategorisi */}
                    <div style={s.grafikKutu}>
                      <h3 style={s.grafikBaslik}>Tedavi Kategorisi Geliri</h3>
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={islemKatVeri} margin={{ top: 5, right: 10, left: 10, bottom: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" interval={0} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₺${(v/1000).toFixed(0)}K`} />
                          <Tooltip content={<ParaTooltip />} />
                          <Bar dataKey="tutar" name="Gelir" fill="#1F6B4C" radius={[4,4,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Ödeme Yöntemi */}
                    <div style={s.grafikKutu}>
                      <h3 style={s.grafikBaslik}>Ödeme Yöntemi Dağılımı</h3>
                      {odemeVeri.length === 0 ? <p style={s.bos}>Veri yok.</p> : (
                        <ResponsiveContainer width="100%" height={260}>
                          <PieChart>
                            <Pie data={odemeVeri} dataKey="value" nameKey="name"
                              cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3}
                              label={({ name, percent }) => `${name} %${(percent*100).toFixed(0)}`}
                              labelLine={false}>
                              {odemeVeri.map((_, i) => <Cell key={i} fill={RENKLER[i % RENKLER.length]} />)}
                            </Pie>
                            <Tooltip formatter={v => para(v)} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Doktor Performans */}
                  <div style={s.grafikKutu}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h3 style={{ ...s.grafikBaslik, margin: 0 }}>Doktor Bazlı Performans — {AY_ADLARI[ay-1]} {yil}</h3>
                      <button style={s.csvBtn} onClick={() => csvIndir(
                        islemler.map(k => ({
                          'Tarih': new Date(k.tarih).toLocaleDateString('tr-TR'),
                          'Doktor': k.doktorAd,
                          'Tedavi': k.tedaviAd,
                          'Kategori': k.tedaviKategori,
                          'Ödeme': k.odemeYontemi,
                          'Tutar (₺)': k.farkliTutar ? (k.odenenTutar ?? k.sistemFiyati) : k.sistemFiyati
                        })), `islem-raporu-${yil}-${ay}`
                      )}>⬇ CSV</button>
                    </div>
                    <div className="rapor-tablo-sarici"><table style={s.tablo}>
                      <thead>
                        <tr style={{ background: '#f5f6fa' }}>
                          {['Doktor','İşlem Sayısı','Toplam Gelir','Ort. İşlem Değeri','Pay %'].map(h => <th key={h} style={s.th}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {doktorVeri.map((d, i) => (
                          <tr key={d.name} style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ ...s.td, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ ...s.doktorAvatar, background: RENKLER[i % RENKLER.length] }}>
                                {d.name.split(' ').filter(k => k !== 'Dr.').map(k => k[0] || '').join('').substring(0,2).toUpperCase()}
                              </div>
                              {d.name}
                            </td>
                            <td style={s.td}>{d.sayi}</td>
                            <td style={{ ...s.td, fontWeight: 700, color: '#2e7d32' }}>{para(d.tutar)}</td>
                            <td style={s.td}>{para(d.tutar / d.sayi)}</td>
                            <td style={s.td}>
                              <div style={s.paySatir}>
                                <div style={{ ...s.payBar, width: `${islemToplam > 0 ? (d.tutar/islemToplam*100) : 0}%` }} />
                                <span style={s.payYuzde}>%{islemToplam > 0 ? (d.tutar/islemToplam*100).toFixed(1) : 0}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table></div>
                  </div>

                  {/* Kategori detayı */}
                  <div style={s.grafikKutu}>
                    <h3 style={s.grafikBaslik}>Tedavi Kategorisi Detayı</h3>
                    <div className="rapor-tablo-sarici"><table style={s.tablo}>
                      <thead>
                        <tr style={{ background: '#f5f6fa' }}>
                          {['Kategori','İşlem Sayısı','Toplam Gelir','Ort. Değer'].map(h => <th key={h} style={s.th}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {islemKatVeri.map((k, i) => (
                          <tr key={k.name} style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ ...s.td, display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 10, height: 10, borderRadius: '50%', background: RENKLER[i % RENKLER.length], flexShrink: 0 }} />
                              {k.name}
                            </td>
                            <td style={s.td}>{k.sayi}</td>
                            <td style={{ ...s.td, fontWeight: 600, color: '#2e7d32' }}>{para(k.tutar)}</td>
                            <td style={s.td}>{para(k.tutar / k.sayi)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table></div>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── STİLLER ─────────────────────────────────────────────────────────────────
const s = {
  sayfa:       { padding: 32, fontFamily: 'sans-serif', maxWidth: 1200 },
  baslikSatir: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  baslik:      { margin: '0 0 4px', fontSize: 26, color: '#1F6B4C' },
  altBaslik:   { margin: 0, color: '#888', fontSize: 14 },
  filtreler:   { display: 'flex', gap: 8 },
  sec:         { padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, background: '#fff' },

  sekmeSatir:  { display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid #eee', paddingBottom: 0 },
  sekme:       { padding: '10px 20px', background: 'none', border: 'none', borderBottom: '2px solid transparent',
                 marginBottom: -2, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#888', borderRadius: '8px 8px 0 0' },
  sekmeAktif:  { color: '#1F6B4C', borderBottomColor: '#1F6B4C', background: '#F0FFF8' },

  yukleniyorKutu: { textAlign: 'center', padding: 60, color: '#aaa' },

  kpiGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 14, marginBottom: 24 },
  kpiKart:  { borderRadius: 12, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  kpiIkon:  { fontSize: 28 },
  kpiDeger: { fontSize: 20, fontWeight: 800, margin: 0 },
  kpiBaslik:{ fontSize: 12, color: '#888', marginTop: 3 },
  kpiAlt:   { fontSize: 11, color: '#aaa', marginTop: 2 },

  grafikKutu:    { background: '#fff', borderRadius: 12, padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: 20 },
  grafikIkiliGrid:{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 },
  grafikBaslik:  { margin: '0 0 16px', fontSize: 15, color: '#1F6B4C', fontWeight: 700 },

  tablo:    { width: '100%', borderCollapse: 'collapse' },
  th:       { padding: '10px 14px', fontSize: 12, color: '#666', fontWeight: 600, textAlign: 'left', borderBottom: '1px solid #eee' },
  td:       { padding: '11px 14px', fontSize: 14, verticalAlign: 'middle' },

  aktifRozet: { marginLeft: 8, fontSize: 10, background: '#1F6B4C', color: '#fff', padding: '2px 8px', borderRadius: 10 },
  uyariRozet: { marginLeft: 10, fontSize: 11, background: '#FFF3E0', color: '#e65100', padding: '2px 10px', borderRadius: 10, fontWeight: 600 },

  rozetDusuk: { background: '#FFF3E0', color: '#e65100', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  rozetSifir: { background: '#FFF0F0', color: '#c62828', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },

  basariKutu: { background: '#E8F5EE', color: '#1F6B4C', padding: '16px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14 },
  bosKutu:    { textAlign: 'center', padding: '60px 0', color: '#aaa' },
  bos:        { textAlign: 'center', color: '#aaa', padding: 40 },

  csvBtn:    { padding: '7px 14px', background: '#fff', color: '#555', border: '1px solid #ddd', borderRadius: 7, fontSize: 13, cursor: 'pointer' },

  doktorAvatar: { width: 30, height: 30, borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 },

  paySatir: { display: 'flex', alignItems: 'center', gap: 8 },
  payBar:   { height: 8, background: '#1F6B4C', borderRadius: 4, minWidth: 2, maxWidth: 120, transition: 'width 0.4s' },
  payYuzde: { fontSize: 12, color: '#666', whiteSpace: 'nowrap' },
}
