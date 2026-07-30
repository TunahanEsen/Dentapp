import { useState, useEffect } from 'react'
import { useApi }  from '../../hooks/useApi'
import { useAuth } from '../../context/AuthContext'
import * as XLSX   from 'xlsx'
import { silOnay, hataGoster } from '../../utils/dialog'

const DURUMLAR    = ['Yapılacak', 'Devam Ediyor', 'Tamamlandı']
const ONCELIKLER  = ['Düşük', 'Orta', 'Yüksek']

const ONCELIK_CFG = {
  'Düşük':  { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
  'Orta':   { bg: '#fff8e1', color: '#b45309', border: '#fde68a' },
  'Yüksek': { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
}

const KOLON_CFG = {
  'Yapılacak':    { renk: '#94a3b8', ikon: '📋' },
  'Devam Ediyor': { renk: '#3b82f6', ikon: '⚙️' },
  'Tamamlandı':   { renk: '#22c55e', ikon: '✅' },
}

const BOSH = { baslik: '', aciklama: '', oncelik: 'Orta', sonTarih: '', atananCalisanId: '' }

function dt(val) {
  if (!val) return null
  return new Date(val).toLocaleString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function kisaTarih(str) {
  if (!str) return null
  return new Date(str + 'T00:00:00').toLocaleDateString('tr-TR')
}

function initials(ad) {
  if (!ad) return '?'
  return ad.split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2)
}

function sure(a, b) {
  if (!a || !b) return null
  const ms = new Date(b) - new Date(a)
  if (ms < 0) return null
  const dk = Math.floor(ms / 60000)
  if (dk < 60) return `${dk} dk`
  const sa = Math.floor(dk / 60)
  if (sa < 24) return `${sa} sa ${dk % 60} dk`
  return `${Math.floor(sa / 24)} gün ${sa % 24} sa`
}

function excelExport(gorevler) {
  function dtStr(val) {
    if (!val) return '—'
    return new Date(val).toLocaleString('tr-TR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  const sutunlar = [
    'ID', 'Başlık', 'Açıklama', 'Öncelik', 'Durum', 'Atanan Kişi', 'Son Tarih',
    'Oluşturulma Tarihi', 'Atanma Tarihi', 'Başlama Tarihi', 'Tamamlanma Tarihi',
    'Atama → Başlama Süresi', 'Başlama → Tamamlama Süresi', 'Toplam Süre',
  ]

  const veriler = [
    ['DentApp — Görev Raporu'],
    [`Rapor tarihi: ${new Date().toLocaleString('tr-TR')}`],
    [`Toplam görev sayısı: ${gorevler.length}`],
    [],
    sutunlar,
    ...gorevler.map(g => [
      g.id,
      g.baslik,
      g.aciklama ?? '',
      g.oncelik,
      g.durum,
      g.atananCalisanAd ?? '—',
      g.sonTarih ? kisaTarih(g.sonTarih) : '—',
      dtStr(g.olusturulmaTarihi),
      dtStr(g.atanmaTarihi),
      dtStr(g.baslamaTarihi),
      dtStr(g.tamamlanmaTarihi),
      sure(g.atanmaTarihi,      g.baslamaTarihi)     ?? '—',
      sure(g.baslamaTarihi,     g.tamamlanmaTarihi)  ?? '—',
      sure(g.olusturulmaTarihi, g.tamamlanmaTarihi)  ?? '—',
    ]),
  ]

  const ws = XLSX.utils.aoa_to_sheet(veriler)

  // Kolon genişlikleri
  ws['!cols'] = [
    { wch: 5 }, { wch: 36 }, { wch: 40 }, { wch: 10 }, { wch: 16 },
    { wch: 26 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
    { wch: 18 }, { wch: 24 }, { wch: 28 }, { wch: 14 },
  ]

  // Başlık satırını birleştir (A1:N1)
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 13 } }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Görevler')
  XLSX.writeFile(wb, `DentApp_Gorevler_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

function gecmiMi(sonTarih, durum) {
  return !!sonTarih && durum !== 'Tamamlandı' && new Date(sonTarih) < new Date(new Date().toDateString())
}

function siradaki(d) { return d === 'Yapılacak' ? 'Devam Ediyor' : d === 'Devam Ediyor' ? 'Tamamlandı' : null }
function onceki(d)   { return d === 'Devam Ediyor' ? 'Yapılacak' : d === 'Tamamlandı' ? 'Devam Ediyor' : null }

export default function GorevlerPage() {
  const { apiFetch }  = useApi()
  const { kullanici } = useAuth()
  const isAdmin       = kullanici?.role === 'Admin'

  const [gorevler,   setGorevler]   = useState([])
  const [calisanlar, setCalisanlar] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [modal,      setModal]      = useState(null)
  const [form,       setForm]       = useState(BOSH)
  const [kaydediyor, setKaydediyor] = useState(false)
  const [detayId,    setDetayId]    = useState(null)

  useEffect(() => { verileriGetir() }, [])

  async function verileriGetir() {
    try {
      setYukleniyor(true)
      const [g, c] = await Promise.all([apiFetch('/api/gorevler'), apiFetch('/api/calisanlar')])
      setGorevler(g)
      setCalisanlar(c)
    } finally {
      setYukleniyor(false)
    }
  }

  function modalAc(mod, gorev = null) {
    setForm(gorev
      ? { baslik: gorev.baslik, aciklama: gorev.aciklama || '', oncelik: gorev.oncelik,
          sonTarih: gorev.sonTarih || '', atananCalisanId: gorev.atananCalisanId?.toString() || '' }
      : BOSH)
    setModal({ mod, gorev })
  }

  async function formGonder(e) {
    e.preventDefault()
    setKaydediyor(true)
    const body = {
      baslik: form.baslik, aciklama: form.aciklama || null, oncelik: form.oncelik,
      sonTarih: form.sonTarih || null,
      atananCalisanId: form.atananCalisanId ? Number(form.atananCalisanId) : null,
    }
    try {
      if (modal.mod === 'yeni') {
        await apiFetch('/api/gorevler', { method: 'POST', body: JSON.stringify(body) })
      } else {
        await apiFetch(`/api/gorevler/${modal.gorev.id}`, { method: 'PUT', body: JSON.stringify(body) })
      }
      setModal(null)
      setForm(BOSH)
      await verileriGetir()
    } catch (err) { await hataGoster(err.message) }
    finally { setKaydediyor(false) }
  }

  async function durumDegistir(id, yeniDurum) {
    await apiFetch(`/api/gorevler/${id}/durum`, {
      method: 'PUT', body: JSON.stringify({ durum: yeniDurum }),
    })
    await verileriGetir()
  }

  async function gorevSil(id, baslik) {
    if (!(await silOnay(`"${baslik}" görevini silmek istediğinize emin misiniz?`))) return
    await apiFetch(`/api/gorevler/${id}`, { method: 'DELETE' })
    if (detayId === id) setDetayId(null)
    await verileriGetir()
  }

  const kolonlar = {
    'Yapılacak':    gorevler.filter(g => g.durum === 'Yapılacak'),
    'Devam Ediyor': gorevler.filter(g => g.durum === 'Devam Ediyor'),
    'Tamamlandı':   gorevler.filter(g => g.durum === 'Tamamlandı'),
  }

  const detayGorev = detayId ? gorevler.find(g => g.id === detayId) ?? null : null

  return (
    <div style={s.sayfa}>
      {/* Başlık */}
      <div style={s.baslikSatir}>
        <div>
          <h1 style={s.baslik}>Görevler</h1>
          <p style={s.altBaslik}>
            {gorevler.length} görev &nbsp;·&nbsp;
            {kolonlar['Yapılacak'].length} bekliyor &nbsp;·&nbsp;
            {kolonlar['Devam Ediyor'].length} devam ediyor &nbsp;·&nbsp;
            {kolonlar['Tamamlandı'].length} tamamlandı
          </p>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 8 }}>
            {gorevler.length > 0 && (
              <button onClick={() => excelExport(gorevler)} style={s.excelBtn}>
                ⬇ Excel
              </button>
            )}
            <button onClick={() => modalAc('yeni')} style={s.ekleBtn}>+ Yeni Görev</button>
          </div>
        )}
      </div>

      <div className="gorev-icerik" style={s.icerikSatir}>
        {/* Kanban */}
        <div className="gorev-kanban" style={s.kanban}>
          {yukleniyor ? (
            <p style={{ ...s.bilgi, gridColumn: '1/-1' }}>Yükleniyor...</p>
          ) : DURUMLAR.map(durum => {
            const cfg   = KOLON_CFG[durum]
            const liste = kolonlar[durum]
            return (
              <div key={durum} style={s.kolon}>
                <div style={{ ...s.kolonBaslik, borderTopColor: cfg.renk }}>
                  <span style={{ fontSize: 14 }}>{cfg.ikon}</span>
                  <span style={s.kolonAd}>{durum}</span>
                  <span style={{ ...s.kolonSayi, background: cfg.renk }}>{liste.length}</span>
                </div>

                <div style={s.kolonIcerik}>
                  {liste.length === 0 && <div style={s.bosKolon}>Görev yok</div>}

                  {liste.map(g => {
                    const os     = ONCELIK_CFG[g.oncelik] ?? ONCELIK_CFG['Orta']
                    const gec    = gecmiMi(g.sonTarih, g.durum)
                    const aktif  = detayId === g.id
                    return (
                      <div key={g.id}
                        onClick={() => isAdmin && setDetayId(aktif ? null : g.id)}
                        style={{ ...s.kart, ...(aktif ? s.kartAktif : {}), cursor: isAdmin ? 'pointer' : 'default' }}>

                        {/* Başlık + öncelik */}
                        <div style={s.kartUst}>
                          <span style={{ ...s.kartBaslik,
                            textDecoration: g.durum === 'Tamamlandı' ? 'line-through' : 'none',
                            opacity: g.durum === 'Tamamlandı' ? 0.6 : 1 }}>
                            {g.baslik}
                          </span>
                          <span style={{ ...s.rozet, background: os.bg, color: os.color, border: `1px solid ${os.border}` }}>
                            {g.oncelik}
                          </span>
                        </div>

                        {g.aciklama && <p style={s.aciklama}>{g.aciklama}</p>}

                        {/* Atanan kişi */}
                        {g.atananCalisanAd && (
                          <div style={s.atananSatir}>
                            <div style={s.avatar}>{initials(g.atananCalisanAd)}</div>
                            <span style={{ fontSize: 11, color: '#475569' }}>{g.atananCalisanAd}</span>
                          </div>
                        )}

                        {/* Son tarih */}
                        {g.sonTarih && (
                          <div style={{ fontSize: 11, color: gec ? '#dc2626' : '#64748b', fontWeight: gec ? 700 : 400, marginBottom: 6 }}>
                            {gec ? '⚠️ Gecikti — ' : '📅 '}{kisaTarih(g.sonTarih)}
                          </div>
                        )}

                        {/* Aksiyon butonları */}
                        <div style={s.kartAlt} onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {onceki(g.durum) && (
                              <button onClick={() => durumDegistir(g.id, onceki(g.durum))} style={s.geriBtn}>← Geri</button>
                            )}
                            {siradaki(g.durum) && (
                              <button onClick={() => durumDegistir(g.id, siradaki(g.durum))} style={s.ileriBtn}>
                                {siradaki(g.durum) === 'Devam Ediyor' ? 'Başla →' : 'Tamamla ✓'}
                              </button>
                            )}
                          </div>
                          {isAdmin && (
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button onClick={() => { setDetayId(null); modalAc('duzenle', g) }} style={s.duzenlBtn} title="Düzenle">✏️</button>
                              <button onClick={() => gorevSil(g.id, g.baslik)} style={s.silBtn} title="Sil">🗑</button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Admin Detay Paneli */}
        {isAdmin && detayGorev && (
          <div className="gorev-detay" style={s.detayPanel}>
            <div style={s.detayPanelBaslik}>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Detay</span>
              <button onClick={() => setDetayId(null)} style={s.kapatBtn}>✕</button>
            </div>

            <h3 style={s.detayBaslik}>{detayGorev.baslik}</h3>
            {detayGorev.aciklama && <p style={s.detayAciklama}>{detayGorev.aciklama}</p>}

            {/* Meta bilgiler */}
            <div style={s.metaGrid}>
              <MetaSatir etiket="Durum"   deger={detayGorev.durum} />
              <MetaSatir etiket="Öncelik" deger={detayGorev.oncelik} />
              {detayGorev.atananCalisanAd && (
                <MetaSatir etiket="Atanan" deger={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ ...s.avatar, width: 18, height: 18, fontSize: 8 }}>{initials(detayGorev.atananCalisanAd)}</div>
                    {detayGorev.atananCalisanAd}
                  </div>
                } />
              )}
              {detayGorev.sonTarih && (
                <MetaSatir etiket="Son Tarih" deger={
                  <span style={{ color: gecmiMi(detayGorev.sonTarih, detayGorev.durum) ? '#dc2626' : 'inherit' }}>
                    {kisaTarih(detayGorev.sonTarih)}{gecmiMi(detayGorev.sonTarih, detayGorev.durum) ? ' ⚠️' : ''}
                  </span>
                } />
              )}
            </div>

            {/* Zaman damgaları */}
            <div style={s.zamanBolum}>
              <p style={s.bolumBaslik}>Zaman Damgaları</p>

              <ZamanSatir etiket="Oluşturulma" deger={dt(detayGorev.olusturulmaTarihi)} renk="#475569" />
              <ZamanSatir etiket="Atanma"      deger={dt(detayGorev.atanmaTarihi)}      renk="#7c3aed"
                not={!detayGorev.atanmaTarihi ? 'kişi atanmadı' : null} />
              <ZamanSatir etiket="Başlama"     deger={dt(detayGorev.baslamaTarihi)}     renk="#1d4ed8"
                not={!detayGorev.baslamaTarihi ? 'henüz başlanmadı' : null} />
              <ZamanSatir etiket="Tamamlanma"  deger={dt(detayGorev.tamamlanmaTarihi)} renk="#166534"
                not={!detayGorev.tamamlanmaTarihi ? 'tamamlanmadı' : null} />

              {/* Süre hesapları */}
              {(detayGorev.atanmaTarihi && detayGorev.baslamaTarihi) && (
                <SureSatir etiket="Atama → Başlama" deger={sure(detayGorev.atanmaTarihi, detayGorev.baslamaTarihi)} renk="#7c3aed" />
              )}
              {(detayGorev.baslamaTarihi && detayGorev.tamamlanmaTarihi) && (
                <SureSatir etiket="Başlama → Tamamlama" deger={sure(detayGorev.baslamaTarihi, detayGorev.tamamlanmaTarihi)} renk="#166534" />
              )}
              {(detayGorev.olusturulmaTarihi && detayGorev.tamamlanmaTarihi) && (
                <div style={{ borderTop: '1px dashed #e2e8f0', marginTop: 6, paddingTop: 6 }}>
                  <SureSatir etiket="Toplam Süre" deger={sure(detayGorev.olusturulmaTarihi, detayGorev.tamamlanmaTarihi)} renk="#1F6B4C" kalın />
                </div>
              )}
            </div>

            {/* Hızlı durum değiştir */}
            <div style={{ marginTop: 14 }}>
              <p style={s.bolumBaslik}>Durum Değiştir</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {DURUMLAR.filter(d => d !== detayGorev.durum).map(d => (
                  <button key={d} onClick={() => durumDegistir(detayGorev.id, d)} style={s.durumBtn}>
                    → {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={s.overlay} onClick={() => setModal(null)}>
          <div style={s.modalKutu} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalBaslik}>{modal.mod === 'yeni' ? 'Yeni Görev' : 'Görevi Düzenle'}</h2>
            <form onSubmit={formGonder}>
              <div style={s.alan}>
                <label style={s.etiket}>Başlık *</label>
                <input style={s.girdi} required placeholder="Görev başlığı..."
                  value={form.baslik} onChange={e => setForm({ ...form, baslik: e.target.value })} />
              </div>
              <div style={s.alan}>
                <label style={s.etiket}>Açıklama</label>
                <textarea style={{ ...s.girdi, height: 68, resize: 'vertical' }} placeholder="Opsiyonel..."
                  value={form.aciklama} onChange={e => setForm({ ...form, aciklama: e.target.value })} />
              </div>
              <div style={s.ikiliGrid}>
                <div style={s.alan}>
                  <label style={s.etiket}>Öncelik</label>
                  <select style={s.girdi} value={form.oncelik}
                    onChange={e => setForm({ ...form, oncelik: e.target.value })}>
                    {ONCELIKLER.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div style={s.alan}>
                  <label style={s.etiket}>Son Tarih</label>
                  <input style={s.girdi} type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={form.sonTarih} onChange={e => setForm({ ...form, sonTarih: e.target.value })} />
                </div>
              </div>
              <div style={s.alan}>
                <label style={s.etiket}>Atanan Kişi (Staff)</label>
                <select style={s.girdi} value={form.atananCalisanId}
                  onChange={e => setForm({ ...form, atananCalisanId: e.target.value })}>
                  <option value="">— Seçiniz —</option>
                  {calisanlar.map(c => <option key={c.id} value={c.id}>{c.adSoyad} — {c.unvan}</option>)}
                </select>
              </div>
              <div style={s.modalBtnSatir}>
                <button type="button" onClick={() => setModal(null)} style={s.iptalBtn}>İptal</button>
                <button type="submit" disabled={kaydediyor} style={s.kaydetBtn}>
                  {kaydediyor ? 'Kaydediliyor...' : modal.mod === 'yeni' ? 'Oluştur' : 'Güncelle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function MetaSatir({ etiket, deger }) {
  return (
    <>
      <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{etiket}</span>
      <span style={{ fontSize: 13, color: '#334155' }}>{deger}</span>
    </>
  )
}

function ZamanSatir({ etiket, deger, renk, not }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
        {etiket}
      </div>
      {not
        ? <div style={{ fontSize: 11, color: '#cbd5e1', fontStyle: 'italic' }}>— {not}</div>
        : <div style={{ fontSize: 11, color: renk, fontFamily: 'monospace', fontWeight: 600 }}>{deger}</div>
      }
    </div>
  )
}

function SureSatir({ etiket, deger, renk, kalın }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
      <span style={{ fontSize: 11, color: '#94a3b8' }}>{etiket}</span>
      <span style={{ fontSize: 12, color: renk, fontWeight: kalın ? 800 : 600 }}>{deger}</span>
    </div>
  )
}

const s = {
  sayfa:       { padding: '24px 28px', fontFamily: 'sans-serif' },
  baslikSatir: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  baslik:      { margin: '0 0 4px', fontSize: 24, color: '#1F6B4C' },
  altBaslik:   { margin: 0, color: '#94a3b8', fontSize: 13 },
  ekleBtn:     { padding: '9px 18px', background: '#1F6B4C', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  excelBtn:    { padding: '9px 16px', background: '#fff', color: '#166534', border: '1.5px solid #bbf7d0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },

  icerikSatir: { display: 'flex', gap: 16, alignItems: 'flex-start' },
  kanban:      { flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, alignItems: 'start', minWidth: 0 },

  kolon:       { background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e8edf2' },
  kolonBaslik: { display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', borderTop: '4px solid', borderBottom: '1px solid #f0f0f0', background: '#fafafa' },
  kolonAd:     { fontWeight: 700, fontSize: 13, color: '#334155', flex: 1 },
  kolonSayi:   { fontSize: 10, color: '#fff', fontWeight: 700, padding: '2px 7px', borderRadius: 20 },

  kolonIcerik: { padding: '10px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 80 },
  bosKolon:    { textAlign: 'center', padding: '20px 0', color: '#cbd5e1', fontSize: 12, border: '2px dashed #e8edf2', borderRadius: 8 },

  kart:        { background: '#fff', borderRadius: 9, padding: '11px 12px', border: '1px solid #e8edf2', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  kartAktif:   { border: '1.5px solid #1F6B4C', boxShadow: '0 0 0 3px rgba(31,107,76,0.08)' },
  kartUst:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 5 },
  kartBaslik:  { fontWeight: 700, fontSize: 13, color: '#1e293b', lineHeight: 1.35, flex: 1 },
  rozet:       { padding: '2px 7px', borderRadius: 20, fontSize: 10, fontWeight: 700, flexShrink: 0 },
  aciklama:    { margin: '0 0 7px', fontSize: 11, color: '#94a3b8', lineHeight: 1.4 },

  atananSatir: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 },
  avatar:      { width: 24, height: 24, borderRadius: '50%', background: '#1F6B4C', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  kartAlt:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 7, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 4 },
  ileriBtn:    { padding: '3px 9px', background: '#1F6B4C', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: 11, fontWeight: 700 },
  geriBtn:     { padding: '3px 9px', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 5, cursor: 'pointer', fontSize: 11 },
  duzenlBtn:   { padding: '3px 7px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 5, cursor: 'pointer', fontSize: 12 },
  silBtn:      { padding: '3px 7px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 5, cursor: 'pointer', fontSize: 12 },
  bilgi:       { textAlign: 'center', color: '#aaa', padding: 40, fontSize: 14 },

  // Detay paneli
  detayPanel:      { width: 270, flexShrink: 0, background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.10)', border: '1px solid #e8edf2', position: 'sticky', top: 16 },
  detayPanelBaslik:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #f0f4f8' },
  kapatBtn:        { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 15 },
  detayBaslik:     { margin: '0 0 5px', fontSize: 15, fontWeight: 800, color: '#1e293b', lineHeight: 1.3 },
  detayAciklama:   { margin: '0 0 12px', fontSize: 12, color: '#94a3b8', lineHeight: 1.4 },

  metaGrid:    { display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '7px 12px', alignItems: 'center', marginBottom: 14 },

  zamanBolum:  { background: '#f8fafc', borderRadius: 8, padding: 12, border: '1px solid #e8edf2' },
  bolumBaslik: { margin: '0 0 10px', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em' },

  durumBtn:    { padding: '7px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 7, cursor: 'pointer', fontSize: 12, color: '#334155', textAlign: 'left', width: '100%' },

  // Modal
  overlay:       { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalKutu:     { background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' },
  modalBaslik:   { margin: '0 0 20px', color: '#1F6B4C', fontSize: 18 },
  ikiliGrid:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  alan:          { marginBottom: 14 },
  etiket:        { display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 },
  girdi:         { width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' },
  modalBtnSatir: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 },
  iptalBtn:      { padding: '9px 20px', background: '#f5f5f5', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 14 },
  kaydetBtn:     { padding: '9px 24px', background: '#1F6B4C', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 14, fontWeight: 700 },
}
