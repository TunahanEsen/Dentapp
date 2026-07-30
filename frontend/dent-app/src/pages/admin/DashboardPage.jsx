import { useState, useEffect } from 'react'
import { NavLink, useNavigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import BildirimZili from '../../components/BildirimZili'
import GenelArama   from '../../components/GenelArama'

const MENU = [
  { etiket: 'Genel Bakış',   yol: '/dashboard',              ikon: '📊', adminOnly: false },
  { etiket: 'Stok Takibi',   yol: '/dashboard/stok',         ikon: '📦', adminOnly: false },
  { etiket: 'Fiyat Hesap',   yol: '/dashboard/fiyat',        ikon: '💰', adminOnly: false },
  { etiket: 'Nöbetler',      yol: '/dashboard/nobet',        ikon: '📅', adminOnly: false },
  { etiket: 'Gelir / Gider', yol: '/dashboard/finans',       ikon: '📈', adminOnly: false },
  { etiket: 'İşlem Kaydı',   yol: '/dashboard/islemler',     ikon: '🦷', adminOnly: false },
  { etiket: 'Randevular',    yol: '/dashboard/randevular',   ikon: '📩', adminOnly: false },
  { etiket: 'Görevler',      yol: '/dashboard/gorevler',     ikon: '✅', adminOnly: false },
  { etiket: 'Lab Takibi',    yol: '/dashboard/lab-takibi',   ikon: '🔬', adminOnly: false },
  { etiket: 'Raporlar',      yol: '/dashboard/raporlar',     ikon: '📊', adminOnly: false },
  { etiket: 'Kullanıcılar',  yol: '/dashboard/kullanicilar', ikon: '👥', adminOnly: true  },
  { etiket: 'Site Ayarları', yol: '/dashboard/site-ayarlari', ikon: '🌐', adminOnly: true  },
]

export default function DashboardPage() {
  const { kullanici, cikisYap } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const isAdmin   = kullanici?.role === 'Admin'
  const [acik,       setAcik]       = useState(false)
  const [aramaAcik,  setAramaAcik]  = useState(false)

  useEffect(() => { setAcik(false) }, [location.pathname])

  useEffect(() => {
    function ctrlK(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setAramaAcik(a => !a)
      }
    }
    window.addEventListener('keydown', ctrlK)
    return () => window.removeEventListener('keydown', ctrlK)
  }, [])

  function handleCikis() { cikisYap(); navigate('/') }

  const menuOgeleri = MENU.filter(item => !item.adminOnly || isAdmin)

  return (
    <div style={s.sayfa}>
      {/* Mobil üst bar */}
      <div className="mobil-bar" style={s.mobilBar}>
        <span style={s.mobilLogo}>🦷 DentApp</span>
        <button style={s.hamburger} onClick={() => setAcik(a => !a)} aria-label="Menü">
          {acik ? '✕' : '☰'}
        </button>
      </div>

      {/* Overlay — mobilde menü açıkken arkayı karart */}
      {acik && <div style={s.overlay} onClick={() => setAcik(false)} />}

      {/* SIDEBAR */}
      <aside className={`dash-sidebar${acik ? ' acik' : ''}`} style={s.sidebar}>
        <div style={s.logo}>🦷 DentApp</div>

        <nav style={s.nav}>
          {menuOgeleri.map(item => (
            <NavLink
              key={item.yol}
              to={item.yol}
              end={item.yol === '/dashboard'}
              style={({ isActive }) => ({ ...s.navLink, ...(isActive ? s.navLinkAktif : {}) })}
            >
              <span style={s.navIkon}>{item.ikon}</span>
              {item.etiket}
              {item.adminOnly && <span style={s.adminRozet}>Admin</span>}
            </NavLink>
          ))}
        </nav>

        <div style={s.altBolum}>
          <NavLink to="/dashboard/profil" style={({ isActive }) => ({ ...s.kullaniciLink, ...(isActive ? { background: 'rgba(255,255,255,0.12)' } : {}) })}>
            <div style={s.avatarKucuk}>
              {kullanici?.fullName?.split(' ').map(k => k[0]).join('').substring(0, 2).toUpperCase() || '?'}
            </div>
            <div>
              <span style={s.kullaniciAd}>{kullanici?.fullName}</span>
              <span style={s.kullaniciRol}>{kullanici?.role}</span>
            </div>
          </NavLink>
          <NavLink to="/dashboard/sifre-degistir" style={({ isActive }) => ({ ...s.sifreBtn, ...(isActive ? { background: 'rgba(255,255,255,0.2)' } : {}) })}>
            🔒 Şifremi Değiştir
          </NavLink>
          <button onClick={handleCikis} style={s.cikisBtn}>Çıkış Yap</button>
        </div>
      </aside>

      {/* İÇERİK */}
      <main className="dash-main" style={s.main}>
        <div className="dash-topbar" style={s.topBar}>
          <button style={s.aramaBtn} onClick={() => setAramaAcik(true)}>
            <span>🔍</span>
            <span className="topbar-arama-yazi" style={s.aramaBtnYazi}>Ara...</span>
            <kbd className="topbar-arama-kbd" style={s.aramaKbd}>Ctrl K</kbd>
          </button>
          <BildirimZili />
        </div>
        {aramaAcik && <GenelArama onKapat={() => setAramaAcik(false)} />}
        <Outlet />
      </main>
    </div>
  )
}

