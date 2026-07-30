import { useState, useEffect, useRef } from 'react'
import * as XLSX from 'xlsx'
import { useApi } from '../../hooks/useApi'
import { csvIndir, yazdir } from '../../utils/export'
import { silOnay, hataGoster, bilgiGoster } from '../../utils/dialog'

const BOSH_FORM = {
  urunAdi: '', kategori: 'Malzeme', birim: 'adet',
  miktar: '', minimumMiktar: '', birimFiyat: ''
}

const KATEGORİLER = ['Malzeme', 'İlaç', 'Ekipman', 'Sarf']
const BiRIMLER    = ['adet', 'kutu', 'ml', 'gr', 'lt', 'paket']

export default function StokPage() {
  const { apiFetch } = useApi()
  const fileInputRef = useRef(null)

  const [kalemler,       setKalemler]       = useState([])
  const [yukleniyor,     setYukleniyor]     = useState(true)
  const [hata,           setHata]           = useState(null)
  const [modalAcik,      setModalAcik]      = useState(false)
  const [duzenleId,      setDuzenleId]      = useState(null)
  const [form,           setForm]           = useState(BOSH_FORM)
  const [kaydediyor,     setKaydediyor]     = useState(false)
  const [aramaMetni,     setAramaMetni]     = useState('')
  const [aktifKategori,  setAktifKategori]  = useState('Tümü')

  // Excel import state
  const [importSatirlari,   setImportSatirlari]   = useState([])
  const [importModalAcik,   setImportModalAcik]   = useState(false)
  const [importYukleniyor,  setImportYukleniyor]  = useState(false)
  const [importSonuc,       setImportSonuc]       = useState(null)

  useEffect(() => { verileriGetir() }, [])

  async function verileriGetir() {
    try {
      setYukleniyor(true)
      const veri = await apiFetch('/api/stok')
      setKalemler(veri)
      setHata(null)
    } catch (e) {
      setHata(e.message)
    } finally {
      setYukleniyor(false)
    }
  }

  function yeniKalemAc() { setForm(BOSH_FORM); setDuzenleId(null); setModalAcik(true) }

  function duzenleAc(kalem) {
    setForm({
      urunAdi: kalem.urunAdi, kategori: kalem.kategori, birim: kalem.birim,
      miktar: String(kalem.miktar), minimumMiktar: String(kalem.minimumMiktar),
      birimFiyat: String(kalem.birimFiyat),
    })
    setDuzenleId(kalem.id)
    setModalAcik(true)
  }

  function modalKapat() { setModalAcik(false); setDuzenleId(null); setForm(BOSH_FORM) }

  async function formGonder(e) {
    e.preventDefault()
    setKaydediyor(true)
    try {
      const govde = {
        urunAdi: form.urunAdi, kategori: form.kategori, birim: form.birim,
        miktar: parseFloat(form.miktar), minimumMiktar: parseFloat(form.minimumMiktar),
        birimFiyat: parseFloat(form.birimFiyat),
      }
      if (duzenleId) await apiFetch(`/api/stok/${duzenleId}`, { method: 'PUT',  body: JSON.stringify(govde) })
      else           await apiFetch('/api/stok',               { method: 'POST', body: JSON.stringify(govde) })
      modalKapat()
      await verileriGetir()
    } catch (e) {
      await hataGoster(e.message)
    } finally {
      setKaydediyor(false)
    }
  }

  async function kalemSil(id, ad) {
    if (!(await silOnay(`"${ad}" ürününü silmek istediğinize emin misiniz?`))) return
    try { await apiFetch(`/api/stok/${id}`, { method: 'DELETE' }); await verileriGetir() }
    catch (e) { await hataGoster('Silme hatası: ' + e.message) }
  }

  // ── Excel Şablon İndir ────────────────────────────────────────────
  function sablonIndir() {
    const basliklar = [['Ürün Adı', 'Kategori', 'Birim', 'Miktar', 'Min. Miktar', 'Birim Fiyat']]
    const ornekler  = [
      ['Kompozit Dolgu Malzemesi', 'Malzeme', 'gr',   100, 20, 15.50],
      ['Anestezi Kartuşu',         'İlaç',    'kutu',   5, 10, 85.00],
      ['Lateks Eldiven',           'Sarf',    'kutu',  20,  5, 32.00],
    ]
    const notlar = [
      [],
      ['📌 Kategori seçenekleri:', 'Malzeme, İlaç, Ekipman, Sarf'],
      ['📌 Birim seçenekleri:',    'adet, kutu, ml, gr, lt, paket'],
    ]

    const ws = XLSX.utils.aoa_to_sheet([...basliklar, ...ornekler, ...notlar])

    // Sütun genişlikleri
    ws['!cols'] = [{ wch: 28 }, { wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 12 }]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Stok Import')
    XLSX.writeFile(wb, 'stok-import-sablonu.xlsx')
  }

  // ── Excel Dosya Seç ───────────────────────────────────────────────
  function excelSec() { fileInputRef.current?.click() }

  async function excelOku(e) {
    const file = e.target.files[0]
    if (!file) return
    try {
      const data = await file.arrayBuffer()
      const wb   = XLSX.read(data, { type: 'array' })
      const ws   = wb.Sheets[wb.SheetNames[0]]
      const satirlar = XLSX.utils.sheet_to_json(ws, { defval: '' })
        .filter(r => r['Ürün Adı'] && String(r['Ürün Adı']).trim() !== '' && !String(r['Ürün Adı']).startsWith('📌'))

      if (satirlar.length === 0) { await bilgiGoster('Dosyada geçerli veri satırı bulunamadı.'); return }
      setImportSatirlari(satirlar)
      setImportSonuc(null)
      setImportModalAcik(true)
    } catch (err) {
      await hataGoster('Excel dosyası okunamadı: ' + err.message)
    } finally {
      e.target.value = ''
    }
  }

  // ── Excel Import Onayla ───────────────────────────────────────────
  async function importOnayla() {
    setImportYukleniyor(true)
    let basarili = 0, hatali = 0
    for (const satir of importSatirlari) {
      try {
        await apiFetch('/api/stok', {
          method: 'POST',
          body: JSON.stringify({
            urunAdi:       String(satir['Ürün Adı']).trim(),
            kategori:      KATEGORİLER.includes(satir['Kategori']) ? satir['Kategori'] : 'Malzeme',
            birim:         BiRIMLER.includes(satir['Birim'])       ? satir['Birim']    : 'adet',
            miktar:        parseFloat(satir['Miktar'])        || 0,
            minimumMiktar: parseFloat(satir['Min. Miktar'])   || 0,
            birimFiyat:    parseFloat(satir['Birim Fiyat'])   || 0,
          }),
        })
        basarili++
      } catch { hatali++ }
    }
    setImportYukleniyor(false)
    setImportSonuc({ basarili, hatali })
    await verileriGetir()
  }

  function importKapat() { setImportModalAcik(false); setImportSatirlari([]); setImportSonuc(null) }

  const aramaFiltreli = kalemler.filter(k =>
    k.urunAdi.toLowerCase().includes(aramaMetni.toLowerCase()) ||
    k.kategori.toLowerCase().includes(aramaMetni.toLowerCase())
  )
  const gorunenKalemler = aramaFiltreli.filter(k => {
    if (aktifKategori === 'Tümü')        return true
    if (aktifKategori === 'Düşük Stok') return k.dusukStok
    return k.kategori === aktifKategori
  })
  const dusukStokSayisi = kalemler.filter(k => k.dusukStok).length

  const FILTRELER = [
    { etiket: 'Tümü',       sayi: aramaFiltreli.length },
    ...KATEGORİLER.map(k => ({ etiket: k, sayi: aramaFiltreli.filter(x => x.kategori === k).length })),
    { etiket: 'Düşük Stok', sayi: aramaFiltreli.filter(k => k.dusukStok).length },
  ]

  return (
    <div style={s.sayfa}>
      {/* Başlık */}
      <div style={s.baslikSatir}>
        <div>
          <h1 style={s.baslik}>Stok Takibi</h1>
          <p style={s.altBaslik}>{kalemler.length} ürün kayıtlı</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => csvIndir(gorunenKalemler.map(k => ({
            'Ürün Adı': k.urunAdi, 'Kategori': k.kategori, 'Miktar': k.miktar,
            'Min. Miktar': k.minimumMiktar, 'Birim': k.birim, 'Birim Fiyat': k.birimFiyat,
            'Durum': k.dusukStok ? 'Düşük Stok' : 'Yeterli',
          })), 'stok-listesi')} style={s.exportBtn}>⬇ CSV</button>
          <button onClick={() => yazdir('stok-tablo', 'Stok Listesi')} style={s.exportBtn}>🖨 PDF</button>
          <button onClick={sablonIndir} style={s.exportBtn}>📄 Şablon</button>
          <button onClick={excelSec}    style={s.importBtn}>📥 Excel İçe Aktar</button>
          <button onClick={yeniKalemAc} style={s.ekleBtn}>+ Yeni Ürün</button>
        </div>
      </div>

      {/* Gizli dosya input */}
      <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={excelOku} />

      {dusukStokSayisi > 0 && (
        <div style={s.uyari}>⚠️ <strong>{dusukStokSayisi} ürünün</strong> stoğu minimum seviyenin altında!</div>
      )}

      <input style={s.arama} placeholder="Ürün adı veya kategori ara..."
        value={aramaMetni} onChange={e => setAramaMetni(e.target.value)} />

      <div style={s.filtreSatir}>
        {FILTRELER.map(f => {
          const aktif = aktifKategori === f.etiket
          const dusuk = f.etiket === 'Düşük Stok'
          return (
            <button
              key={f.etiket}
              onClick={() => setAktifKategori(f.etiket)}
              style={{
                ...s.filtrePill,
                ...(aktif
                  ? (dusuk ? s.filtrePillAktifDusuk : s.filtrePillAktif)
                  : {}),
              }}
            >
              {f.etiket}
              <span style={{ ...s.filtreRozet, ...(aktif ? s.filtreRozetAktif : {}) }}>
                {f.sayi}
              </span>
            </button>
          )
        })}
      </div>

      {yukleniyor ? <p style={s.bilgi}>Yükleniyor...</p>
        : hata ? <p style={{ ...s.bilgi, color: '#c00' }}>Hata: {hata}</p>
        : gorunenKalemler.length === 0 ? <p style={s.bilgi}>Ürün bulunamadı.</p>
        : (
        <div style={s.tabloSarici}>
          <table id="stok-tablo" style={s.tablo}>
            <thead>
              <tr style={s.tabloBaslikSatir}>
                {['Ürün Adı', 'Kategori', 'Miktar', 'Min. Miktar', 'Birim', 'Birim Fiyat', 'Durum', 'İşlemler'].map(b => (
                  <th key={b} style={s.th}>{b}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gorunenKalemler.map(k => (
                <tr key={k.id} style={s.tr}>
                  <td style={s.td}><strong>{k.urunAdi}</strong></td>
                  <td style={s.td}><span style={s.kategoriRozet}>{k.kategori}</span></td>
                  <td style={{ ...s.td, textAlign: 'right' }}>{k.miktar}</td>
                  <td style={{ ...s.td, textAlign: 'right' }}>{k.minimumMiktar}</td>
                  <td style={s.td}>{k.birim}</td>
                  <td style={{ ...s.td, textAlign: 'right' }}>₺{k.birimFiyat.toFixed(2)}</td>
                  <td style={s.td}>
                    <span style={k.dusukStok ? s.rozetKirmizi : s.rozetYesil}>
                      {k.dusukStok ? '⚠️ Düşük' : '✓ Yeterli'}
                    </span>
                  </td>
                  <td style={s.td}>
                    <button onClick={() => duzenleAc(k)} style={s.duzenleBtn}>Düzenle</button>
                    <button onClick={() => kalemSil(k.id, k.urunAdi)} style={s.silBtn}>Sil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Ürün Ekle/Düzenle Modalı */}
      {modalAcik && (
        <div style={s.overlay} onClick={modalKapat}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalBaslik}>{duzenleId ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}</h2>
            <form onSubmit={formGonder}>
              <GirdiAlani etiket="Ürün Adı">
                <input style={s.girdi} value={form.urunAdi} required onChange={e => setForm({ ...form, urunAdi: e.target.value })} />
              </GirdiAlani>
              <div style={s.satirGrid}>
                <GirdiAlani etiket="Kategori">
                  <select style={s.girdi} value={form.kategori} onChange={e => setForm({ ...form, kategori: e.target.value })}>
                    {KATEGORİLER.map(k => <option key={k}>{k}</option>)}
                  </select>
                </GirdiAlani>
                <GirdiAlani etiket="Birim">
                  <select style={s.girdi} value={form.birim} onChange={e => setForm({ ...form, birim: e.target.value })}>
                    {BiRIMLER.map(b => <option key={b}>{b}</option>)}
                  </select>
                </GirdiAlani>
              </div>
              <div style={s.satirGrid}>
                <GirdiAlani etiket="Mevcut Miktar">
                  <input style={s.girdi} type="number" min="0" step="0.01" required value={form.miktar} onChange={e => setForm({ ...form, miktar: e.target.value })} />
                </GirdiAlani>
                <GirdiAlani etiket="Minimum Miktar">
                  <input style={s.girdi} type="number" min="0" step="0.01" required value={form.minimumMiktar} onChange={e => setForm({ ...form, minimumMiktar: e.target.value })} />
                </GirdiAlani>
              </div>
              <GirdiAlani etiket="Birim Fiyat (₺)">
                <input style={s.girdi} type="number" min="0" step="0.01" required value={form.birimFiyat} onChange={e => setForm({ ...form, birimFiyat: e.target.value })} />
              </GirdiAlani>
              <div style={s.modalBtnSatir}>
                <button type="button" onClick={modalKapat} style={s.iptalBtn}>İptal</button>
                <button type="submit" disabled={kaydediyor} style={s.kaydetBtn}>
                  {kaydediyor ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Import Modalı */}
      {importModalAcik && (
        <div style={s.overlay} onClick={!importYukleniyor ? importKapat : undefined}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalBaslik}>📥 Excel İçe Aktar</h2>

            {importSonuc ? (
              <div>
                <div style={importSonuc.hatali === 0 ? s.sonucBasari : s.sonucUyari}>
                  {importSonuc.hatali === 0
                    ? `✅ ${importSonuc.basarili} ürün başarıyla eklendi!`
                    : `⚠️ ${importSonuc.basarili} ürün eklendi, ${importSonuc.hatali} satırda hata oluştu.`}
                </div>
                <div style={s.modalBtnSatir}>
                  <button onClick={importKapat} style={s.kaydetBtn}>Tamam</button>
                </div>
              </div>
            ) : (
              <>
                <div style={s.importBilgi}>
                  <strong>{importSatirlari.length} satır</strong> bulundu. Aşağıda önizleyebilirsiniz.
                </div>
                <div style={s.importOnizleme}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#E8F5EE' }}>
                        {['Ürün Adı', 'Kategori', 'Birim', 'Miktar', 'Min.', 'Fiyat'].map(h => (
                          <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: '#1F6B4C', fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importSatirlari.slice(0, 8).map((r, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '5px 8px' }}>{r['Ürün Adı']}</td>
                          <td style={{ padding: '5px 8px' }}>{r['Kategori']}</td>
                          <td style={{ padding: '5px 8px' }}>{r['Birim']}</td>
                          <td style={{ padding: '5px 8px' }}>{r['Miktar']}</td>
                          <td style={{ padding: '5px 8px' }}>{r['Min. Miktar']}</td>
                          <td style={{ padding: '5px 8px' }}>{r['Birim Fiyat']}</td>
                        </tr>
                      ))}
                      {importSatirlari.length > 8 && (
                        <tr><td colSpan={6} style={{ padding: '5px 8px', color: '#888', fontStyle: 'italic' }}>... ve {importSatirlari.length - 8} satır daha</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div style={s.modalBtnSatir}>
                  <button onClick={importKapat} style={s.iptalBtn} disabled={importYukleniyor}>İptal</button>
                  <button onClick={importOnayla} style={s.kaydetBtn} disabled={importYukleniyor}>
                    {importYukleniyor ? `İçe aktarılıyor...` : `${importSatirlari.length} Ürünü İçe Aktar`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function GirdiAlani({ etiket, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={s.etiket}>{etiket}</label>
      {children}
    </div>
  )
}

const s = {
  sayfa:            { padding: 32, fontFamily: 'sans-serif' },
  baslikSatir:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  baslik:           { margin: '0 0 4px', fontSize: 26, color: '#1F6B4C' },
  altBaslik:        { margin: 0, color: '#888', fontSize: 14 },
  ekleBtn:          { padding: '10px 20px', background: '#1F6B4C', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  exportBtn:        { padding: '10px 16px', background: '#fff', color: '#555', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
  importBtn:        { padding: '10px 16px', background: '#E8F5EE', color: '#1F6B4C', border: '1px solid #B2D9C5', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  uyari:            { background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#795548' },
  arama:            { width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, marginBottom: 10, boxSizing: 'border-box' },
  filtreSatir:      { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 },
  filtrePill:       { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#fff', border: '1.5px solid #ddd', borderRadius: 20, fontSize: 13, cursor: 'pointer', color: '#555', fontWeight: 500, transition: 'all 0.15s' },
  filtrePillAktif:  { background: '#1F6B4C', borderColor: '#1F6B4C', color: '#fff' },
  filtrePillAktifDusuk: { background: '#e65100', borderColor: '#e65100', color: '#fff' },
  filtreRozet:      { background: '#f0f0f0', color: '#666', fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 10, minWidth: 18, textAlign: 'center' },
  filtreRozetAktif: { background: 'rgba(255,255,255,0.25)', color: '#fff' },
  bilgi:            { textAlign: 'center', color: '#888', padding: 40 },
  tabloSarici:      { overflowX: 'auto', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  tablo:            { width: '100%', borderCollapse: 'collapse', background: '#fff' },
  tabloBaslikSatir: { background: '#F5FAF7' },
  th:               { padding: '12px 14px', textAlign: 'left', fontSize: 13, color: '#666', fontWeight: 600, borderBottom: '1px solid #eee' },
  tr:               { borderBottom: '1px solid #f0f0f0' },
  td:               { padding: '12px 14px', fontSize: 14, verticalAlign: 'middle' },
  kategoriRozet:    { background: '#E8F5EE', color: '#2D8A62', padding: '2px 10px', borderRadius: 20, fontSize: 12 },
  rozetYesil:       { background: '#e8f5e9', color: '#2e7d32', padding: '3px 10px', borderRadius: 20, fontSize: 12 },
  rozetKirmizi:     { background: '#fff3e0', color: '#e65100', padding: '3px 10px', borderRadius: 20, fontSize: 12 },
  duzenleBtn:       { padding: '5px 12px', background: '#E8F5EE', color: '#2D8A62', border: 'none', borderRadius: 6, cursor: 'pointer', marginRight: 6, fontSize: 13 },
  silBtn:           { padding: '5px 12px', background: '#fce4ec', color: '#c62828', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  overlay:          { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:            { background: '#fff', borderRadius: 12, padding: 32, width: '100%', maxWidth: 520, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' },
  modalBaslik:      { margin: '0 0 20px', color: '#1F6B4C' },
  satirGrid:        { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  etiket:           { display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#555' },
  girdi:            { width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 7, fontSize: 14, boxSizing: 'border-box' },
  modalBtnSatir:    { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 },
  iptalBtn:         { padding: '9px 20px', background: '#f5f5f5', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 14 },
  kaydetBtn:        { padding: '9px 24px', background: '#1F6B4C', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 14, fontWeight: 600 },
  importBilgi:      { background: '#E8F5EE', border: '1px solid #B2D9C5', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 14, color: '#1F6B4C' },
  importOnizleme:   { maxHeight: 260, overflowY: 'auto', border: '1px solid #eee', borderRadius: 8, marginBottom: 8 },
  sonucBasari:      { background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: 8, padding: '14px 18px', color: '#2e7d32', fontWeight: 600, marginBottom: 16 },
  sonucUyari:       { background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 8, padding: '14px 18px', color: '#795548', fontWeight: 600, marginBottom: 16 },
}
