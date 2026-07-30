import { useState, useEffect, useMemo, useRef } from 'react'
import * as XLSX from 'xlsx'
import { useApi } from '../../hooks/useApi'
import { silOnay, hataGoster, bilgiGoster } from '../../utils/dialog'

// ─── SABİTLER ────────────────────────────────────────────────────────────────
const KATEGORİLER = ['Muayene', 'Dolgu', 'Kanal Tedavisi', 'İmplant', 'Ortodonti', 'Cerrahi', 'Estetik', 'Diğer']

// Sigorta türüne göre indirim çarpanı
const SİGORTA_SEÇENEKLERİ = [
  { etiket: 'Sigortasız',         carpan: 1.00 },
  { etiket: 'Özel Sigorta (%20)', carpan: 0.80 },
  { etiket: 'SGK Farkı (%50)',    carpan: 0.50 },
]

// Malzeme kalitesine göre fiyat çarpanı
const MALZEME_SEÇENEKLERİ = [
  { etiket: 'Standart',       carpan: 1.00 },
  { etiket: 'Premium (+%30)', carpan: 1.30 },
]

const BOSH_FORM = { ad: '', kategori: 'Muayene', temelFiyat: '' }

// ─── ANA SAYFA ────────────────────────────────────────────────────────────────
export default function FiyatPage() {
  const [sekme, setSekme] = useState('hesapla') // 'hesapla' | 'liste'

  return (
    <div style={s.sayfa}>
      <div style={s.baslikSatir}>
        <div>
          <h1 style={s.baslik}>Fiyat Hesaplama</h1>
          <p style={s.altBaslik}>Tedavi fiyatlarını yönet ve hasta için hesaplama yap</p>
        </div>
      </div>

      {/* Sekme Geçişi */}
      <div style={s.sekmeler}>
        <button
          style={{ ...s.sekme, ...(sekme === 'hesapla' ? s.sekmeAktif : {}) }}
          onClick={() => setSekme('hesapla')}
        >
          💰 Fiyat Hesapla
        </button>
        <button
          style={{ ...s.sekme, ...(sekme === 'liste' ? s.sekmeAktif : {}) }}
          onClick={() => setSekme('liste')}
        >
          📋 Tedavi Listesi
        </button>
      </div>

      {sekme === 'hesapla' ? <HesaplamaEkrani /> : <TedaviListesi />}
    </div>
  )
}