const s = {
  sayfa:        { display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif', background: '#F5FAF7' },
  mobilBar:     { display: 'none', position: 'fixed', top: 0, left: 0, right: 0, height: 56,
                  background: '#1F6B4C', color: '#fff', alignItems: 'center',
                  justifyContent: 'space-between', padding: '0 16px', zIndex: 200 },
  mobilLogo:    { fontSize: 18, fontWeight: 700 },
  hamburger:    { background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: 4 },
  overlay:      { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 150 },
  sidebar:      { width: 230, background: '#1F6B4C', color: '#fff', display: 'flex',
                  flexDirection: 'column', flexShrink: 0, position: 'relative', zIndex: 160 },
  logo:         { padding: '24px 20px', fontSize: 20, fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.1)' },
  nav:          { flex: 1, padding: '12px 0', overflowY: 'auto' },
  navLink:      { display: 'flex', alignItems: 'center', gap: 10, padding: '11px 20px',
                  color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 14 },
  navLinkAktif: { background: 'rgba(255,255,255,0.15)', color: '#fff', borderLeft: '3px solid #86C5A3' },
  navIkon:      { fontSize: 16, width: 20, textAlign: 'center' },
  adminRozet:   { marginLeft: 'auto', fontSize: 10, background: 'rgba(255,255,255,0.15)',
                  padding: '2px 6px', borderRadius: 10, color: 'rgba(255,255,255,0.6)' },
  altBolum:     { padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' },
  kullaniciLink: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                   borderRadius: 8, textDecoration: 'none', marginBottom: 10, cursor: 'pointer' },
  avatarKucuk:  { width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, flexShrink: 0, letterSpacing: 0.5 },
  kullaniciAd:  { display: 'block', fontSize: 13, fontWeight: 600, color: '#fff' },
  kullaniciRol: { display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  sifreBtn:     { display: 'block', width: '100%', padding: '8px 0', marginBottom: 8,
                  background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)',
                  borderRadius: 6, fontSize: 12, textAlign: 'center', textDecoration: 'none' },
  cikisBtn:     { width: '100%', padding: '8px 0', background: 'rgba(255,255,255,0.1)',
                  color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  main:         { flex: 1, overflow: 'auto', minWidth: 0 },
  topBar:       { position: 'sticky', top: 0, zIndex: 90, background: '#1F6B4C',
                  padding: '8px 24px', display: 'flex', justifyContent: 'flex-end',
                  alignItems: 'center', gap: 10, boxShadow: '0 2px 6px rgba(0,0,0,0.12)' },
  aramaBtn:     { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px',
                  background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
                  borderRadius: 8, cursor: 'pointer', color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  aramaBtnYazi: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  aramaKbd:     { fontSize: 11, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
                  borderRadius: 5, padding: '1px 7px', color: 'rgba(255,255,255,0.6)', fontFamily: 'inherit' },
}
