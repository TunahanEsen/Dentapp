import { useParams, Link, useNavigate } from 'react-router-dom'
import { MAKALELER } from '../../data/makaleler'
import { useSiteAyarlari } from '../../hooks/useSiteAyarlari'

const KATEGORİ_RENK = {
  'Tedavi':        { bg: '#E8F5EE', color: '#1F6B4C' },
  'Estetik':       { bg: '#FCE7F3', color: '#DB2777' },
  'Ortodonti':     { bg: '#FEF3C7', color: '#D97706' },
  'Genel Sağlık':  { bg: '#CFFAFE', color: '#0891B2' },
  'Diş Eti':       { bg: '#EDE9FE', color: '#7C3AED' },
  'Çocuk Sağlığı': { bg: '#D1FAE5', color: '#059669' },
}

function IcerikBlok({ blok }) {
  if (blok.tip === 'paragraf') {
    return <p style={s.paragraf}>{blok.metin}</p>
  }
  if (blok.tip === 'baslik') {
    return <h2 style={s.altBaslik}>{blok.metin}</h2>
  }
  if (blok.tip === 'liste') {
    return (
      <ul style={s.liste}>
        {blok.maddeler.map((m, i) => (
          <li key={i} style={s.listeMadde}>{m}</li>
        ))}
      </ul>
    )
  }
  return null
}

