import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../hooks/useApi'

const SAYFALAR = [
  { id: 'p-genel',     etiket: 'Genel Bakış',    yol: '/dashboard',                ikon: '📊', tip: 'Sayfa' },
  { id: 'p-stok',      etiket: 'Stok Takibi',    yol: '/dashboard/stok',           ikon: '📦', tip: 'Sayfa' },
  { id: 'p-fiyat',     etiket: 'Fiyat Hesaplama', yol: '/dashboard/fiyat',         ikon: '💰', tip: 'Sayfa' },
  { id: 'p-nobet',     etiket: 'Nöbetler',        yol: '/dashboard/nobet',         ikon: '📅', tip: 'Sayfa' },
  { id: 'p-finans',    etiket: 'Gelir / Gider',   yol: '/dashboard/finans',        ikon: '📈', tip: 'Sayfa' },
  { id: 'p-islemler',  etiket: 'İşlem Kaydı',     yol: '/dashboard/islemler',      ikon: '🦷', tip: 'Sayfa' },
  { id: 'p-randevu',   etiket: 'Randevular',       yol: '/dashboard/randevular',    ikon: '📩', tip: 'Sayfa' },
  { id: 'p-gorevler',  etiket: 'Görevler',         yol: '/dashboard/gorevler',      ikon: '✅', tip: 'Sayfa' },
  { id: 'p-raporlar',  etiket: 'Raporlar',         yol: '/dashboard/raporlar',      ikon: '📋', tip: 'Sayfa' },
  { id: 'p-kullanici', etiket: 'Kullanıcılar',     yol: '/dashboard/kullanicilar',  ikon: '👥', tip: 'Sayfa' },
  { id: 'p-siteayar',  etiket: 'Site Ayarları',    yol: '/dashboard/site-ayarlari', ikon: '🌐', tip: 'Sayfa' },
  { id: 'p-profil',    etiket: 'Profilim',          yol: '/dashboard/profil',        ikon: '👤', tip: 'Sayfa' },
]

let onbellek = null

