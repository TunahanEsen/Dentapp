import { useState, useEffect, useCallback } from 'react'
import { useApi } from '../../hooks/useApi'
import { silOnay, hataGoster } from '../../utils/dialog'

// ─── SABİTLER ───────────────────────────────────────────────────────────────
const VARDİYA_TURLERİ = [
  { tur: 'Sabah',          saat: '08:00–14:00', renk: '#e3f2fd', yazı: '#1565c0' },
  { tur: 'Öğleden Sonra', saat: '14:00–20:00', renk: '#e8f5e9', yazı: '#2e7d32' },
  { tur: 'Tam Gün',        saat: '08:00–20:00', renk: '#fff3e0', yazı: '#e65100' },
  { tur: 'Nöbet',          saat: '20:00–08:00', renk: '#fce4ec', yazı: '#c62828' },
]

const UNVANLAR   = ['Diş Hekimi', 'Asistan', 'Hemşire', 'Resepsiyonist', 'Teknisyen']
const RENKLER    = ['#1F6B4C','#1b5e20','#b71c1c','#e65100','#4a148c','#006064','#33691e','#bf360c']
const GUN_ADLARI = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

// ─── YARDIMCI FONKSİYONLAR ──────────────────────────────────────────────────
function haftaBaslangici(tarih) {
  const d = new Date(tarih)
  const gun = d.getDay()                    // 0=Pazar, 1=Pazartesi...
  const fark = gun === 0 ? -6 : 1 - gun    // Pazartesi'ye getir
  d.setDate(d.getDate() + fark)
  d.setHours(0, 0, 0, 0)
  return d
}

function gunDizisi(haftaBas) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(haftaBas)
    d.setDate(d.getDate() + i)
    return d
  })
}

function tarihStr(d) {
  // "2025-06-13" formatında string üret — timezone kaymasını önlemek için
  const yil = d.getFullYear()
  const ay  = String(d.getMonth() + 1).padStart(2, '0')
  const gun = String(d.getDate()).padStart(2, '0')
  return `${yil}-${ay}-${gun}`
}

function bugunMu(d) {
  return tarihStr(d) === tarihStr(new Date())
}

// ─── ANA SAYFA ───────────────────────────────────────────────────────────────
export default function NobetPage() {
  const [sekme, setSekme] = useState('takvim')

  return (
    <div style={s.sayfa}>
      <div style={s.baslikSatir}>
        <div>
          <h1 style={s.baslik}>Nöbet / Vardiya Planlama</h1>
          <p style={s.altBaslik}>Haftalık çalışma takvimini yönet</p>
        </div>
      </div>

      <div style={s.sekmeler}>
        <button style={{ ...s.sekme, ...(sekme === 'takvim'   ? s.sekmeAktif : {}) }} onClick={() => setSekme('takvim')}>
          📅 Haftalık Takvim
        </button>
        <button style={{ ...s.sekme, ...(sekme === 'calisanlar' ? s.sekmeAktif : {}) }} onClick={() => setSekme('calisanlar')}>
          👥 Çalışanlar
        </button>
      </div>

      {sekme === 'takvim' ? <Takvim /> : <CalisanYonetimi />}
    </div>
  )
}

