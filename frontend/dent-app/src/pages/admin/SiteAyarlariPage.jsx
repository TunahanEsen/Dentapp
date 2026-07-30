import { useState, useEffect } from 'react'
import { useApi } from '../../hooks/useApi'

const SEKMELER = [
  { id: 'iletisim',  etiket: '📍 İletişim & Saatler' },
  { id: 'doktorlar', etiket: '👨‍⚕️ Doktorlar'         },
  { id: 'hizmetler', etiket: '🦷 Hizmetler'           },
  { id: 'makaleler', etiket: '📝 Makaleler'           },
]

const MAKALE_KATEGORİLERİ = ['Tedavi', 'Estetik', 'Ortodonti', 'Genel Sağlık', 'Diş Eti', 'Çocuk Sağlığı']
const RENKLER = ['#1F6B4C','#1b5e20','#b71c1c','#2563EB','#7C3AED','#DB2777','#0891B2','#D97706','#4F46E5','#059669']

const BOS_DOKTOR  = { ad: '', unvan: 'Diş Hekimi', uzmanlik: '', deneyim: '', bas: '', renk: '#1F6B4C', aciklama: '' }
const BOS_HIZMET  = { baslik: '', aciklama: '', ucretsiz: false, renk: '#1F6B4C', renkAcik: '#E8F5EE', animPath: '' }
const BOS_MAKALE  = { baslik: '', ozet: '', sure: '3 dk', kategori: 'Tedavi', yazar: '', tarih: '', icerik: '' }