export default function GenelArama({ onKapat }) {
  const navigate      = useNavigate()
  const { apiFetch }  = useApi()
  const inputRef      = useRef(null)
  const listRef       = useRef(null)

  const [sorgu,     setSorgu]     = useState('')
  const [veriler,   setVeriler]   = useState(onbellek)
  const [aktifIdx,  setAktifIdx]  = useState(0)

  // Veri yükle (bir kez)
  useEffect(() => {
    if (onbellek) return
    Promise.all([
      apiFetch('/api/stok'),
      apiFetch('/api/tedaviler'),
      apiFetch('/api/calisanlar'),
    ]).then(([stok, tedaviler, calisanlar]) => {
      onbellek = { stok, tedaviler, calisanlar }
      setVeriler(onbellek)
    }).catch(() => {})
  }, [])

  useEffect(() => { inputRef.current?.focus() }, [])

  // Sonuçları hesapla
  const sonuclar = useCallback(() => {
    const q = sorgu.trim().toLocaleLowerCase('tr-TR')
    if (!q) return []

    const esle = (str) => str?.toLocaleLowerCase('tr-TR').includes(q)
    const liste = []

    // Sayfalar
    SAYFALAR.filter(p => esle(p.etiket) || esle(p.tip)).forEach(p => liste.push(p))

    if (veriler) {
      // Stok
      veriler.stok
        .filter(k => esle(k.urunAdi) || esle(k.kategori))
        .slice(0, 5)
        .forEach(k => liste.push({
          id:     `stok-${k.id}`,
          etiket: k.urunAdi,
          alt:    `${k.kategori} · ${k.miktar} ${k.birim}`,
          yol:    '/dashboard/stok',
          ikon:   '📦',
          tip:    'Stok',
          dusuk:  k.miktar <= k.minimumMiktar,
        }))

      // Tedaviler
      veriler.tedaviler
        .filter(t => esle(t.ad) || esle(t.kategori))
        .slice(0, 5)
        .forEach(t => liste.push({
          id:     `tedavi-${t.id}`,
          etiket: t.ad,
          alt:    `${t.kategori} · ₺${t.temelFiyat}`,
          yol:    '/dashboard/fiyat',
          ikon:   '🦷',
          tip:    'Tedavi',
        }))

      // Çalışanlar
      veriler.calisanlar
        .filter(c => esle(c.adSoyad) || esle(c.unvan))
        .slice(0, 5)
        .forEach(c => liste.push({
          id:     `calisan-${c.id}`,
          etiket: c.adSoyad,
          alt:    c.unvan,
          yol:    '/dashboard/nobet',
          ikon:   '👨‍⚕️',
          tip:    'Çalışan',
        }))
    }

    return liste
  }, [sorgu, veriler])

  const liste = sonuclar()

  useEffect(() => { setAktifIdx(0) }, [sorgu])

  function git(yol) {
    navigate(yol)
    onKapat()
  }

  function klavye(e) {
    if (e.key === 'Escape') { onKapat(); return }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setAktifIdx(i => Math.min(i + 1, liste.length - 1))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setAktifIdx(i => Math.max(i - 1, 0))
    }
    if (e.key === 'Enter' && liste[aktifIdx]) {
      git(liste[aktifIdx].yol)
    }
  }

  // Aktif öğeyi görünür tut
  useEffect(() => {
    const el = listRef.current?.children[aktifIdx]
    el?.scrollIntoView({ block: 'nearest' })
  }, [aktifIdx])

  // Tip gruplama için başlık
  const TIP_SIRALAMA = ['Sayfa', 'Stok', 'Tedavi', 'Çalışan']
  const gruplar = {}
  liste.forEach(item => {
    if (!gruplar[item.tip]) gruplar[item.tip] = []
    gruplar[item.tip].push(item)
  })

  let globalIdx = 0

  return (
    <div className="genel-arama-overlay" style={s.overlay} onClick={onKapat}>
      <div className="genel-arama-kutu" style={s.kutu} onClick={e => e.stopPropagation()} onKeyDown={klavye}>
        {/* Arama girişi */}
        <div style={s.inputSatir}>
          <span style={s.aramaIkon}>🔍</span>
          <input
            ref={inputRef}
            style={s.input}
            placeholder="Sayfa, stok, tedavi veya çalışan ara..."
            value={sorgu}
            onChange={e => setSorgu(e.target.value)}
          />
          {sorgu && (
            <button style={s.temizle} onClick={() => setSorgu('')}>✕</button>
          )}
          <kbd style={s.escTusu}>ESC</kbd>
        </div>

        {/* Sonuçlar */}
        {sorgu.trim() === '' ? (
          <div style={s.ipucuKutu}>
            <div style={s.ipucuGrid}>
              {[
                { ikon: '↑↓', aciklama: 'Gezin' },
                { ikon: '↵',  aciklama: 'Git' },
                { ikon: 'ESC', aciklama: 'Kapat' },
              ].map(h => (
                <div key={h.ikon} style={s.ipucu}>
                  <kbd style={s.kipucu}>{h.ikon}</kbd>
                  <span style={s.ipucuYazi}>{h.aciklama}</span>
                </div>
              ))}
            </div>
            <p style={s.hizliErisim}>Hızlı erişim</p>
            <div ref={listRef} style={s.liste}>
              {SAYFALAR.slice(0, 6).map((p, i) => (
                <SonucSatiri key={p.id} item={p} aktif={false} onClick={() => git(p.yol)} />
              ))}
            </div>
          </div>
        ) : liste.length === 0 ? (
          <div style={s.sonucYok}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
            <p style={{ margin: 0, color: '#aaa', fontSize: 14 }}>
              "<strong>{sorgu}</strong>" için sonuç bulunamadı
            </p>
          </div>
        ) : (
          <div ref={listRef} style={s.liste}>
            {TIP_SIRALAMA.map(tip => {
              const grup = gruplar[tip]
              if (!grup?.length) return null
              return (
                <div key={tip}>
                  <div style={s.grupBaslik}>{tip}</div>
                  {grup.map(item => {
                    const idx = globalIdx++
                    return (
                      <SonucSatiri
                        key={item.id}
                        item={item}
                        aktif={aktifIdx === idx}
                        onClick={() => git(item.yol)}
                        onMouseEnter={() => setAktifIdx(idx)}
                      />
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}

        {/* Alt bilgi */}
        <div style={s.altBant}>
          {veriler
            ? `${veriler.stok.length} ürün · ${veriler.tedaviler.length} tedavi · ${veriler.calisanlar.length} çalışan indekslendi`
            : 'İndeksleniyor...'}
        </div>
      </div>
    </div>
  )
}

function SonucSatiri({ item, aktif, onClick, onMouseEnter }) {
  return (
    <div
      style={{ ...s.satir, ...(aktif ? s.satirAktif : {}) }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    >
      <span style={s.satirIkon}>{item.ikon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={s.satirEtiket}>{item.etiket}</div>
        {item.alt && <div style={s.satirAlt}>{item.alt}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {item.dusuk && <span style={s.dusukRozet}>⚠ Düşük</span>}
        <span style={s.tipRozet}>{item.tip}</span>
        {aktif && <span style={s.gitOk}>↵</span>}
      </div>
    </div>
  )
}

const s = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    paddingTop: 80, zIndex: 1000,
  },
  kutu: {
    width: '100%', maxWidth: 600, background: '#fff',
    borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
    overflow: 'hidden', maxHeight: '70vh', display: 'flex', flexDirection: 'column',
  },

  inputSatir: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '14px 16px', borderBottom: '1px solid #f0f0f0',
  },
  aramaIkon: { fontSize: 18, flexShrink: 0 },
  input: {
    flex: 1, border: 'none', outline: 'none', fontSize: 16,
    fontFamily: 'inherit', background: 'transparent',
  },
  temizle: {
    background: '#f0f0f0', border: 'none', borderRadius: 6,
    cursor: 'pointer', padding: '2px 7px', fontSize: 12, color: '#666',
  },
  escTusu: {
    background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 5,
    padding: '2px 7px', fontSize: 11, color: '#888', fontFamily: 'inherit',
  },

  ipucuKutu: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  ipucuGrid: { display: 'flex', gap: 16, padding: '10px 16px', borderBottom: '1px solid #f5f5f5' },
  ipucu:     { display: 'flex', alignItems: 'center', gap: 6 },
  kipucu:    { background: '#f0f0f0', border: '1px solid #ddd', borderRadius: 5, padding: '2px 8px', fontSize: 12, fontFamily: 'inherit', color: '#555' },
  ipucuYazi: { fontSize: 12, color: '#aaa' },
  hizliErisim: { margin: 0, padding: '10px 16px 4px', fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1 },

  liste: { overflowY: 'auto', flex: 1 },

  grupBaslik: {
    fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase',
    letterSpacing: 1, padding: '10px 16px 4px',
  },

  satir: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
    cursor: 'pointer', borderRadius: 0, transition: 'background 0.1s',
  },
  satirAktif:  { background: '#F0FFF8' },
  satirIkon:   { fontSize: 20, flexShrink: 0, width: 28, textAlign: 'center' },
  satirEtiket: { fontSize: 14, fontWeight: 600, color: '#1A3329' },
  satirAlt:    { fontSize: 12, color: '#888', marginTop: 1 },

  tipRozet:   { fontSize: 10, color: '#aaa', background: '#f5f5f5', padding: '2px 8px', borderRadius: 10 },
  dusukRozet: { fontSize: 10, color: '#e65100', background: '#FFF3E0', padding: '2px 8px', borderRadius: 10 },
  gitOk:      { fontSize: 14, color: '#1F6B4C', fontWeight: 700 },

  sonucYok: { padding: '40px 16px', textAlign: 'center' },

  altBant: {
    padding: '8px 16px', borderTop: '1px solid #f0f0f0',
    fontSize: 11, color: '#bbb', background: '#FAFAFA',
  },
}