// ─── HAFTALlK TAKVİM ────────────────────────────────────────────────────────
function Takvim() {
  const { apiFetch } = useApi()
  const [haftaBas,   setHaftaBas]   = useState(() => haftaBaslangici(new Date()))
  const [vardiyalar, setVardiyalar] = useState([])
  const [calisanlar, setCalisanlar] = useState([])
  const [modal,      setModal]      = useState(null)   // { tarih } | null
  const [yukleniyor, setYukleniyor] = useState(false)

  const gunler = gunDizisi(haftaBas)
  const haftaSonu = gunler[6]

  const verileriGetir = useCallback(async () => {
    setYukleniyor(true)
    try {
      const [v, c] = await Promise.all([
        apiFetch(`/api/vardiyalar?baslangic=${tarihStr(haftaBas)}&bitis=${tarihStr(haftaSonu)}`),
        apiFetch('/api/calisanlar'),
      ])
      setVardiyalar(v)
      setCalisanlar(c)
    } finally {
      setYukleniyor(false)
    }
  }, [haftaBas])

  useEffect(() => { verileriGetir() }, [verileriGetir])

  function oncekiHafta() {
    const d = new Date(haftaBas); d.setDate(d.getDate() - 7); setHaftaBas(d)
  }
  function sonrakiHafta() {
    const d = new Date(haftaBas); d.setDate(d.getDate() + 7); setHaftaBas(d)
  }
  function buHafta() { setHaftaBas(haftaBaslangici(new Date())) }

  async function vardiySil(id) {
    if (!(await silOnay('Bu vardiyayı silmek istiyor musunuz?'))) return
    await apiFetch(`/api/vardiyalar/${id}`, { method: 'DELETE' })
    verileriGetir()
  }

  const gunVardiyalari = (gun) =>
    vardiyalar.filter(v => v.tarih === tarihStr(gun))

  const haftaAraligi = `${gunler[0].toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} – ${gunler[6].toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}`

  return (
    <div>
      {/* Navigasyon */}
      <div style={s.navBar}>
        <button style={s.navBtn} onClick={oncekiHafta}>‹ Önceki</button>
        <div style={s.navOrta}>
          <span style={s.haftaBaslik}>{haftaAraligi}</span>
          <button style={s.bugunBtn} onClick={buHafta}>Bu Hafta</button>
        </div>
        <button style={s.navBtn} onClick={sonrakiHafta}>Sonraki ›</button>
      </div>

      {yukleniyor && <p style={s.yukleniyorYazi}>Yükleniyor...</p>}

      {/* Takvim Izgarası */}
      <div className="takvim-izgara" style={s.takvimIzgara}>
        {gunler.map((gun, i) => {
          const vardiyalar = gunVardiyalari(gun)
          const bugun = bugunMu(gun)
          return (
            <div key={i} style={{ ...s.gunKutu, ...(bugun ? s.bugunKutu : {}) }}>
              {/* Gün Başlığı */}
              <div style={s.gunBaslik}>
                <span style={s.gunAdi}>{GUN_ADLARI[i]}</span>
                <span style={{ ...s.gunNo, ...(bugun ? s.bugunNo : {}) }}>
                  {gun.getDate()}
                </span>
              </div>

              {/* Vardiyalar */}
              <div style={s.vardiyaListesi}>
                {vardiyalar.map(v => {
                  const tur = VARDİYA_TURLERİ.find(t => t.tur === v.tur)
                  return (
                    <div key={v.id} style={{ ...s.vardiyaChip, background: tur?.renk || '#f5f5f5' }}>
                      <div style={{ ...s.chipAd, color: tur?.yazı || '#333' }}>
                        <span style={{ ...s.chipRenk, background: v.calisanRenk }} />
                        {v.calisanAd}
                      </div>
                      <div style={{ ...s.chipTur, color: tur?.yazı || '#666' }}>
                        {v.tur} · {tur?.saat}
                      </div>
                      <button style={s.chipSilBtn} onClick={() => vardiySil(v.id)} title="Sil">×</button>
                    </div>
                  )
                })}
              </div>

              {/* Vardiya Ekle Butonu */}
              <button style={s.ekleGunBtn} onClick={() => setModal({ tarih: tarihStr(gun) })}>
                + Vardiya
              </button>
            </div>
          )
        })}
      </div>

      {/* Açıklama */}
      <div style={s.aciklama}>
        {VARDİYA_TURLERİ.map(t => (
          <span key={t.tur} style={{ ...s.aciklamaItem, background: t.renk, color: t.yazı }}>
            {t.tur} ({t.saat})
          </span>
        ))}
      </div>

      {/* Vardiya Ekleme Modalı */}
      {modal && (
        <VardiyaModal
          tarih={modal.tarih}
          calisanlar={calisanlar}
          apiFetch={apiFetch}
          onKapat={() => setModal(null)}
          onKaydet={() => { setModal(null); verileriGetir() }}
        />
      )}
    </div>
  )
}