export default function SiteAyarlariPage() {
  const { apiFetch }  = useApi()
  const [sekme,       setSekme]       = useState('iletisim')
  const [veri,        setVeri]        = useState(null)
  const [yukleniyor,  setYukleniyor]  = useState(true)
  const [mesaj,       setMesaj]       = useState({ tip: '', metin: '' })
  const [modal,       setModal]       = useState(null) // { alan, index, form }

  // ── İletişim form state'i
  const [iletisimForm, setIletisimForm] = useState({
    adres: '', telefon: '', waNumara: '',
    pztCmtBaslangic: '09:00', pztCmtBitis: '21:00',
    pazarBaslangic: '11:00',  pazarBitis: '21:00',
    facebook: '#', instagram: '#', youtube: '#',
  })

  useEffect(() => {
    apiFetch('/api/site-ayarlari')
      .then(data => {
        setVeri(data)
        if (data.iletisim) {
          const il = data.iletisim
          setIletisimForm({
            adres:          il.adres    || '',
            telefon:        il.telefon  || '',
            waNumara:       il.waNumara || '',
            pztCmtBaslangic: il.calismaSaatleri?.pztCmt?.baslangic || '09:00',
            pztCmtBitis:     il.calismaSaatleri?.pztCmt?.bitis     || '21:00',
            pazarBaslangic:  il.calismaSaatleri?.pazar?.baslangic  || '11:00',
            pazarBitis:      il.calismaSaatleri?.pazar?.bitis      || '21:00',
            facebook:  il.sosyalMedya?.facebook  || '#',
            instagram: il.sosyalMedya?.instagram || '#',
            youtube:   il.sosyalMedya?.youtube   || '#',
          })
        }
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false))
  }, [])

  function basariGoster(metin) {
    setMesaj({ tip: 'basari', metin })
    setTimeout(() => setMesaj({ tip: '', metin: '' }), 3500)
  }
  function hataGosterMesaj(metin) {
    setMesaj({ tip: 'hata', metin })
    setTimeout(() => setMesaj({ tip: '', metin: '' }), 4000)
  }

  async function iletisimKaydet(e) {
    e.preventDefault()
    try {
      await apiFetch('/api/site-ayarlari/iletisim', {
        method: 'PUT',
        body: JSON.stringify({
          adres:    iletisimForm.adres,
          telefon:  iletisimForm.telefon,
          waNumara: iletisimForm.waNumara,
          calismaSaatleri: {
            pztCmt: { baslangic: iletisimForm.pztCmtBaslangic, bitis: iletisimForm.pztCmtBitis },
            pazar:  { baslangic: iletisimForm.pazarBaslangic,  bitis: iletisimForm.pazarBitis },
          },
          sosyalMedya: {
            facebook:  iletisimForm.facebook,
            instagram: iletisimForm.instagram,
            youtube:   iletisimForm.youtube,
          },
        }),
      })
      basariGoster('İletişim bilgileri güncellendi.')
    } catch (err) { hataGosterMesaj(err.message) }
  }

  // ── Liste bölümleri (doktorlar, hizmetler, makaleler) ─────────────
  async function listeyiKaydet(alan, liste) {
    try {
      await apiFetch(`/api/site-ayarlari/${alan}`, {
        method: 'PUT',
        body: JSON.stringify(liste),
      })
      setVeri(v => ({ ...v, [alan]: liste }))
      basariGoster('Değişiklikler kaydedildi.')
      setModal(null)
    } catch (err) { hataGosterMesaj(err.message) }
  }

  function modalAc(alan, index = null) {
    const mevcutListe = veri?.[alan] || []
    const form = index !== null
      ? { ...mevcutListe[index] }
      : alan === 'doktorlar' ? { ...BOS_DOKTOR }
      : alan === 'hizmetler' ? { ...BOS_HIZMET }
      : { ...BOS_MAKALE }
    setModal({ alan, index, form })
  }

  function modalKaydet() {
    const { alan, index, form } = modal
    const mevcutListe = veri?.[alan] || []
    let yeniListe
    if (index !== null) {
      yeniListe = mevcutListe.map((item, i) => i === index ? { ...item, ...form } : item)
    } else {
      const yeniId = Math.max(0, ...mevcutListe.map(x => x.id || 0)) + 1
      yeniListe = [...mevcutListe, { ...form, id: yeniId }]
    }
    listeyiKaydet(alan, yeniListe)
  }

  function sil(alan, index) {
    if (!window.confirm('Silmek istediğinize emin misiniz?')) return
    const yeniListe = (veri?.[alan] || []).filter((_, i) => i !== index)
    listeyiKaydet(alan, yeniListe)
  }

  if (yukleniyor) return <div style={s.yukleniyor}>Yükleniyor...</div>

  return (
    <div style={s.sayfa}>
      <div style={s.ustBaslik}>
        <h1 style={s.baslik}>🌐 Site Ayarları</h1>
        <p style={s.altYazi}>Public sitede görünen içerikleri buradan yönetin.</p>
      </div>

      {mesaj.metin && (
        <div style={mesaj.tip === 'basari' ? s.basariMesaj : s.hataMesaj}>
          {mesaj.tip === 'basari' ? '✓' : '⚠️'} {mesaj.metin}
        </div>
      )}

      {/* Sekme bar */}
      <div style={s.sekmeBar}>
        {SEKMELER.map(sk => (
          <button
            key={sk.id}
            onClick={() => setSekme(sk.id)}
            style={{ ...s.sekmeBtn, ...(sekme === sk.id ? s.sekmeBtnAktif : {}) }}
          >
            {sk.etiket}
          </button>
        ))}
      </div>

      <div style={s.icerik}>
        {/* ── İLETİŞİM ────────────────────────────────────────── */}
        {sekme === 'iletisim' && (
          <form onSubmit={iletisimKaydet} style={s.form}>
            <BolumBaslik>Adres & İletişim</BolumBaslik>
            <FormAlani etiket="Adres">
              <textarea style={{ ...s.girdi, height: 80, resize: 'vertical' }}
                value={iletisimForm.adres}
                onChange={e => setIletisimForm(f => ({ ...f, adres: e.target.value }))} />
            </FormAlani>
            <div style={s.ikiliGrid}>
              <FormAlani etiket="Telefon">
                <input style={s.girdi} value={iletisimForm.telefon}
                  onChange={e => setIletisimForm(f => ({ ...f, telefon: e.target.value }))} />
              </FormAlani>
              <FormAlani etiket="WhatsApp Numarası (905xxxxxxxxx)">
                <input style={s.girdi} value={iletisimForm.waNumara}
                  onChange={e => setIletisimForm(f => ({ ...f, waNumara: e.target.value }))} />
              </FormAlani>
            </div>

            <BolumBaslik>Çalışma Saatleri</BolumBaslik>
            <div style={s.saatGrid}>
              <span style={s.saatEtiket}>Pazartesi – Cumartesi</span>
              <input style={{ ...s.girdi, width: 90 }} value={iletisimForm.pztCmtBaslangic}
                onChange={e => setIletisimForm(f => ({ ...f, pztCmtBaslangic: e.target.value }))} placeholder="09:00" />
              <span style={{ color: '#888' }}>–</span>
              <input style={{ ...s.girdi, width: 90 }} value={iletisimForm.pztCmtBitis}
                onChange={e => setIletisimForm(f => ({ ...f, pztCmtBitis: e.target.value }))} placeholder="21:00" />
            </div>
            <div style={s.saatGrid}>
              <span style={s.saatEtiket}>Pazar</span>
              <input style={{ ...s.girdi, width: 90 }} value={iletisimForm.pazarBaslangic}
                onChange={e => setIletisimForm(f => ({ ...f, pazarBaslangic: e.target.value }))} placeholder="11:00" />
              <span style={{ color: '#888' }}>–</span>
              <input style={{ ...s.girdi, width: 90 }} value={iletisimForm.pazarBitis}
                onChange={e => setIletisimForm(f => ({ ...f, pazarBitis: e.target.value }))} placeholder="21:00" />
            </div>

            <BolumBaslik>Sosyal Medya</BolumBaslik>
            <div style={s.ikiliGrid}>
              <FormAlani etiket="Facebook URL">
                <input style={s.girdi} value={iletisimForm.facebook}
                  onChange={e => setIletisimForm(f => ({ ...f, facebook: e.target.value }))} />
              </FormAlani>
              <FormAlani etiket="Instagram URL">
                <input style={s.girdi} value={iletisimForm.instagram}
                  onChange={e => setIletisimForm(f => ({ ...f, instagram: e.target.value }))} />
              </FormAlani>
            </div>

            <div style={{ marginTop: 24 }}>
              <button type="submit" style={s.kaydetBtn}>💾 Kaydet</button>
            </div>
          </form>
        )}

        {/* ── DOKTORLAR ────────────────────────────────────────── */}
        {sekme === 'doktorlar' && (
          <div>
            <div style={s.listeBas}>
              <span style={s.listeAdet}>{(veri?.doktorlar || []).length} doktor</span>
              <button style={s.ekleBtn} onClick={() => modalAc('doktorlar')}>+ Yeni Doktor</button>
            </div>
            {(veri?.doktorlar || []).map((d, i) => (
              <div key={i} style={s.listeKart}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ ...s.avatarKucuk, background: d.renk }}>{d.bas || d.ad?.substring(0, 2)}</div>
                  <div>
                    <div style={s.listeAd}>{d.ad}</div>
                    <div style={s.listeAlt}>{d.unvan} · {d.uzmanlik} · {d.deneyim}</div>
                  </div>
                </div>
                <div style={s.islemBtnlar}>
                  <button style={s.duzenleBtn} onClick={() => modalAc('doktorlar', i)}>Düzenle</button>
                  <button style={s.silBtn} onClick={() => sil('doktorlar', i)}>Sil</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── HİZMETLER ────────────────────────────────────────── */}
        {sekme === 'hizmetler' && (
          <div>
            <div style={s.listeBas}>
              <span style={s.listeAdet}>{(veri?.hizmetler || []).length} hizmet</span>
              <button style={s.ekleBtn} onClick={() => modalAc('hizmetler')}>+ Yeni Hizmet</button>
            </div>
            {(veri?.hizmetler || []).map((h, i) => (
              <div key={i} style={s.listeKart}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: h.renk, flexShrink: 0 }} />
                  <div>
                    <div style={s.listeAd}>{h.baslik}</div>
                    <div style={s.listeAlt}>
                      {h.ucretsiz ? <span style={s.ucretsizRozet}>Ücretsiz</span> : null}
                      {h.aciklama?.substring(0, 60)}{h.aciklama?.length > 60 ? '…' : ''}
                    </div>
                  </div>
                </div>
                <div style={s.islemBtnlar}>
                  <button style={s.duzenleBtn} onClick={() => modalAc('hizmetler', i)}>Düzenle</button>
                  <button style={s.silBtn} onClick={() => sil('hizmetler', i)}>Sil</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── MAKALELER ────────────────────────────────────────── */}
        {sekme === 'makaleler' && (
          <div>
            <div style={s.listeBas}>
              <span style={s.listeAdet}>{(veri?.makaleler || []).length} makale</span>
              <button style={s.ekleBtn} onClick={() => modalAc('makaleler')}>+ Yeni Makale</button>
            </div>
            {(veri?.makaleler || []).map((m, i) => (
              <div key={i} style={s.listeKart}>
                <div style={{ flex: 1 }}>
                  <div style={s.listeAd}>{m.baslik}</div>
                  <div style={s.listeAlt}>
                    <span style={s.kategoriBadge}>{m.kategori}</span>
                    {m.sure} · {m.yazar} · {m.tarih}
                  </div>
                </div>
                <div style={s.islemBtnlar}>
                  <button style={s.duzenleBtn} onClick={() => modalAc('makaleler', i)}>Düzenle</button>
                  <button style={s.silBtn} onClick={() => sil('makaleler', i)}>Sil</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MODAL ─────────────────────────────────────────────── */}
      {modal && (
        <div style={s.overlay} onClick={() => setModal(null)}>
          <div className="siteayar-modal-kutu" style={s.modalKutu} onClick={e => e.stopPropagation()}>
            <div style={s.modalBaslik}>
              {modal.index !== null ? 'Düzenle' : 'Yeni Ekle'} —{' '}
              {modal.alan === 'doktorlar' ? 'Doktor'
               : modal.alan === 'hizmetler' ? 'Hizmet' : 'Makale'}
            </div>

            {/* DOKTOR FORMU */}
            {modal.alan === 'doktorlar' && (
              <div style={s.modalForm}>
                <div style={s.ikiliGrid}>
                  <FormAlani etiket="Ad Soyad">
                    <input style={s.girdi} value={modal.form.ad}
                      onChange={e => setModal(m => ({ ...m, form: { ...m.form, ad: e.target.value, bas: e.target.value.split(' ').map(k=>k[0]||'').join('').substring(0,2).toUpperCase() } }))} />
                  </FormAlani>
                  <FormAlani etiket="Unvan">
                    <input style={s.girdi} value={modal.form.unvan}
                      onChange={e => setModal(m => ({ ...m, form: { ...m.form, unvan: e.target.value } }))} />
                  </FormAlani>
                </div>
                <div style={s.ikiliGrid}>
                  <FormAlani etiket="Uzmanlık">
                    <input style={s.girdi} value={modal.form.uzmanlik}
                      onChange={e => setModal(m => ({ ...m, form: { ...m.form, uzmanlik: e.target.value } }))} />
                  </FormAlani>
                  <FormAlani etiket="Deneyim (örn: 12 Yıl)">
                    <input style={s.girdi} value={modal.form.deneyim}
                      onChange={e => setModal(m => ({ ...m, form: { ...m.form, deneyim: e.target.value } }))} />
                  </FormAlani>
                </div>
                <FormAlani etiket="Açıklama">
                  <textarea style={{ ...s.girdi, height: 80, resize: 'vertical' }} value={modal.form.aciklama}
                    onChange={e => setModal(m => ({ ...m, form: { ...m.form, aciklama: e.target.value } }))} />
                </FormAlani>
                <FormAlani etiket="Renk">
                  <RenkSecici deger={modal.form.renk} onChange={renk => setModal(m => ({ ...m, form: { ...m.form, renk } }))} />
                </FormAlani>
              </div>
            )}

            {/* HİZMET FORMU */}
            {modal.alan === 'hizmetler' && (
              <div style={s.modalForm}>
                <FormAlani etiket="Hizmet Adı">
                  <input style={s.girdi} value={modal.form.baslik}
                    onChange={e => setModal(m => ({ ...m, form: { ...m.form, baslik: e.target.value } }))} />
                </FormAlani>
                <FormAlani etiket="Açıklama">
                  <textarea style={{ ...s.girdi, height: 80, resize: 'vertical' }} value={modal.form.aciklama}
                    onChange={e => setModal(m => ({ ...m, form: { ...m.form, aciklama: e.target.value } }))} />
                </FormAlani>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <input type="checkbox" id="ucretsiz" checked={!!modal.form.ucretsiz}
                    onChange={e => setModal(m => ({ ...m, form: { ...m.form, ucretsiz: e.target.checked } }))}
                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#1F6B4C' }} />
                  <label htmlFor="ucretsiz" style={{ fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Ücretsiz hizmet</label>
                </div>
                <FormAlani etiket="Renk">
                  <RenkSecici deger={modal.form.renk} onChange={renk => setModal(m => ({ ...m, form: { ...m.form, renk, renkAcik: renk + '22' } }))} />
                </FormAlani>
              </div>
            )}

            {/* MAKALE FORMU */}
            {modal.alan === 'makaleler' && (
              <div style={s.modalForm}>
                <FormAlani etiket="Başlık">
                  <input style={s.girdi} value={modal.form.baslik}
                    onChange={e => setModal(m => ({ ...m, form: { ...m.form, baslik: e.target.value } }))} />
                </FormAlani>
                <FormAlani etiket="Özet (kart görünümünde gösterilir)">
                  <textarea style={{ ...s.girdi, height: 68, resize: 'vertical' }} value={modal.form.ozet}
                    onChange={e => setModal(m => ({ ...m, form: { ...m.form, ozet: e.target.value } }))} />
                </FormAlani>
                <div style={s.ucluGrid}>
                  <FormAlani etiket="Kategori">
                    <select style={s.girdi} value={modal.form.kategori}
                      onChange={e => setModal(m => ({ ...m, form: { ...m.form, kategori: e.target.value } }))}>
                      {MAKALE_KATEGORİLERİ.map(k => <option key={k}>{k}</option>)}
                    </select>
                  </FormAlani>
                  <FormAlani etiket="Okuma Süresi">
                    <input style={s.girdi} value={modal.form.sure}
                      onChange={e => setModal(m => ({ ...m, form: { ...m.form, sure: e.target.value } }))} placeholder="3 dk" />
                  </FormAlani>
                  <FormAlani etiket="Tarih">
                    <input style={s.girdi} value={modal.form.tarih}
                      onChange={e => setModal(m => ({ ...m, form: { ...m.form, tarih: e.target.value } }))} placeholder="12 Ocak 2025" />
                  </FormAlani>
                </div>
                <FormAlani etiket="Yazar">
                  <input style={s.girdi} value={modal.form.yazar}
                    onChange={e => setModal(m => ({ ...m, form: { ...m.form, yazar: e.target.value } }))} />
                </FormAlani>
                <FormAlani etiket="İçerik (paragrafları boş satır ile ayırın)">
                  <textarea style={{ ...s.girdi, height: 200, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }}
                    value={modal.form.icerik}
                    onChange={e => setModal(m => ({ ...m, form: { ...m.form, icerik: e.target.value } }))}
                    placeholder="İlk paragraf...

İkinci paragraf..." />
                </FormAlani>
              </div>
            )}

            <div style={s.modalBtnSatir}>
              <button style={s.iptalBtn} onClick={() => setModal(null)}>İptal</button>
              <button style={s.kaydetBtn} onClick={modalKaydet}>💾 Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Yardımcı bileşenler ──────────────────────────────────────────────
function BolumBaslik({ children }) {
  return <div style={{ fontSize: 13, fontWeight: 700, color: '#1F6B4C', margin: '20px 0 10px', paddingBottom: 6, borderBottom: '1px solid #e8f5ee' }}>{children}</div>
}

function FormAlani({ etiket, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 5 }}>{etiket}</label>
      {children}
    </div>
  )
}

function RenkSecici({ deger, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      {RENKLER.map(r => (
        <button key={r} type="button" onClick={() => onChange(r)}
          style={{ width: 28, height: 28, borderRadius: '50%', background: r, border: deger === r ? '3px solid #333' : '2px solid transparent', cursor: 'pointer', flexShrink: 0 }} />
      ))}
      <input type="color" value={deger} onChange={e => onChange(e.target.value)}
        style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0 }} />
    </div>
  )
}

const s = {
  sayfa:       { padding: '32px 28px', fontFamily: 'sans-serif', minHeight: '100vh', background: '#F5FAF7' },
  yukleniyor:  { textAlign: 'center', marginTop: 80, color: '#888' },
  ustBaslik:   { marginBottom: 20 },
  baslik:      { margin: '0 0 6px', fontSize: 22, color: '#1F6B4C', fontWeight: 700 },
  altYazi:     { margin: 0, fontSize: 14, color: '#7a9a8a' },

  basariMesaj: { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 16px', color: '#15803d', fontSize: 13, marginBottom: 16 },
  hataMesaj:   { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 16px', color: '#dc2626', fontSize: 13, marginBottom: 16 },

  sekmeBar:       { display: 'flex', gap: 4, marginBottom: 24, background: '#fff', borderRadius: 12, padding: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', flexWrap: 'wrap' },
  sekmeBtn:       { padding: '9px 18px', background: 'none', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#555', whiteSpace: 'nowrap' },
  sekmeBtnAktif:  { background: '#1F6B4C', color: '#fff', fontWeight: 700 },

  icerik: { background: '#fff', borderRadius: 14, padding: '28px 32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },

  form:     { display: 'flex', flexDirection: 'column' },
  ikiliGrid:{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  ucluGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 },
  girdi:    { width: '100%', padding: '9px 12px', border: '1.5px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' },

  saatGrid:  { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 },
  saatEtiket:{ fontSize: 13, fontWeight: 600, color: '#374151', minWidth: 180 },

  kaydetBtn: { padding: '10px 24px', background: '#1F6B4C', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  ekleBtn:   { padding: '8px 18px', background: '#1F6B4C', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },

  listeBas:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  listeAdet: { fontSize: 13, color: '#888' },
  listeKart: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', border: '1px solid #eee', borderRadius: 10, marginBottom: 8, background: '#fafafa' },
  listeAd:   { fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 3 },
  listeAlt:  { fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  islemBtnlar:{ display: 'flex', gap: 8, flexShrink: 0 },
  duzenleBtn: { padding: '5px 12px', background: '#E8F5EE', color: '#2D8A62', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  silBtn:     { padding: '5px 12px', background: '#fce4ec', color: '#c62828', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  avatarKucuk:{ width: 38, height: 38, borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 },
  ucretsizRozet: { background: '#E8F5EE', color: '#1F6B4C', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10 },
  kategoriBadge: { background: '#E8F5EE', color: '#1F6B4C', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10 },

  overlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modalKutu:  { background: '#fff', borderRadius: 14, padding: '28px 32px', width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' },
  modalBaslik:{ fontSize: 17, fontWeight: 700, color: '#1F6B4C', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #f0f0f0' },
  modalForm:  {},
  modalBtnSatir: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, paddingTop: 16, borderTop: '1px solid #f0f0f0' },
  iptalBtn:   { padding: '9px 20px', background: '#f5f5f5', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer', color: '#555' },
}
