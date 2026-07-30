import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useApi } from '../../hooks/useApi'

export default function GenelBakisPage() {
  const { kullanici } = useAuth()
  const { apiFetch }  = useApi()
  const navigate      = useNavigate()
  const isAdmin       = kullanici?.role === 'Admin'

  const [yukleniyor,    setYukleniyor]    = useState(true)
  const [dusukStoklar,  setDusukStoklar]  = useState([])
  const [toplamUrun,    setToplamUrun]    = useState(0)
  const [bekleyenTalep, setBekleyenTalep] = useState(0)
  const [bugunIslemler, setBugunIslemler] = useState([])
  const [aylikOzet,     setAylikOzet]    = useState(null)
  const [gorevler,      setGorevler]     = useState([])

  const simdi  = new Date()
  const bugun  = simdi.toISOString().split('T')[0]
  const buAy   = simdi.getMonth() + 1
  const buYil  = simdi.getFullYear()

  useEffect(() => {
    async function verileriGetir() {
      try {
        const [stok, randevular, islemler, yillik, gorevVerisi] = await Promise.all([
          apiFetch('/api/stok'),
          apiFetch('/api/randevu-talepleri'),
          apiFetch(`/api/islem-kayitlari?tarih=${bugun}`),
          apiFetch(`/api/gelir-gider/yillik?yil=${buYil}`),
          apiFetch('/api/gorevler'),
        ])
        setToplamUrun(stok.length)
        setDusukStoklar(stok.filter(k => k.dusukStok))
        setBekleyenTalep(randevular.filter(r => r.durum === 'Bekliyor').length)
        setBugunIslemler(islemler)
        setAylikOzet(yillik.find(a => a.ay === buAy) ?? null)
        setGorevler(gorevVerisi.filter(g => g.durum !== 'Tamamlandı').slice(0, 5))
      } catch (_) {
      } finally {
        setYukleniyor(false)
      }
    }
    verileriGetir()
  }, [])

  const bugunGelir = bugunIslemler.reduce(
    (t, k) => t + (k.farkliTutar ? (k.odenenTutar ?? k.sistemFiyati) : k.sistemFiyati), 0
  )

  if (yukleniyor) {
    return (
      <div style={{ padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: '#5A7A6A', fontSize: 15 }}>
        Yükleniyor...
      </div>
    )
  }

  return (
    <div style={s.sayfa}>

      {/* Karşılama */}
      <div style={s.hosgeldin}>
        <h1 style={s.baslik}>Hoş geldin, {kullanici?.fullName} 👋</h1>
        <p style={s.altYazi}>
          {simdi.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat Kartları */}
      <div style={s.statGrid}>
        <StatKart ikon="📦" renk="#1F6B4C"
          sayi={toplamUrun} etiket="Kayıtlı Ürün"
          tikla={() => navigate('/dashboard/stok')} />
        <StatKart
          ikon={dusukStoklar.length > 0 ? '⚠️' : '✅'}
          renk={dusukStoklar.length > 0 ? '#e65100' : '#2e7d32'}
          sayi={dusukStoklar.length} etiket="Düşük Stok"
          tikla={() => navigate('/dashboard/stok')} />
        <StatKart
          ikon="📋"
          renk={bekleyenTalep > 0 ? '#b45309' : '#1F6B4C'}
          sayi={bekleyenTalep} etiket="Bekleyen Randevu"
          tikla={() => navigate('/dashboard/randevular')} />
        <StatKart
          ikon="✅"
          renk={gorevler.length > 0 ? '#7c3aed' : '#1F6B4C'}
          sayi={gorevler.length} etiket="Açık Görev"
          tikla={() => navigate('/dashboard/gorevler')} />
        {isAdmin && (
          <StatKart ikon="💰" renk="#0891b2"
            sayi={`₺${bugunGelir.toLocaleString('tr-TR')}`} etiket="Bugünkü Gelir"
            tikla={() => navigate('/dashboard/islemler')} />
        )}
      </div>

      {/* Orta: Bugünkü İşlemler + Aylık Finans */}
      <div className="genel-bakis-grid" style={{ ...s.ortaGrid, gridTemplateColumns: isAdmin ? '1fr 1fr' : '1fr' }}>

        {/* Bugünkü İşlemler */}
        <div style={s.kart}>
          <div style={s.kartBaslik}>
            <span>🦷 Bugünkü İşlemler</span>
            <button style={s.tumunuGorBtn} onClick={() => navigate('/dashboard/islemler')}>Tümünü Gör →</button>
          </div>
          {bugunIslemler.length === 0 ? (
            <div style={s.bos}>Bugün henüz işlem kaydı yok.</div>
          ) : (
            <>
              <div style={s.islemOzet}>
                <div style={s.islemOzetKutu}>
                  <div style={s.islemOzetSayi}>{bugunIslemler.length}</div>
                  <div style={s.islemOzetYazi}>İşlem</div>
                </div>
                <div style={s.islemOzetAyrac} />
                <div style={s.islemOzetKutu}>
                  <div style={{ ...s.islemOzetSayi, color: '#0891b2' }}>
                    ₺{bugunGelir.toLocaleString('tr-TR')}
                  </div>
                  <div style={s.islemOzetYazi}>Toplam Gelir</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {bugunIslemler.slice(0, 4).map(k => {
                  const tutar = k.farkliTutar ? (k.odenenTutar ?? k.sistemFiyati) : k.sistemFiyati
                  return (
                    <div key={k.id} style={s.islemSatir}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={s.islemTedavi}>{k.tedaviAd}</div>
                        <div style={s.islemDoktor}>{k.doktorAd}</div>
                      </div>
                      <div style={s.islemTutar}>₺{tutar.toLocaleString('tr-TR')}</div>
                    </div>
                  )
                })}
                {bugunIslemler.length > 4 && (
                  <div style={{ fontSize: 12, color: '#aaa', textAlign: 'center', padding: '8px 0' }}>
                    +{bugunIslemler.length - 4} işlem daha
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Bu Ay Finansal Özet — sadece Admin */}
        {isAdmin && (
          <div style={s.kart}>
            <div style={s.kartBaslik}>
              <span>📈 Bu Ay Finansal Özet</span>
              <button style={s.tumunuGorBtn} onClick={() => navigate('/dashboard/finans')}>Detay →</button>
            </div>
            {!aylikOzet || (aylikOzet.gelir === 0 && aylikOzet.gider === 0) ? (
              <div style={s.bos}>Bu ay için kayıt bulunamadı.</div>
            ) : (
              <>
                <div style={s.finansGrid}>
                  <div style={{ ...s.finansKutu, borderColor: '#bbf7d0', background: '#f0fdf4' }}>
                    <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, marginBottom: 4 }}>Gelir</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#15803d' }}>
                      ₺{aylikOzet.gelir.toLocaleString('tr-TR')}
                    </div>
                  </div>
                  <div style={{ ...s.finansKutu, borderColor: '#fecaca', background: '#fff1f2' }}>
                    <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 600, marginBottom: 4 }}>Gider</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#b91c1c' }}>
                      ₺{aylikOzet.gider.toLocaleString('tr-TR')}
                    </div>
                  </div>
                </div>
                <div style={{
                  ...s.finansKutu, marginTop: 12,
                  borderColor: aylikOzet.net >= 0 ? '#bbf7d0' : '#fecaca',
                  background:  aylikOzet.net >= 0 ? '#f0fdf4'  : '#fff1f2',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: aylikOzet.net >= 0 ? '#16a34a' : '#dc2626', marginBottom: 4 }}>
                    Net Kâr / Zarar
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: aylikOzet.net >= 0 ? '#15803d' : '#b91c1c' }}>
                    {aylikOzet.net >= 0 ? '+' : ''}₺{aylikOzet.net.toLocaleString('tr-TR')}
                  </div>
                </div>
                {aylikOzet.gelir > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888', marginBottom: 6 }}>
                      <span>Gider / Gelir Oranı</span>
                      <span>%{Math.min(100, ((aylikOzet.gider / aylikOzet.gelir) * 100).toFixed(0))}</span>
                    </div>
                    <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(100, (aylikOzet.gider / aylikOzet.gelir) * 100).toFixed(0)}%`,
                        background: aylikOzet.net >= 0 ? '#16a34a' : '#dc2626',
                        borderRadius: 4,
                      }} />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Açık Görevler */}
      {gorevler.length > 0 && (
        <div style={{ ...s.kart, marginBottom: 16 }}>
          <div style={s.kartBaslik}>
            <span>✅ Açık Görevler</span>
            <button style={s.tumunuGorBtn} onClick={() => navigate('/dashboard/gorevler')}>Tümünü Gör →</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {gorevler.map(g => (
              <div key={g.id} style={s.gorevSatir}>
                <span style={{
                  ...s.rozet,
                  background: g.oncelik === 'Yüksek' ? '#fee2e2' : g.oncelik === 'Orta' ? '#fef3c7' : '#f0fdf4',
                  color:      g.oncelik === 'Yüksek' ? '#dc2626' : g.oncelik === 'Orta' ? '#d97706' : '#16a34a',
                }}>
                  {g.oncelik}
                </span>
                <span style={s.gorevBaslik}>{g.baslik}</span>
                {g.atananCalisanAd && (
                  <span style={{ fontSize: 12, color: '#888' }}>{g.atananCalisanAd}</span>
                )}
                <span style={{
                  ...s.rozet,
                  background: g.durum === 'Devam Ediyor' ? '#dbeafe' : '#f3f4f6',
                  color:      g.durum === 'Devam Ediyor' ? '#1d4ed8' : '#6b7280',
                }}>
                  {g.durum}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uyarılar */}
      {bekleyenTalep > 0 && (
        <div style={s.randevuUyari}>
          <span>📋</span>
          <span><strong>{bekleyenTalep} randevu talebi</strong> yanıt bekliyor.</span>
          <button onClick={() => navigate('/dashboard/randevular')} style={s.uyariBtn}>
            Randevulara Git →
          </button>
        </div>
      )}

      {dusukStoklar.length > 0 && (
        <div style={s.uyariKart}>
          <div style={s.uyariBaslik}>
            <span>⚠️</span>
            <strong style={{ color: '#92400e', fontSize: 13 }}>
              {dusukStoklar.length} üründe düşük stok
            </strong>
            <button onClick={() => navigate('/dashboard/stok')} style={s.uyariBtn}>
              Stok Sayfası →
            </button>
          </div>
          <div style={s.uyariListesi}>
            {dusukStoklar.map(k => (
              <div key={k.id} style={s.uyariSatir}>
                <span style={s.uyariUrunAd}>{k.urunAdi}</span>
                <span style={s.uyariRakam}>{k.miktar} / {k.minimumMiktar} {k.birim}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatKart({ ikon, renk, sayi, etiket, tikla }) {
  return (
    <div
      onClick={tikla}
      style={{ background: '#fff', borderRadius: 12, padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `4px solid ${renk}`, cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.10)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)' }}
    >
      <span style={{ fontSize: 28 }}>{ikon}</span>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color: renk, lineHeight: 1 }}>{sayi}</div>
        <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{etiket}</div>
      </div>
    </div>
  )
}

const s = {
  sayfa:    { padding: 32, fontFamily: 'sans-serif' },
  hosgeldin:{ background: '#fff', borderRadius: 12, padding: '24px 28px', marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  baslik:   { margin: '0 0 4px', fontSize: 24, color: '#1F6B4C' },
  altYazi:  { margin: 0, color: '#777', fontSize: 14 },

  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 20 },
  ortaGrid: { display: 'grid', gap: 16, marginBottom: 16 },

  kart:         { background: '#fff', borderRadius: 12, padding: '20px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 0 },
  kartBaslik:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, fontSize: 14, fontWeight: 700, color: '#1A3329' },
  tumunuGorBtn: { background: 'none', border: 'none', color: '#1F6B4C', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 },
  bos:          { color: '#bbb', fontSize: 14, textAlign: 'center', padding: '24px 0' },

  islemOzet:      { display: 'flex', alignItems: 'center', background: '#F5FAF7', borderRadius: 10, padding: '14px 20px', marginBottom: 14 },
  islemOzetKutu:  { flex: 1, textAlign: 'center' },
  islemOzetSayi:  { fontSize: 22, fontWeight: 800, color: '#1F6B4C', lineHeight: 1 },
  islemOzetYazi:  { fontSize: 12, color: '#888', marginTop: 4 },
  islemOzetAyrac: { width: 1, height: 40, background: '#ddd', flexShrink: 0 },
  islemSatir:     { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f5f5f5' },
  islemTedavi:    { fontSize: 13, fontWeight: 600, color: '#1A3329', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  islemDoktor:    { fontSize: 12, color: '#999', marginTop: 2 },
  islemTutar:     { fontSize: 14, fontWeight: 700, color: '#1F6B4C', flexShrink: 0 },

  finansGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  finansKutu: { borderRadius: 10, padding: '14px 16px', border: '1px solid #e0e0e0' },

  gorevSatir: { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: '#F9FAFB', borderRadius: 8 },
  gorevBaslik:{ flex: 1, fontSize: 13, fontWeight: 500, color: '#1A3329', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  rozet:      { fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, flexShrink: 0 },

  uyariKart:    { background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', marginTop: 16 },
  uyariBaslik:  { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
  uyariBtn:     { marginLeft: 'auto', padding: '4px 12px', background: '#1F6B4C', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  uyariListesi: { display: 'flex', flexDirection: 'column', gap: 5 },
  uyariSatir:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '4px 2px', borderBottom: '1px solid #fef9c3' },
  uyariUrunAd:  { color: '#78350f' },
  uyariRakam:   { fontSize: 12, color: '#e65100', fontWeight: 600 },
  randevuUyari: { background: '#fff8e1', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, color: '#92400e', fontSize: 13, flexWrap: 'wrap' },
}