export default function MakalePage() {
  const { id }         = useParams()
  const navigate       = useNavigate()
  const { ayarlar }    = useSiteAyarlari()

  // API'dan gelen makale (plain text icerik) veya local (blok yapısı)
  const apiMakale   = ayarlar?.makaleler?.find(m => String(m.id) === id)
  const lokalMakale = MAKALELER.find(m => String(m.id) === id)
  const makale      = apiMakale || lokalMakale

  if (!makale) {
    return (
      <div style={s.bulunamadi}>
        <div style={s.bulunamadiIc}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📄</div>
          <h1 style={{ color: '#1F6B4C', marginBottom: 8 }}>Makale Bulunamadı</h1>
          <p style={{ color: '#5A7A6A', marginBottom: 24 }}>Aradığınız makale mevcut değil ya da kaldırılmış olabilir.</p>
          <Link to="/" style={s.geriBtn}>← Ana Sayfaya Dön</Link>
        </div>
      </div>
    )
  }

  const kategoriRenk = KATEGORİ_RENK[makale.kategori] || { bg: '#E8F5EE', color: '#1F6B4C' }

  const tumMakaleler    = ayarlar?.makaleler || MAKALELER
  const ilgiliMakaleler = tumMakaleler
    .filter(m => String(m.id) !== id && m.kategori === makale.kategori)
    .slice(0, 3)
  const digerMakaleler  = ilgiliMakaleler.length > 0
    ? ilgiliMakaleler
    : tumMakaleler.filter(m => String(m.id) !== id).slice(0, 3)

  return (
    <div style={s.sayfa}>
      {/* HEADER */}
      <header style={s.header}>
        <div style={s.headerIc}>
          <Link to="/" style={s.logoLink}>
            <span style={{ fontSize: 22 }}>🦷</span>
            <span style={s.logoYazi}>DentApp Diş Kliniği</span>
          </Link>
          <nav style={s.headerNav}>
            <Link to="/#hizmetler" style={s.navLink}>Hizmetler</Link>
            <Link to="/#makaleler" style={s.navLink}>Makaleler</Link>
            <Link to="/#randevu"   style={s.randevuBtn}>Randevu Al</Link>
          </nav>
        </div>
      </header>

      {/* İÇERİK */}
      <main style={s.main}>
        <div style={s.mainIc}>

          {/* Breadcrumb */}
          <nav style={s.breadcrumb}>
            <Link to="/" style={s.breadcrumbLink}>Ana Sayfa</Link>
            <span style={s.breadcrumbAyrac}>/</span>
            <Link to="/#makaleler" style={s.breadcrumbLink}>Makaleler</Link>
            <span style={s.breadcrumbAyrac}>/</span>
            <span style={s.breadcrumbAktif}>{makale.kategori}</span>
          </nav>

          <div style={s.icerikGrid}>
            {/* ANA MAKALE */}
            <article style={s.makaleKart}>
              {/* Kategori + Süre */}
              <div style={s.metaBant}>
                <span style={{ ...s.kategoriBadge, background: kategoriRenk.bg, color: kategoriRenk.color }}>
                  {makale.kategori}
                </span>
                <span style={s.sureBadge}>⏱ {makale.sure} okuma</span>
                <span style={s.tarihBadge}>📅 {makale.tarih}</span>
              </div>

              {/* Başlık */}
              <h1 style={s.baslik}>{makale.baslik}</h1>

              {/* Yazar */}
              <div style={s.yazarSatir}>
                <div style={s.yazarAvatar}>
                  {makale.yazar.replace('Dr. ', '').split(' ').map(k => k[0]).join('').substring(0, 2)}
                </div>
                <div>
                  <div style={s.yazarAd}>{makale.yazar}</div>
                  <div style={s.yazarUnvan}>Diş Hekimi</div>
                </div>
              </div>

              <div style={s.ayrac} />

              {/* Özet kutu */}
              <div style={s.ozetKutu}>
                <strong style={{ display: 'block', marginBottom: 6, color: '#1F6B4C' }}>Özet</strong>
                {makale.ozet}
              </div>

              {/* İçerik */}
              <div style={s.icerik}>
                {typeof makale.icerik === 'string'
                  ? makale.icerik.split('\n\n').map((paragraf, i) => (
                      <p key={i} style={s.paragraf}>{paragraf}</p>
                    ))
                  : Array.isArray(makale.icerik)
                    ? makale.icerik.map((blok, i) => <IcerikBlok key={i} blok={blok} />)
                    : null
                }
              </div>

              <div style={s.ayrac} />

              {/* Geri dön */}
              <button onClick={() => navigate(-1)} style={s.geriLink}>
                ← Geri Dön
              </button>
            </article>

            {/* YAN PANEL */}
            <aside style={s.yanPanel}>
              {/* CTA */}
              <div style={s.ctaKutu}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🦷</div>
                <h3 style={s.ctaBaslik}>Uzman Görüşü Alın</h3>
                <p style={s.ctaAciklama}>İlk muayene ve diş röntgeni ücretsiz. Hemen randevu alın.</p>
                <a href="/#randevu" style={s.ctaBtn}>Randevu Al →</a>
              </div>

              {/* İlgili Makaleler */}
              {digerMakaleler.length > 0 && (
                <div style={s.ilgiliKutu}>
                  <h3 style={s.ilgiliBaslik}>
                    {ilgiliMakaleler.length > 0 ? 'Aynı Kategoride' : 'Diğer Makaleler'}
                  </h3>
                  {digerMakaleler.map(m => {
                    const kr = KATEGORİ_RENK[m.kategori] || { bg: '#E8F5EE', color: '#1F6B4C' }
                    return (
                      <Link key={m.id} to={`/makale/${m.id}`} style={s.ilgiliLink}>
                        <span style={{ ...s.ilgiliKategori, background: kr.bg, color: kr.color }}>
                          {m.kategori}
                        </span>
                        <span style={s.ilgiliBaslikYazi}>{m.baslik}</span>
                        <span style={s.ilgiliSure}>⏱ {m.sure}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </aside>
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer style={s.footer}>
        <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
          © {new Date().getFullYear()} DentApp Diş Kliniği. Tüm hakları saklıdır.
        </p>
      </footer>
    </div>
  )
}

const s = {
  sayfa:   { minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Segoe UI', sans-serif", background: '#F5FAF7', color: '#1A3329' },

  header:  { background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', position: 'sticky', top: 0, zIndex: 100 },
  headerIc:{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 },
  logoLink:{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' },
  logoYazi:{ fontWeight: 800, fontSize: 17, color: '#1F6B4C' },
  headerNav:{ display: 'flex', alignItems: 'center', gap: 24 },
  navLink: { textDecoration: 'none', color: '#1A3329', fontWeight: 500, fontSize: 14 },
  randevuBtn:{ background: '#1F6B4C', color: '#fff', padding: '9px 20px', borderRadius: 22, textDecoration: 'none', fontWeight: 600, fontSize: 14 },

  main:    { flex: 1, padding: '32px 24px 56px' },
  mainIc:  { maxWidth: 1100, margin: '0 auto' },

  breadcrumb:      { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 13 },
  breadcrumbLink:  { color: '#1F6B4C', textDecoration: 'none', fontWeight: 500 },
  breadcrumbAyrac: { color: '#aaa' },
  breadcrumbAktif: { color: '#888' },

  icerikGrid: { display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'flex-start' },

  makaleKart: { background: '#fff', borderRadius: 16, padding: '36px 40px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' },

  metaBant:       { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 20 },
  kategoriBadge:  { padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700 },
  sureBadge:      { fontSize: 12, color: '#888' },
  tarihBadge:     { fontSize: 12, color: '#aaa', marginLeft: 'auto' },

  baslik:  { margin: '0 0 20px', fontSize: 28, fontWeight: 800, color: '#1A3329', lineHeight: 1.35 },

  yazarSatir: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 },
  yazarAvatar:{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#1F6B4C,#2D8A62)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 },
  yazarAd:    { fontSize: 14, fontWeight: 700, color: '#1A3329' },
  yazarUnvan: { fontSize: 12, color: '#888', marginTop: 2 },

  ayrac: { height: 1, background: '#f0f0f0', margin: '24px 0' },

  ozetKutu: { background: '#E8F5EE', border: '1px solid #B2D9C5', borderRadius: 10, padding: '16px 20px', fontSize: 14, color: '#5A7A6A', lineHeight: 1.8, marginBottom: 28 },

  icerik:  {},
  paragraf:{ margin: '0 0 20px', fontSize: 15, color: '#333', lineHeight: 1.85 },
  altBaslik:{ margin: '28px 0 14px', fontSize: 19, fontWeight: 700, color: '#1F6B4C' },
  liste:   { margin: '0 0 20px', paddingLeft: 0, listStyle: 'none' },
  listeMadde:{ padding: '8px 14px', marginBottom: 8, background: '#F5FAF7', borderRadius: 8, fontSize: 14, color: '#333', lineHeight: 1.7, borderLeft: '3px solid #1F6B4C' },

  geriLink: { background: 'none', border: 'none', color: '#1F6B4C', fontWeight: 600, fontSize: 14, cursor: 'pointer', padding: 0 },

  // Yan Panel
  yanPanel: { display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 84 },

  ctaKutu:     { background: 'linear-gradient(135deg,#1F6B4C,#164F39)', borderRadius: 16, padding: '28px 24px', color: '#fff', textAlign: 'center' },
  ctaBaslik:   { margin: '0 0 10px', fontSize: 18, fontWeight: 700 },
  ctaAciklama: { margin: '0 0 20px', fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 },
  ctaBtn:      { display: 'block', background: '#fff', color: '#1F6B4C', padding: '12px', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none' },

  ilgiliKutu:  { background: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  ilgiliBaslik:{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#1A3329' },
  ilgiliLink:  { display: 'flex', flexDirection: 'column', gap: 4, padding: '12px 0', borderBottom: '1px solid #f0f0f0', textDecoration: 'none', cursor: 'pointer' },
  ilgiliKategori:{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, display: 'inline-block', width: 'fit-content' },
  ilgiliBaslikYazi:{ fontSize: 13, fontWeight: 600, color: '#1A3329', lineHeight: 1.4 },
  ilgiliSure:  { fontSize: 11, color: '#aaa' },

  // Bulunamadı
  bulunamadi:  { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5FAF7', fontFamily: 'sans-serif' },
  bulunamadiIc:{ textAlign: 'center', padding: 40 },
  geriBtn:     { display: 'inline-block', background: '#1F6B4C', color: '#fff', padding: '12px 24px', borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: 14 },

  footer: { background: '#164F39', padding: '20px 24px', textAlign: 'center' },
}