// ─── HESAPLAMA EKRANI ─────────────────────────────────────────────────────────
function HesaplamaEkrani() {
  const { apiFetch } = useApi()
  const [tedaviler,   setTedaviler]   = useState([])
  const [secilen,     setSecilen]     = useState([])   // { tedavi, adet }[]
  const [sigorta,     setSigorta]     = useState(0)    // index
  const [malzeme,     setMalzeme]     = useState(0)    // index
  const [yukleniyor,  setYukleniyor]  = useState(true)

  useEffect(() => {
    apiFetch('/api/tedaviler')
      .then(setTedaviler)
      .finally(() => setYukleniyor(false))
  }, [])

  function tedaviEkle(tedavi) {
    setSecilen(prev => {
      const mevcut = prev.find(s => s.tedavi.id === tedavi.id)
      if (mevcut) {
        return prev.map(s => s.tedavi.id === tedavi.id ? { ...s, adet: s.adet + 1 } : s)
      }
      return [...prev, { tedavi, adet: 1 }]
    })
  }

  function tedaviCikar(id) {
    setSecilen(prev => prev.filter(s => s.tedavi.id !== id))
  }

  function adetDegistir(id, yeniAdet) {
    if (yeniAdet < 1) { tedaviCikar(id); return }
    setSecilen(prev => prev.map(s => s.tedavi.id === id ? { ...s, adet: yeniAdet } : s))
  }

  // Hesaplama — useMemo: secilen/sigorta/malzeme değişince yeniden hesapla
  const hesap = useMemo(() => {
    const sigortaCarpan = SİGORTA_SEÇENEKLERİ[sigorta].carpan
    const malzemeCarpan = MALZEME_SEÇENEKLERİ[malzeme].carpan

    const satirlar = secilen.map(({ tedavi, adet }) => {
      const birimFiyat = tedavi.temelFiyat * malzemeCarpan
      const toplam     = birimFiyat * adet * sigortaCarpan
      return { tedavi, adet, birimFiyat, toplam }
    })

    const araToplam    = satirlar.reduce((t, s) => t + s.tedavi.temelFiyat * MALZEME_SEÇENEKLERİ[malzeme].carpan * s.adet, 0)
    const indirimTutar = araToplam * (1 - sigortaCarpan)
    const genelToplam  = araToplam - indirimTutar

    return { satirlar, araToplam, indirimTutar, genelToplam }
  }, [secilen, sigorta, malzeme])

  const kategoriler = [...new Set(tedaviler.map(t => t.kategori))]

  return (
    <div className="fiyat-hesap" style={s.hesaplamaGrid}>
      {/* SOL — Tedavi Seçimi */}
      <div style={s.panel}>
        <h3 style={s.panelBaslik}>Tedavi Seç</h3>
        {yukleniyor ? <p style={s.bilgi}>Yükleniyor...</p> : tedaviler.length === 0 ? (
          <p style={s.bilgi}>Henüz tedavi eklenmemiş. "Tedavi Listesi" sekmesinden ekleyin.</p>
        ) : (
          kategoriler.map(kat => (
            <div key={kat} style={s.katGrubu}>
              <div style={s.katBaslik}>{kat}</div>
              {tedaviler.filter(t => t.kategori === kat).map(t => (
                <div key={t.id} style={s.tedaviSatir} onClick={() => tedaviEkle(t)}>
                  <span style={s.tedaviAd}>{t.ad}</span>
                  <span style={s.tedaviFiyat}>₺{t.temelFiyat.toFixed(2)}</span>
                  <span style={s.ekleIkon}>+</span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* SAĞ — Hesap Özeti */}
      <div style={s.panel}>
        <h3 style={s.panelBaslik}>Hesap Özeti</h3>

        {/* Faktörler */}
        <div style={s.faktorler}>
          <div style={s.faktorGrubu}>
            <label style={s.faktorEtiket}>Sigorta / Ödeme Türü</label>
            <div style={s.radyoGrubu}>
              {SİGORTA_SEÇENEKLERİ.map((s, i) => (
                <label key={i} style={radyoStil(sigorta === i)}>
                  <input type="radio" name="sigorta" checked={sigorta === i}
                    onChange={() => setSigorta(i)} style={{ display: 'none' }} />
                  {s.etiket}
                </label>
              ))}
            </div>
          </div>

          <div style={s.faktorGrubu}>
            <label style={s.faktorEtiket}>Malzeme Kalitesi</label>
            <div style={s.radyoGrubu}>
              {MALZEME_SEÇENEKLERİ.map((m, i) => (
                <label key={i} style={radyoStil(malzeme === i)}>
                  <input type="radio" name="malzeme" checked={malzeme === i}
                    onChange={() => setMalzeme(i)} style={{ display: 'none' }} />
                  {m.etiket}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Seçilen Tedaviler */}
        {secilen.length === 0 ? (
          <p style={s.bilgi}>Soldan tedavi ekleyin.</p>
        ) : (
          <>
            <table style={s.ozettablo}>
              <thead>
                <tr style={{ background: '#f5f6fa' }}>
                  {['Tedavi', 'Birim Fiyat', 'Adet', 'Toplam'].map(h => (
                    <th key={h} style={s.ozeth}>{h}</th>
                  ))}
                  <th style={s.ozeth}></th>
                </tr>
              </thead>
              <tbody>
                {hesap.satirlar.map(({ tedavi, adet, birimFiyat, toplam }) => (
                  <tr key={tedavi.id} style={s.ozettr}>
                    <td style={s.ozettd}>{tedavi.ad}</td>
                    <td style={{ ...s.ozettd, textAlign: 'right' }}>₺{birimFiyat.toFixed(2)}</td>
                    <td style={s.ozettd}>
                      <div style={s.adetKontrol}>
                        <button style={s.adetBtn} onClick={() => adetDegistir(tedavi.id, adet - 1)}>−</button>
                        <span style={s.adetSayi}>{adet}</span>
                        <button style={s.adetBtn} onClick={() => adetDegistir(tedavi.id, adet + 1)}>+</button>
                      </div>
                    </td>
                    <td style={{ ...s.ozettd, textAlign: 'right', fontWeight: 600 }}>₺{toplam.toFixed(2)}</td>
                    <td style={s.ozettd}>
                      <button style={s.silBtn} onClick={() => tedaviCikar(tedavi.id)}>×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Toplam Satırları */}
            <div style={s.toplamlar}>
              <div style={s.toplamSatir}>
                <span>Ara Toplam</span>
                <span>₺{hesap.araToplam.toFixed(2)}</span>
              </div>
              {hesap.indirimTutar > 0 && (
                <div style={{ ...s.toplamSatir, color: '#2e7d32' }}>
                  <span>{SİGORTA_SEÇENEKLERİ[sigorta].etiket} İndirimi</span>
                  <span>− ₺{hesap.indirimTutar.toFixed(2)}</span>
                </div>
              )}
              <div style={{ ...s.toplamSatir, ...s.genelToplam }}>
                <span>Genel Toplam</span>
                <span>₺{hesap.genelToplam.toFixed(2)}</span>
              </div>
            </div>

            <button style={s.sifirlaBtn} onClick={() => setSecilen([])}>Hesabı Sıfırla</button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── TEDAVİ LİSTESİ (CRUD) ───────────────────────────────────────────────────
function TedaviListesi() {
  const { apiFetch }  = useApi()
  const fileInputRef  = useRef(null)
  const [tedaviler,         setTedaviler]        = useState([])
  const [yukleniyor,        setYukleniyor]       = useState(true)
  const [modalAcik,         setModalAcik]        = useState(false)
  const [duzenleId,         setDuzenleId]        = useState(null)
  const [form,              setForm]             = useState(BOSH_FORM)
  const [kaydediyor,        setKaydediyor]       = useState(false)
  const [importSatirlari,   setImportSatirlari]  = useState([])
  const [importModalAcik,   setImportModalAcik]  = useState(false)
  const [importYukleniyor,  setImportYukleniyor] = useState(false)
  const [importSonuc,       setImportSonuc]      = useState(null)

  useEffect(() => { getir() }, [])

  async function getir() {
    try { setTedaviler(await apiFetch('/api/tedaviler')) }
    finally { setYukleniyor(false) }
  }

  function yeniAc()  { setForm(BOSH_FORM); setDuzenleId(null); setModalAcik(true) }
  function duzenleAc(t) { setForm({ ad: t.ad, kategori: t.kategori, temelFiyat: String(t.temelFiyat) }); setDuzenleId(t.id); setModalAcik(true) }
  function kapat()   { setModalAcik(false); setDuzenleId(null); setForm(BOSH_FORM) }

  async function gonder(e) {
    e.preventDefault()
    setKaydediyor(true)
    try {
      const govde = { ad: form.ad, kategori: form.kategori, temelFiyat: parseFloat(form.temelFiyat) }
      if (duzenleId) await apiFetch(`/api/tedaviler/${duzenleId}`, { method: 'PUT',  body: JSON.stringify(govde) })
      else           await apiFetch('/api/tedaviler',              { method: 'POST', body: JSON.stringify(govde) })
      kapat(); await getir()
    } catch (e) { await hataGoster(e.message) }
    finally { setKaydediyor(false) }
  }

  async function sil(id, ad) {
    if (!(await silOnay(`"${ad}" tedavisini silmek istediğinize emin misiniz?`))) return
    try { await apiFetch(`/api/tedaviler/${id}`, { method: 'DELETE' }); await getir() }
    catch (e) { await hataGoster(e.message) }
  }

  // ── Tedavi Excel Şablon ─────────────────────────────────────────
  function sablonIndir() {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Tedavi Adı', 'Kategori', 'Baz Fiyat'],
      ['Kontrol Muayenesi',   'Muayene',        150],
      ['Kompozit Dolgu',      'Dolgu',           400],
      ['Kanal Tedavisi',      'Kanal Tedavisi',  800],
      [],
      ['📌 Kategori seçenekleri:', 'Muayene, Dolgu, Kanal Tedavisi, İmplant, Ortodonti, Cerrahi, Estetik, Diğer'],
    ])
    ws['!cols'] = [{ wch: 28 }, { wch: 18 }, { wch: 12 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Tedavi Import')
    XLSX.writeFile(wb, 'tedavi-import-sablonu.xlsx')
  }

  async function excelOku(e) {
    const file = e.target.files[0]
    if (!file) return
    try {
      const data = await file.arrayBuffer()
      const wb   = XLSX.read(data, { type: 'array' })
      const ws   = wb.Sheets[wb.SheetNames[0]]
      const satirlar = XLSX.utils.sheet_to_json(ws, { defval: '' })
        .filter(r => r['Tedavi Adı'] && String(r['Tedavi Adı']).trim() !== '' && !String(r['Tedavi Adı']).startsWith('📌'))
      if (satirlar.length === 0) { await bilgiGoster('Dosyada geçerli veri satırı bulunamadı.'); return }
      setImportSatirlari(satirlar)
      setImportSonuc(null)
      setImportModalAcik(true)
    } catch (err) { await hataGoster('Excel dosyası okunamadı: ' + err.message) }
    finally { e.target.value = '' }
  }

  async function importOnayla() {
    setImportYukleniyor(true)
    let basarili = 0, hatali = 0
    for (const satir of importSatirlari) {
      try {
        await apiFetch('/api/tedaviler', {
          method: 'POST',
          body: JSON.stringify({
            ad:         String(satir['Tedavi Adı']).trim(),
            kategori:   KATEGORİLER.includes(satir['Kategori']) ? satir['Kategori'] : 'Diğer',
            temelFiyat: parseFloat(satir['Baz Fiyat']) || 0,
          }),
        })
        basarili++
      } catch { hatali++ }
    }
    setImportYukleniyor(false)
    setImportSonuc({ basarili, hatali })
    await getir()
  }

  function importKapat() { setImportModalAcik(false); setImportSatirlari([]); setImportSonuc(null) }

  const kategoriler = [...new Set(tedaviler.map(t => t.kategori))]

  return (
    <div>
      {/* Gizli dosya input */}
      <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={excelOku} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={sablonIndir}                style={s.exportBtn}>📄 Şablon İndir</button>
        <button onClick={() => fileInputRef.current?.click()} style={s.importBtn}>📥 Excel İçe Aktar</button>
        <button onClick={yeniAc}                     style={s.ekleBtn}>+ Yeni Tedavi</button>
      </div>

      {/* Excel Import Modal */}
      {importModalAcik && (
        <div style={s.overlay} onClick={!importYukleniyor ? importKapat : undefined}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalBaslik}>📥 Tedavi Excel İçe Aktar</h2>
            {importSonuc ? (
              <div>
                <div style={importSonuc.hatali === 0
                  ? { background:'#e8f5e9',border:'1px solid #a5d6a7',borderRadius:8,padding:'14px 18px',color:'#2e7d32',fontWeight:600,marginBottom:16 }
                  : { background:'#fff8e1',border:'1px solid #ffe082',borderRadius:8,padding:'14px 18px',color:'#795548',fontWeight:600,marginBottom:16 }}>
                  {importSonuc.hatali === 0
                    ? `✅ ${importSonuc.basarili} tedavi başarıyla eklendi!`
                    : `⚠️ ${importSonuc.basarili} eklendi, ${importSonuc.hatali} satırda hata oluştu.`}
                </div>
                <div style={{ display:'flex',justifyContent:'flex-end' }}>
                  <button onClick={importKapat} style={s.kaydetBtn}>Tamam</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ background:'#E8F5EE',border:'1px solid #B2D9C5',borderRadius:8,padding:'10px 14px',marginBottom:14,fontSize:14,color:'#1F6B4C' }}>
                  <strong>{importSatirlari.length} satır</strong> bulundu.
                </div>
                <div style={{ maxHeight:240,overflowY:'auto',border:'1px solid #eee',borderRadius:8,marginBottom:8 }}>
                  <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
                    <thead>
                      <tr style={{ background:'#E8F5EE' }}>
                        {['Tedavi Adı','Kategori','Baz Fiyat'].map(h => (
                          <th key={h} style={{ padding:'6px 8px',textAlign:'left',color:'#1F6B4C',fontWeight:600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importSatirlari.slice(0,8).map((r,i) => (
                        <tr key={i} style={{ borderBottom:'1px solid #f0f0f0' }}>
                          <td style={{ padding:'5px 8px' }}>{r['Tedavi Adı']}</td>
                          <td style={{ padding:'5px 8px' }}>{r['Kategori']}</td>
                          <td style={{ padding:'5px 8px' }}>₺{r['Baz Fiyat']}</td>
                        </tr>
                      ))}
                      {importSatirlari.length > 8 && (
                        <tr><td colSpan={3} style={{ padding:'5px 8px',color:'#888',fontStyle:'italic' }}>... {importSatirlari.length - 8} satır daha</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div style={{ display:'flex',justifyContent:'flex-end',gap:10,marginTop:16 }}>
                  <button onClick={importKapat} style={s.iptalBtn} disabled={importYukleniyor}>İptal</button>
                  <button onClick={importOnayla} style={s.kaydetBtn} disabled={importYukleniyor}>
                    {importYukleniyor ? 'İçe aktarılıyor...' : `${importSatirlari.length} Tedaviyi İçe Aktar`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}


      {yukleniyor ? <p style={s.bilgi}>Yükleniyor...</p> : tedaviler.length === 0 ? (
        <p style={s.bilgi}>Henüz tedavi eklenmemiş.</p>
      ) : (
        kategoriler.map(kat => (
          <div key={kat} style={s.listeGrubu}>
            <h3 style={s.listeKatBaslik}>{kat}</h3>
            <table style={s.tablo}>
              <thead>
                <tr style={{ background: '#f5f6fa' }}>
                  {['Tedavi Adı', 'Baz Fiyat', 'İşlemler'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tedaviler.filter(t => t.kategori === kat).map(t => (
                  <tr key={t.id} style={s.tr}>
                    <td style={s.td}>{t.ad}</td>
                    <td style={{ ...s.td, fontWeight: 600 }}>₺{t.temelFiyat.toFixed(2)}</td>
                    <td style={s.td}>
                      <button onClick={() => duzenleAc(t)} style={s.duzenleBtn}>Düzenle</button>
                      <button onClick={() => sil(t.id, t.ad)} style={s.silTblBtn}>Sil</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}

      {modalAcik && (
        <div style={s.overlay} onClick={kapat}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalBaslik}>{duzenleId ? 'Tedaviyi Düzenle' : 'Yeni Tedavi Ekle'}</h2>
            <form onSubmit={gonder}>
              <div style={s.alan}>
                <label style={s.etiket}>Tedavi Adı</label>
                <input style={s.girdi} required value={form.ad}
                  onChange={e => setForm({ ...form, ad: e.target.value })} />
              </div>
              <div style={s.alan}>
                <label style={s.etiket}>Kategori</label>
                <select style={s.girdi} value={form.kategori}
                  onChange={e => setForm({ ...form, kategori: e.target.value })}>
                  {KATEGORİLER.map(k => <option key={k}>{k}</option>)}
                </select>
              </div>
              <div style={s.alan}>
                <label style={s.etiket}>Baz Fiyat (₺)</label>
                <input style={s.girdi} type="number" min="0" step="0.01" required
                  value={form.temelFiyat}
                  onChange={e => setForm({ ...form, temelFiyat: e.target.value })} />
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

// Radyo buton stili — seçili / seçili değil
const radyoStil = (aktif) => ({
  display: 'inline-block', padding: '6px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
  background: aktif ? '#1F6B4C' : '#f0f0f0',
  color: aktif ? '#fff' : '#555',
  userSelect: 'none',
})

// ─── STİLLER ──────────────────────────────────────────────────────────────────
const s = {
  sayfa:          { padding: 32, fontFamily: 'sans-serif' },
  baslikSatir:    { marginBottom: 20 },
  baslik:         { margin: '0 0 4px', fontSize: 26, color: '#1F6B4C' },
  altBaslik:      { margin: 0, color: '#888', fontSize: 14 },
  sekmeler:       { display: 'flex', gap: 8, marginBottom: 24, borderBottom: '2px solid #e8eaf6', paddingBottom: 0 },
  sekme:          { padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#666', borderBottom: '2px solid transparent', marginBottom: -2 },
  sekmeAktif:     { color: '#1F6B4C', fontWeight: 700, borderBottom: '2px solid #1a237e' },
  bilgi:          { color: '#aaa', textAlign: 'center', padding: 32 },

  // Hesaplama grid
  hesaplamaGrid:  { display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20, alignItems: 'start' },
  panel:          { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  panelBaslik:    { margin: '0 0 16px', color: '#1F6B4C', fontSize: 16 },

  // Tedavi seçim listesi
  katGrubu:       { marginBottom: 16 },
  katBaslik:      { fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  tedaviSatir:    { display: 'flex', alignItems: 'center', padding: '9px 12px', borderRadius: 8, cursor: 'pointer', background: '#F5FAF7', marginBottom: 4, transition: 'background .15s' },
  tedaviAd:       { flex: 1, fontSize: 14 },
  tedaviFiyat:    { fontSize: 13, color: '#555', marginRight: 10 },
  ekleIkon:       { width: 22, height: 22, background: '#1F6B4C', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 },

  // Faktörler
  faktorler:      { display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20, padding: 16, background: '#F5FAF7', borderRadius: 10 },
  faktorGrubu:    {},
  faktorEtiket:   { display: 'block', fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  radyoGrubu:     { display: 'flex', gap: 8, flexWrap: 'wrap' },

  // Özet tablo
  ozettablo:      { width: '100%', borderCollapse: 'collapse', marginBottom: 16 },
  ozeth:          { padding: '8px 10px', fontSize: 12, color: '#888', textAlign: 'left', fontWeight: 600 },
  ozettr:         { borderBottom: '1px solid #f0f0f0' },
  ozettd:         { padding: '10px 10px', fontSize: 14, verticalAlign: 'middle' },

  // Adet kontrol
  adetKontrol:    { display: 'flex', alignItems: 'center', gap: 8 },
  adetBtn:        { width: 24, height: 24, border: '1px solid #ddd', background: '#f5f5f5', borderRadius: 4, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  adetSayi:       { minWidth: 20, textAlign: 'center', fontWeight: 600 },
  silBtn:         { background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 18, lineHeight: 1 },

  // Toplamlar
  toplamlar:      { borderTop: '2px solid #e8eaf6', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 },
  toplamSatir:    { display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#555' },
  genelToplam:    { fontSize: 18, fontWeight: 700, color: '#1F6B4C', marginTop: 4 },
  sifirlaBtn:     { marginTop: 16, width: '100%', padding: 10, background: '#f5f5f5', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#888' },

  // Tedavi listesi
  listeGrubu:     { marginBottom: 24 },
  listeKatBaslik: { fontSize: 13, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' },
  ekleBtn:        { padding: '10px 20px', background: '#1F6B4C', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  importBtn:      { padding: '10px 16px', background: '#E8F5EE', color: '#1F6B4C', border: '1px solid #B2D9C5', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  exportBtn:      { padding: '10px 16px', background: '#fff', color: '#555', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
  tablo:          { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  th:             { padding: '11px 14px', fontSize: 13, color: '#666', fontWeight: 600, textAlign: 'left', borderBottom: '1px solid #eee' },
  tr:             { borderBottom: '1px solid #f5f5f5' },
  td:             { padding: '11px 14px', fontSize: 14 },
  duzenleBtn:     { padding: '5px 12px', background: '#E8F5EE', color: '#2D8A62', border: 'none', borderRadius: 6, cursor: 'pointer', marginRight: 6, fontSize: 13 },
  silTblBtn:      { padding: '5px 12px', background: '#fce4ec', color: '#c62828', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 },

  // Modal
  overlay:        { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:          { background: '#fff', borderRadius: 12, padding: 32, width: '100%', maxWidth: 420, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' },
  modalBaslik:    { margin: '0 0 24px', color: '#1F6B4C' },
  alan:           { marginBottom: 16 },
  etiket:         { display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 },
  girdi:          { width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 7, fontSize: 14, boxSizing: 'border-box' },
  iptalBtn:       { padding: '9px 20px', background: '#f5f5f5', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 14 },
  kaydetBtn:      { padding: '9px 24px', background: '#1F6B4C', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 14, fontWeight: 600 },
}
