import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../hooks/useNotifications'

const TIP_ETIKET = { stok: 'Stok', gorev: 'Görev', nobet: 'Nöbet' }

export default function BildirimZili() {
  const navigate = useNavigate()
  const { bildirimler, okunmamisSayi, tumunuOkunduIsaretle, okunduIsaretle } = useNotifications()
  const [acik, setAcik] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function kapat(e) {
      if (ref.current && !ref.current.contains(e.target)) setAcik(false)
    }
    document.addEventListener('mousedown', kapat)
    return () => document.removeEventListener('mousedown', kapat)
  }, [])

  // Gruplara ayır: okunmamışlar önce, sonra tipe göre sırala
  const gruplar = {}
  bildirimler.forEach(b => {
    if (!gruplar[b.tip]) gruplar[b.tip] = []
    gruplar[b.tip].push(b)
  })

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Zil butonu */}
      <button
        style={{ ...s.zil, ...(acik ? s.zilAcik : {}) }}
        onClick={() => setAcik(a => !a)}
        aria-label="Bildirimler"
      >
        🔔
        {okunmamisSayi > 0 && (
          <span style={s.rozet}>{okunmamisSayi > 9 ? '9+' : okunmamisSayi}</span>
        )}
      </button>

      {/* Panel */}
      {acik && (
        <div className="bildirim-panel" style={s.panel}>
          {/* Başlık */}
          <div style={s.panelBaslik}>
            <span style={s.panelBaslikYazi}>
              Bildirimler
              {okunmamisSayi > 0 && (
                <span style={s.okunmamisRozet}>{okunmamisSayi} yeni</span>
              )}
            </span>
            {okunmamisSayi > 0 && (
              <button style={s.tumunuBtn} onClick={tumunuOkunduIsaretle}>
                Tümünü okundu işaretle
              </button>
            )}
          </div>

          {/* İçerik */}
          {bildirimler.length === 0 ? (
            <div style={s.bos}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🔔</div>
              <p style={{ margin: 0, color: '#aaa', fontSize: 13 }}>Bildirim yok</p>
            </div>
          ) : (
            <div style={s.liste}>
              {['stok', 'gorev', 'nobet'].map(tip => {
                const grup = gruplar[tip]
                if (!grup?.length) return null
                return (
                  <div key={tip}>
                    <div style={s.grupBaslik}>{TIP_ETIKET[tip]}</div>
                    {grup.map(b => (
                      <BildirimSatiri
                        key={b.id}
                        b={b}
                        okundu={false}
                        onClick={() => {
                          okunduIsaretle(b.id)
                          setAcik(false)
                          navigate(b.yol)
                        }}
                      />
                    ))}
                  </div>
                )
              })}
            </div>
          )}

          {/* Alt link */}
          {bildirimler.length > 0 && (
            <div style={s.panelAlt}>
              <button style={s.altBtn} onClick={() => { tumunuOkunduIsaretle(); setAcik(false) }}>
                Kapat
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BildirimSatiri({ b, onClick }) {
  return (
    <div style={{ ...s.bildirim, background: b.arka }} onClick={onClick}>
      <span style={s.bildirimIkon}>{b.ikon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...s.bildirimBaslik, color: b.renk }}>{b.baslik}</div>
        <div style={s.bildirimMesaj}>{b.mesaj}</div>
      </div>
      <span style={s.gitOk}>→</span>
    </div>
  )
}

const s = {
  zil: {
    position: 'relative', background: 'rgba(255,255,255,0.12)', border: 'none',
    borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 18,
    color: '#fff', transition: 'background 0.15s',
  },
  zilAcik: { background: 'rgba(255,255,255,0.25)' },

  rozet: {
    position: 'absolute', top: -4, right: -4,
    background: '#ef4444', color: '#fff',
    fontSize: 10, fontWeight: 700, minWidth: 18, height: 18,
    borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '2px solid #1F6B4C', lineHeight: 1,
  },

  panel: {
    position: 'absolute', top: 'calc(100% + 10px)', right: 0,
    width: 340, background: '#fff', borderRadius: 12,
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)', zIndex: 500,
    border: '1px solid #e8e8e8', overflow: 'hidden',
  },

  panelBaslik: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 16px', borderBottom: '1px solid #f0f0f0', background: '#FAFAFA',
  },
  panelBaslikYazi: { fontSize: 14, fontWeight: 700, color: '#1A3329', display: 'flex', alignItems: 'center', gap: 8 },
  okunmamisRozet:  { background: '#1F6B4C', color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 10 },

  tumunuBtn: {
    fontSize: 11, color: '#1F6B4C', background: 'none', border: 'none',
    cursor: 'pointer', fontWeight: 600, padding: '4px 8px',
    borderRadius: 6, textDecoration: 'underline',
  },

  liste: { maxHeight: 380, overflowY: 'auto' },

  grupBaslik: {
    fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase',
    letterSpacing: 1, padding: '10px 16px 4px',
  },

  bildirim: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(0,0,0,0.04)',
    transition: 'filter 0.1s',
  },
  bildirimIkon:   { fontSize: 20, flexShrink: 0, lineHeight: 1.4 },
  bildirimBaslik: { fontSize: 12, fontWeight: 700, marginBottom: 2 },
  bildirimMesaj:  { fontSize: 12, color: '#555', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  gitOk:          { fontSize: 12, color: '#ccc', flexShrink: 0, alignSelf: 'center' },

  bos: { padding: '32px 16px', textAlign: 'center' },

  panelAlt: { padding: '10px 16px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end' },
  altBtn:   { fontSize: 12, color: '#888', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' },
}