// ─── VARDİYA EKLEME MODALI ───────────────────────────────────────────────────
function VardiyaModal({ tarih, calisanlar, apiFetch, onKapat, onKaydet }) {
  const [calisanId,  setCalisanId]  = useState(calisanlar[0]?.id || '')
  const [tur,        setTur]        = useState('Sabah')
  const [not,        setNot]        = useState('')
  const [kaydediyor, setKaydediyor] = useState(false)
  const [hata,       setHata]       = useState(null)

  const tarihGoster = new Date(tarih + 'T00:00:00').toLocaleDateString('tr-TR', {
    weekday: 'long', day: 'numeric', month: 'long'
  })

  async function gonder(e) {
    e.preventDefault()
    setKaydediyor(true)
    setHata(null)
    try {
      await apiFetch('/api/vardiyalar', {
        method: 'POST',
        body: JSON.stringify({ calisanId: parseInt(calisanId), tarih, tur, not }),
      })
      onKaydet()
    } catch (e) {
      setHata(e.message)
    } finally {
      setKaydediyor(false)
    }
  }

  return (
    <div style={s.overlay} onClick={onKapat}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <h2 style={s.modalBaslik}>Vardiya Ekle</h2>
        <p style={s.modalTarih}>📅 {tarihGoster}</p>

        {calisanlar.length === 0 ? (
          <p style={{ color: '#c00' }}>Önce "Çalışanlar" sekmesinden personel ekleyin.</p>
        ) : (
          <form onSubmit={gonder}>
            <div style={s.alan}>
              <label style={s.etiket}>Çalışan</label>
              <select style={s.girdi} value={calisanId} onChange={e => setCalisanId(e.target.value)}>
                {calisanlar.map(c => (
                  <option key={c.id} value={c.id}>{c.adSoyad} — {c.unvan}</option>
                ))}
              </select>
            </div>

            <div style={s.alan}>
              <label style={s.etiket}>Vardiya Türü</label>
              <div style={s.turGrid}>
                {VARDİYA_TURLERİ.map(t => (
                  <label key={t.tur} style={{ ...s.turSecim, background: tur === t.tur ? t.renk : '#f5f5f5', color: tur === t.tur ? t.yazı : '#555', border: tur === t.tur ? `2px solid ${t.yazı}` : '2px solid transparent' }}>
                    <input type="radio" name="tur" value={t.tur} checked={tur === t.tur}
                      onChange={() => setTur(t.tur)} style={{ display: 'none' }} />
                    <strong>{t.tur}</strong>
                    <span style={{ fontSize: 12 }}>{t.saat}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={s.alan}>
              <label style={s.etiket}>Not (opsiyonel)</label>
              <input style={s.girdi} value={not} placeholder="Özel not..."
                onChange={e => setNot(e.target.value)} />
            </div>

            {hata && <p style={{ color: '#c00', fontSize: 13, margin: '0 0 12px' }}>{hata}</p>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button type="button" onClick={onKapat} style={s.iptalBtn}>İptal</button>
              <button type="submit" disabled={kaydediyor} style={s.kaydetBtn}>
                {kaydediyor ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── ÇALIŞAN YÖNETİMİ ───────────────────────────────────────────────────────
function CalisanYonetimi() {
  const { apiFetch }  = useApi()
  const [calisanlar,  setCalisanlar]  = useState([])
  const [yukleniyor,  setYukleniyor]  = useState(true)
  const [modalAcik,   setModalAcik]   = useState(false)
  const [duzenleId,   setDuzenleId]   = useState(null)
  const [form,        setForm]        = useState({ adSoyad: '', unvan: 'Diş Hekimi', renk: RENKLER[0] })
  const [kaydediyor,  setKaydediyor]  = useState(false)

  useEffect(() => { getir() }, [])

  async function getir() {
    try { setCalisanlar(await apiFetch('/api/calisanlar')) }
    finally { setYukleniyor(false) }
  }

  function yeniAc()     { setForm({ adSoyad: '', unvan: 'Diş Hekimi', renk: RENKLER[0] }); setDuzenleId(null); setModalAcik(true) }
  function duzenleAc(c) { setForm({ adSoyad: c.adSoyad, unvan: c.unvan, renk: c.renk }); setDuzenleId(c.id); setModalAcik(true) }
  function kapat()      { setModalAcik(false) }

  async function gonder(e) {
    e.preventDefault()
    setKaydediyor(true)
    try {
      if (duzenleId) await apiFetch(`/api/calisanlar/${duzenleId}`, { method: 'PUT',  body: JSON.stringify(form) })
      else           await apiFetch('/api/calisanlar',              { method: 'POST', body: JSON.stringify(form) })
      kapat(); await getir()
    } catch (e) { await hataGoster(e.message) }
    finally { setKaydediyor(false) }
  }

  async function sil(id, ad) {
    if (!(await silOnay(`"${ad}" çalışanını silmek istediğinize emin misiniz? Bu kişiye ait vardiyalar da silinecektir.`))) return
    try { await apiFetch(`/api/calisanlar/${id}`, { method: 'DELETE' }); await getir() }
    catch (e) { await hataGoster(e.message) }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={yeniAc} style={s.ekleBtn}>+ Yeni Çalışan</button>
      </div>

      {yukleniyor ? <p style={s.yukleniyorYazi}>Yükleniyor...</p> : calisanlar.length === 0 ? (
        <p style={s.yukleniyorYazi}>Henüz çalışan eklenmemiş.</p>
      ) : (
        <div style={s.kartGrid}>
          {calisanlar.map(c => (
            <div key={c.id} style={s.calisanKart}>
              <div style={{ ...s.calisanRenkBar, background: c.renk }} />
              <div style={s.calisanBilgi}>
                <strong style={s.calisanAd}>{c.adSoyad}</strong>
                <span style={s.calisanUnvan}>{c.unvan}</span>
              </div>
              <div style={s.calisanBtnler}>
                <button onClick={() => duzenleAc(c)} style={s.duzenleBtn}>Düzenle</button>
                <button onClick={() => sil(c.id, c.adSoyad)} style={s.silTblBtn}>Sil</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalAcik && (
        <div style={s.overlay} onClick={kapat}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalBaslik}>{duzenleId ? 'Çalışanı Düzenle' : 'Yeni Çalışan'}</h2>
            <form onSubmit={gonder}>
              <div style={s.alan}>
                <label style={s.etiket}>Ad Soyad</label>
                <input style={s.girdi} required value={form.adSoyad}
                  onChange={e => setForm({ ...form, adSoyad: e.target.value })} />
              </div>
              <div style={s.alan}>
                <label style={s.etiket}>Ünvan</label>
                <select style={s.girdi} value={form.unvan}
                  onChange={e => setForm({ ...form, unvan: e.target.value })}>
                  {UNVANLAR.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div style={s.alan}>
                <label style={s.etiket}>Takvim Rengi</label>
                <div style={s.renkGrid}>
                  {RENKLER.map(r => (
                    <div key={r} onClick={() => setForm({ ...form, renk: r })}
                      style={{ ...s.renkKutu, background: r, ...(form.renk === r ? s.renkSecili : {}) }} />
                  ))}
                </div>
              </div>
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

// ─── STİLLER ────────────────────────────────────────────────────────────────
const s = {
  sayfa:          { padding: 32, fontFamily: 'sans-serif' },
  baslikSatir:    { marginBottom: 20 },
  baslik:         { margin: '0 0 4px', fontSize: 26, color: '#1F6B4C' },
  altBaslik:      { margin: 0, color: '#888', fontSize: 14 },
  sekmeler:       { display: 'flex', gap: 8, marginBottom: 24, borderBottom: '2px solid #e8eaf6', paddingBottom: 0 },
  sekme:          { padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#666', borderBottom: '2px solid transparent', marginBottom: -2 },
  sekmeAktif:     { color: '#1F6B4C', fontWeight: 700, borderBottom: '2px solid #1a237e' },
  yukleniyorYazi: { textAlign: 'center', color: '#aaa', padding: 40 },

  // Takvim navigasyon
  navBar:      { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  navOrta:     { display: 'flex', alignItems: 'center', gap: 12 },
  navBtn:      { padding: '8px 16px', background: '#f0f0f0', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
  haftaBaslik: { fontWeight: 600, fontSize: 15, color: '#333' },
  bugunBtn:    { padding: '6px 14px', background: '#E8F5EE', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: '#1F6B4C', fontWeight: 600 },

  // Takvim ızgara
  takvimIzgara: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 16 },
  gunKutu:      { background: '#fff', borderRadius: 10, padding: 10, minHeight: 160, display: 'flex', flexDirection: 'column', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '2px solid transparent' },
  bugunKutu:    { border: '2px solid #1a237e' },
  gunBaslik:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  gunAdi:       { fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase' },
  gunNo:        { fontSize: 16, fontWeight: 700, color: '#333', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' },
  bugunNo:      { background: '#1F6B4C', color: '#fff' },
  vardiyaListesi: { flex: 1, display: 'flex', flexDirection: 'column', gap: 4 },

  // Vardiya chip
  vardiyaChip:  { padding: '5px 8px', borderRadius: 6, position: 'relative' },
  chipAd:       { fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 },
  chipRenk:     { width: 8, height: 8, borderRadius: '50%', display: 'inline-block', flexShrink: 0 },
  chipTur:      { fontSize: 11, marginTop: 2 },
  chipSilBtn:   { position: 'absolute', top: 3, right: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#999', lineHeight: 1, padding: 0 },

  // Gün ekle butonu
  ekleGunBtn:   { marginTop: 8, width: '100%', padding: '5px 0', background: 'none', border: '1px dashed #ccc', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: '#aaa' },

  // Açıklama
  aciklama:     { display: 'flex', gap: 10, flexWrap: 'wrap' },
  aciklamaItem: { padding: '4px 12px', borderRadius: 20, fontSize: 12 },

  // Çalışan kartları
  kartGrid:       { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 },
  calisanKart:    { background: '#fff', borderRadius: 10, padding: 16, display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  calisanRenkBar: { width: 6, height: 48, borderRadius: 3, flexShrink: 0 },
  calisanBilgi:   { flex: 1, display: 'flex', flexDirection: 'column', gap: 3 },
  calisanAd:      { fontSize: 15 },
  calisanUnvan:   { fontSize: 12, color: '#888' },
  calisanBtnler:  { display: 'flex', gap: 8 },

  // Modal
  overlay:       { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:         { background: '#fff', borderRadius: 12, padding: 32, width: '100%', maxWidth: 460, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' },
  modalBaslik:   { margin: '0 0 4px', color: '#1F6B4C' },
  modalTarih:    { margin: '0 0 20px', color: '#666', fontSize: 14 },
  alan:          { marginBottom: 16 },
  etiket:        { display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 },
  girdi:         { width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 7, fontSize: 14, boxSizing: 'border-box' },

  // Vardiya tür seçimi
  turGrid:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  turSecim:   { display: 'flex', flexDirection: 'column', gap: 2, padding: '10px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 14, transition: 'all .15s' },

  // Renk seçici
  renkGrid:   { display: 'flex', gap: 10, flexWrap: 'wrap' },
  renkKutu:   { width: 28, height: 28, borderRadius: '50%', cursor: 'pointer' },
  renkSecili: { outline: '3px solid #333', outlineOffset: 2 },

  // Butonlar
  ekleBtn:    { padding: '10px 20px', background: '#1F6B4C', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  duzenleBtn: { padding: '5px 12px', background: '#E8F5EE', color: '#2D8A62', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  silTblBtn:  { padding: '5px 12px', background: '#fce4ec', color: '#c62828', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  iptalBtn:   { padding: '9px 20px', background: '#f5f5f5', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 14 },
  kaydetBtn:  { padding: '9px 24px', background: '#1F6B4C', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 14, fontWeight: 600 },
}
