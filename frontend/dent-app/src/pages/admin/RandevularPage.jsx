import { useState, useEffect } from 'react'
import { useApi } from '../../hooks/useApi'
import { silOnay, hataGoster, bilgiGoster } from '../../utils/dialog'

const DURUM_STIL = {
  'Bekliyor':   { bg: '#fff8e1', color: '#b45309', border: '#fde68a' },
  'Görüşüldü': { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
  'İptal':      { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
}

function telToWa(tel) {
  const d = tel.replace(/\D/g, '')
  if (d.startsWith('90')) return d
  if (d.startsWith('0'))  return '90' + d.slice(1)
  return '90' + d
}

function tarihFormatla(iso) {
  if (!iso) return null
  const [y, m, g] = iso.split('-')
  return `${g}.${m}.${y}`
}

export default function RandevularPage() {
  const { apiFetch } = useApi()

  const [talepler,   setTalepler]   = useState([])
  const [calisanlar, setCalisanlar] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata,       setHata]       = useState(null)
  const [filtre,     setFiltre]     = useState('Tümü')

  const [modal,      setModal]      = useState(null)
  const [kaydediyor, setKaydediyor] = useState(false)

  useEffect(() => { verileriGetir() }, [])

  async function verileriGetir() {
    try {
      setYukleniyor(true)
      const [talepVeri, calisanVeri] = await Promise.all([
        apiFetch('/api/randevu-talepleri'),
        apiFetch('/api/calisanlar'),
      ])
      setTalepler(talepVeri)
      setCalisanlar(calisanVeri)
      setHata(null)
    } catch (e) {
      setHata(e.message)
    } finally {
      setYukleniyor(false)
    }
  }

  function modalAc(talep) {
    setModal({
      talep,
      durum:       'Görüşüldü',
      calisanId:   calisanlar[0]?.id ?? '',
      iptalSebebi: '',
    })
  }

  function modalKapat() { setModal(null) }

  async function durumGuncelle() {
    if (!modal) return
    if (modal.durum === 'Görüşüldü' && !modal.calisanId) {
      await bilgiGoster('Lütfen görüşen çalışanı seçin.')
      return
    }
    if (modal.durum === 'İptal' && !modal.iptalSebebi.trim()) {
      await bilgiGoster('Lütfen iptal sebebini yazın.')
      return
    }
    setKaydediyor(true)
    try {
      await apiFetch(`/api/randevu-talepleri/${modal.talep.id}/durum`, {
        method: 'PUT',
        body: JSON.stringify({
          durum:            modal.durum,
          gorusenCalisanId: modal.durum === 'Görüşüldü' ? Number(modal.calisanId) : null,
          iptalSebebi:      modal.durum === 'İptal'      ? modal.iptalSebebi        : null,
        }),
      })
      modalKapat()
      await verileriGetir()
    } catch (e) {
      await hataGoster(e.message)
    } finally {
      setKaydediyor(false)
    }
  }

  async function talepSil(id, ad) {
    if (!(await silOnay(`"${ad}" talebini silmek istediğinize emin misiniz?`))) return
    try {
      await apiFetch(`/api/randevu-talepleri/${id}`, { method: 'DELETE' })
      await verileriGetir()
    } catch (e) {
      await hataGoster('Silme hatası: ' + e.message)
    }
  }

  const bekliyor   = talepler.filter(t => t.durum === 'Bekliyor').length
  const gorusuldu  = talepler.filter(t => t.durum === 'Görüşüldü').length
  const iptal      = talepler.filter(t => t.durum === 'İptal').length
  const gorunenler = filtre === 'Tümü' ? talepler : talepler.filter(t => t.durum === filtre)

  return (
    <div style={s.sayfa}>
      {/* Başlık */}
      <div style={s.baslikSatir}>
        <div>
          <h1 style={s.baslik}>Randevu Talepleri</h1>
          <p style={s.altBaslik}>Web sitesi randevu formundan gelen başvurular</p>
        </div>
        <button onClick={verileriGetir} style={s.yenileBtn}>🔄 Yenile</button>
      </div>

      {/* İstatistik Kartları */}
      <div style={s.statsGrid}>
        {[
          { etiket: 'Toplam Talep', sayi: talepler.length, renk: '#1F6B4C', ikon: '📋' },
          { etiket: 'Bekliyor',     sayi: bekliyor,         renk: '#b45309', ikon: '⏳' },
          { etiket: 'Görüşüldü',   sayi: gorusuldu,        renk: '#166534', ikon: '✅' },
          { etiket: 'İptal',        sayi: iptal,            renk: '#991b1b', ikon: '❌' },
        ].map(st => (
          <div key={st.etiket} style={{ ...s.statKart, borderLeft: `4px solid ${st.renk}` }}>
            <span style={{ fontSize: 28 }}>{st.ikon}</span>
            <div>
              <div style={{ fontSize: 30, fontWeight: 800, color: st.renk, lineHeight: 1 }}>{st.sayi}</div>
              <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{st.etiket}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bekliyor uyarısı */}
      {bekliyor > 0 && (
        <div style={s.uyari}>
          ⏳ <strong>{bekliyor} talep</strong> henüz yanıt bekliyor.
        </div>
      )}

      {/* Filtre Sekmeler */}
      <div style={s.filtreBar}>
        {[
          { etiket: 'Tümü',       sayi: talepler.length },
          { etiket: 'Bekliyor',   sayi: bekliyor },
          { etiket: 'Görüşüldü', sayi: gorusuldu },
          { etiket: 'İptal',      sayi: iptal },
        ].map(f => (
          <button key={f.etiket} onClick={() => setFiltre(f.etiket)}
            style={{ ...s.filtreBtn, ...(filtre === f.etiket ? s.filtreBtnAktif : {}) }}>
            {f.etiket}
            <span style={{ ...s.filtreRozet, background: filtre === f.etiket ? 'rgba(255,255,255,0.3)' : '#eee', color: filtre === f.etiket ? '#fff' : '#666' }}>
              {f.sayi}
            </span>
          </button>
        ))}
      </div>

      {/* İçerik */}
      {yukleniyor
        ? <p style={s.bilgi}>Yükleniyor...</p>
        : hata
          ? <p style={{ ...s.bilgi, color: '#c00' }}>Hata: {hata}</p>
          : gorunenler.length === 0
            ? <p style={s.bilgi}>Bu kategoride talep bulunamadı.</p>
            : (
              <div style={s.tabloSarici}>
                <table style={s.tablo}>
                  <thead>
                    <tr style={s.thead}>
                      {['Başvuru Tarihi', 'Ad Soyad', 'Telefon', 'Tercih Tarih', 'Durum', 'İşlemler'].map(h => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {gorunenler.map(t => {
                      const ds = DURUM_STIL[t.durum] ?? DURUM_STIL['Bekliyor']
                      return (
                        <tr key={t.id} style={s.tr}>

                          {/* Tarih */}
                          <td style={s.td}>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>
                              {new Date(t.olusturulmaTarihi).toLocaleDateString('tr-TR')}
                            </div>
                            <div style={{ fontSize: 11, color: '#999' }}>
                              {new Date(t.olusturulmaTarihi).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>

                          {/* Ad */}
                          <td style={s.td}><strong>{t.adSoyad}</strong></td>

                          {/* Telefon */}
                          <td style={s.td}>
                            <a href={`tel:${t.telefon}`}
                              style={{ color: '#1F6B4C', textDecoration: 'none', fontWeight: 500, fontSize: 13 }}>
                              {t.telefon}
                            </a>
                          </td>

                          {/* Tercih Tarih */}
                          <td style={s.td}>
                            {tarihFormatla(t.tercihTarih) ?? <span style={{ color: '#ccc' }}>—</span>}
                          </td>

                          {/* Durum + Notlar */}
                          <td style={s.td}>
                            <span style={{ ...s.durumRozet, background: ds.bg, color: ds.color, border: `1px solid ${ds.border}` }}>
                              {t.durum}
                            </span>
                            {t.durum === 'Görüşüldü' && t.gorusenCalisanAd && (
                              <div style={{ fontSize: 12, color: '#555', marginTop: 5 }}>
                                👤 {t.gorusenCalisanAd}
                              </div>
                            )}
                            {t.durum === 'İptal' && t.iptalSebebi && (
                              <div style={{ fontSize: 12, color: '#888', marginTop: 5, maxWidth: 160 }} title={t.iptalSebebi}>
                                📝 {t.iptalSebebi.length > 35 ? t.iptalSebebi.slice(0, 35) + '…' : t.iptalSebebi}
                              </div>
                            )}
                          </td>

                          {/* İşlemler */}
                          <td style={s.td}>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                              {t.durum === 'Bekliyor' && (
                                <button onClick={() => modalAc(t)} style={s.guncelleBtn}>
                                  ✏️ Güncelle
                                </button>
                              )}
                              <a href={`https://wa.me/${telToWa(t.telefon)}`}
                                target="_blank" rel="noopener noreferrer"
                                title="WhatsApp'tan ara"
                                style={s.waBtn}>
                                💬
                              </a>
                              <button onClick={() => talepSil(t.id, t.adSoyad)} style={s.silBtn}>
                                Sil
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
      }

      {/* Durum Güncelle Modal */}
      {modal && (
        <div style={s.overlay} onClick={modalKapat}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalBaslik}>Durumu Güncelle</h2>

            {/* Talep özeti */}
            <div style={s.talepOzet}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1A3329' }}>{modal.talep.adSoyad}</div>
              <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>📞 {modal.talep.telefon}</div>
              {modal.talep.tercihTarih && (
                <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>📅 {tarihFormatla(modal.talep.tercihTarih)}</div>
              )}
            </div>

            {/* Durum seçimi */}
            <div style={{ marginBottom: 18 }}>
              <label style={s.etiket}>Yeni Durum</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {['Görüşüldü', 'İptal'].map(d => (
                  <button key={d} type="button"
                    onClick={() => setModal(m => ({ ...m, durum: d }))}
                    style={{
                      flex: 1, padding: '11px 0',
                      border: `2px solid ${modal.durum === d ? '#1F6B4C' : '#ddd'}`,
                      background: modal.durum === d ? '#E8F5EE' : '#fff',
                      color: modal.durum === d ? '#1F6B4C' : '#666',
                      borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14,
                      transition: 'all .15s',
                    }}>
                    {d === 'Görüşüldü' ? '✅ Görüşüldü' : '❌ İptal'}
                  </button>
                ))}
              </div>
            </div>

            {/* Görüşüldü → Çalışan seç */}
            {modal.durum === 'Görüşüldü' && (
              <div style={{ marginBottom: 18 }}>
                <label style={s.etiket}>Kim Görüştü? *</label>
                <select style={s.girdi}
                  value={modal.calisanId}
                  onChange={e => setModal(m => ({ ...m, calisanId: e.target.value }))}>
                  {calisanlar.map(c => (
                    <option key={c.id} value={c.id}>{c.adSoyad} — {c.unvan}</option>
                  ))}
                </select>
              </div>
            )}

            {/* İptal → Sebep */}
            {modal.durum === 'İptal' && (
              <div style={{ marginBottom: 18 }}>
                <label style={s.etiket}>İptal Sebebi *</label>
                <textarea style={{ ...s.girdi, height: 80, resize: 'vertical' }}
                  placeholder="Örn: Hasta geri aradı, uygun tarih bulunamadı..."
                  value={modal.iptalSebebi}
                  onChange={e => setModal(m => ({ ...m, iptalSebebi: e.target.value }))} />
              </div>
            )}

            <div style={s.modalBtnSatir}>
              <button type="button" onClick={modalKapat} style={s.iptalBtn}>Vazgeç</button>
              <button type="button" onClick={durumGuncelle} disabled={kaydediyor} style={s.kaydetBtn}>
                {kaydediyor ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  sayfa:       { padding: 32, fontFamily: 'sans-serif' },
  baslikSatir: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  baslik:      { margin: '0 0 4px', fontSize: 26, color: '#1F6B4C' },
  altBaslik:   { margin: 0, color: '#888', fontSize: 14 },
  yenileBtn:   { padding: '9px 18px', background: '#E8F5EE', color: '#1F6B4C', border: '1px solid #B2D9C5', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },

  statsGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 20 },
  statKart:    { background: '#fff', borderRadius: 12, padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' },

  uyari:       { background: '#fff8e1', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#92400e', fontSize: 14 },

  filtreBar:       { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  filtreBtn:       { padding: '8px 16px', background: '#fff', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#555', fontWeight: 500 },
  filtreBtnAktif:  { background: '#1F6B4C', color: '#fff', border: '1px solid #1F6B4C', fontWeight: 700 },
  filtreRozet:     { fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 20 },

  bilgi:       { textAlign: 'center', color: '#888', padding: 40, fontSize: 14 },

  tabloSarici: { overflowX: 'auto', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  tablo:       { width: '100%', borderCollapse: 'collapse', background: '#fff' },
  thead:       { background: '#F5FAF7' },
  th:          { padding: '12px 14px', textAlign: 'left', fontSize: 12, color: '#666', fontWeight: 600, borderBottom: '1px solid #eee', whiteSpace: 'nowrap' },
  tr:          { borderBottom: '1px solid #f5f5f5' },
  td:          { padding: '13px 14px', fontSize: 14, verticalAlign: 'top' },

  durumRozet:  { padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', display: 'inline-block' },

  guncelleBtn: { padding: '5px 12px', background: '#E8F5EE', color: '#1F6B4C', border: '1px solid #B2D9C5', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  waBtn:       { width: 30, height: 30, background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: 15 },
  silBtn:      { padding: '5px 10px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontSize: 12 },

  overlay:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:       { background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' },
  modalBaslik: { margin: '0 0 16px', color: '#1F6B4C', fontSize: 18 },

  talepOzet:   { background: '#F5FAF7', borderRadius: 10, padding: '14px 16px', marginBottom: 20, border: '1px solid #B2D9C5' },

  etiket:      { display: 'block', marginBottom: 7, fontSize: 13, fontWeight: 600, color: '#555' },
  girdi:       { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' },

  modalBtnSatir: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 },
  iptalBtn:      { padding: '9px 20px', background: '#f5f5f5', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 14 },
  kaydetBtn:     { padding: '9px 24px', background: '#1F6B4C', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 14, fontWeight: 700 },
}
