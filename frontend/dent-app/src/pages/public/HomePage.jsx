import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import _LottieLib from 'lottie-react'
const Lottie = _LottieLib.default ?? _LottieLib
import { MAKALELER } from '../../data/makaleler'
import { useSiteAyarlari } from '../../hooks/useSiteAyarlari'
import { API_BASE } from '../../utils/apiBase'

const RENK = {
  primary:      '#1F6B4C',
  primaryDark:  '#164F39',
  primaryMid:   '#2D8A62',
  primaryLight: '#E8F5EE',
  primaryBorder:'#B2D9C5',
  white:        '#FFFFFF',
  bg:           '#F5FAF7',
  text:         '#1A3329',
  textLight:    '#5A7A6A',
}

const WA_NUMARA = '905405901030'
const KLİNİK_ADRESİ = 'Denizköşkler, Reşit Paşa Cd. No:23 D:B, 34315 Avcılar/İstanbul'
const HARİTA_URL = `https://maps.google.com/maps?q=${encodeURIComponent(KLİNİK_ADRESİ)}&output=embed&hl=tr`

const HIZMETLERİ = [
  { baslik: 'Muayene',               aciklama: 'İlk muayeneniz tamamen ücretsiz! Uzman hekimlerimizle tanışın.',  ucretsiz: true,  renk: '#1F6B4C', renkAcik: '#E8F5EE', animPath: '/animations/muayene.json'  },
  { baslik: 'Diş Röntgeni',          aciklama: 'Dijital röntgen hizmetimiz ücretsiz sunulmaktadır.',             ucretsiz: true,  renk: '#2563EB', renkAcik: '#DBEAFE', animPath: '/animations/rontgen.json'   },
  { baslik: 'İmplant Tedavisi',       aciklama: 'Eksik dişleriniz için kalıcı ve doğal görünümlü çözümler.',     ucretsiz: false, renk: '#7C3AED', renkAcik: '#EDE9FE', animPath: '/animations/implant.json'   },
  { baslik: 'Estetik Diş Hekimliği', aciklama: 'Gülen tasarımı, beyazlatma ve porselen kaplama uygulamaları.',  ucretsiz: false, renk: '#DB2777', renkAcik: '#FCE7F3', animPath: '/animations/estetik.json'   },
  { baslik: 'Kanal Tedavisi',         aciklama: 'İleri teknoloji ile ağrısız kanal tedavisi.',                   ucretsiz: false, renk: '#0891B2', renkAcik: '#CFFAFE', animPath: '/animations/kanal.json'     },
  { baslik: 'Ortodonti',              aciklama: 'Şeffaf plak ve tel tedavileriyle mükemmel kapanış.',            ucretsiz: false, renk: '#D97706', renkAcik: '#FEF3C7', animPath: '/animations/ortodonti.json' },
  { baslik: 'Diş Eti Tedavisi',       aciklama: 'Periodontoloji uzmanı eşliğinde diş eti sağlığı.',              ucretsiz: false, renk: '#4F46E5', renkAcik: '#E0E7FF', animPath: '/animations/diseti.json'    },
  { baslik: 'Çocuk Diş Hekimliği',   aciklama: 'Çocuklar için özel tasarlanmış tedavi ortamı.',                 ucretsiz: false, renk: '#059669', renkAcik: '#D1FAE5', animPath: '/animations/cocuk.json'     },
]

const DOKTORLAR = [
  {
    ad: 'Dr. Ayşe Yılmaz', unvan: 'Diş Hekimi', uzmanlik: 'Ortodonti & Şeffaf Plak',
    deneyim: '12 Yıl', bas: 'AY', renk: '#1F6B4C',
    aciklama: 'İstanbul Üniversitesi Diş Hekimliği Fakültesi mezunu. Ortodonti alanında uzmanlaşan Dr. Yılmaz, şeffaf plak ve sabit ortodontik tedavilerde deneyimlidir.',
  },
  {
    ad: 'Dr. Mehmet Kaya', unvan: 'Diş Hekimi', uzmanlik: 'İmplant & Oral Cerrahi',
    deneyim: '15 Yıl', bas: 'MK', renk: '#1b5e20',
    aciklama: 'Marmara Üniversitesi mezunu. İmplant cerrahisi ve oral cerrahi konularında 15 yılı aşkın deneyime sahip. 500\'den fazla başarılı implant vakası.',
  },
  {
    ad: 'Dr. Selin Arslan', unvan: 'Diş Hekimi', uzmanlik: 'Estetik Diş Hekimliği',
    deneyim: '9 Yıl', bas: 'SA', renk: '#b71c1c',
    aciklama: 'Gülüş tasarımı, diş beyazlatma, zirkon kaplama ve laminate veneer uygulamalarında uzman. Avrupa\'da estetik diş hekimliği eğitimi almıştır.',
  },
]

const YORUMLAR = [
  { ad: 'Mehmet A.', yildiz: 5, renk: '#1b5e20', tedavi: 'İmplant Tedavisi',      yorum: 'İmplant tedavim için Dr. Mehmet Kaya\'ya gittim. Hiç ağrı hissetmedim, işlem çok hızlı tamamlandı. Kesinlikle tavsiye ederim!' },
  { ad: 'Zeynep K.', yildiz: 5, renk: '#1F6B4C', tedavi: 'Ortodonti',             yorum: 'Şeffaf plak tedavim için Dr. Ayşe Yılmaz\'ı tercih ettim. Çok ilgili ve açıklayıcı bir hekim. 8 ayda harika sonuçlar aldım.' },
  { ad: 'Ali R.',    yildiz: 5, renk: '#b71c1c', tedavi: 'Zirkon Kaplama',        yorum: 'Kliniğin temizliği ve düzeni mükemmel. Randevulara zamanında giriliyor, bekleme yok. Selin Hanım çok profesyonel.' },
  { ad: 'Fatma Ş.', yildiz: 5, renk: '#059669', tedavi: 'Çocuk Diş Hekimliği',  yorum: 'Çocuğumun dişleri için çok endişeleniyordum. Hem çocuğa hem bana çok güven verdi klinik. Artık çocuğum dişçiden korkmaya çıktı!' },
  { ad: 'Bora T.',   yildiz: 5, renk: '#0891B2', tedavi: 'Kanal Tedavisi',        yorum: 'Kanal tedavisini burada yaptırdım. Önceden çok korkuluydum ama hiç ağrı olmadı. Dr. Mehmet Bey\'e çok teşekkür ederim.' },
  { ad: 'Gül M.',    yildiz: 5, renk: '#DB2777', tedavi: 'Diş Beyazlatma',        yorum: 'Diş beyazlatma yaptırdım, sonuçlar gerçekten çok güzel. Fiyat-performans açısından da memnun kaldım. Herkese öneririm.' },
]

const SSS_LİSTESİ = [
  { soru: 'İlk muayene gerçekten ücretsiz mi?',        cevap: 'Evet, kliniğimizde ilk muayene ve diş röntgeni tamamen ücretsizdir. Sizi tanımak ve diş sağlığınızı değerlendirmek için bu hizmeti sunuyoruz.' },
  { soru: 'Randevu almak için ne yapmalıyım?',          cevap: 'WhatsApp hattımızdan, telefonla veya bu sayfadaki randevu formunu doldurarak bize ulaşabilirsiniz. En kısa sürede size uygun bir saat ayarlıyoruz.' },
  { soru: 'Kanal tedavisi ağrılı mıdır?',               cevap: 'Modern anestezi yöntemleri sayesinde kanal tedavisi artık neredeyse ağrısızdır. İşlem süresince herhangi bir ağrı hissetmemeniz için gerekli önlemler alınır.' },
  { soru: 'İmplant tedavisi ne kadar sürer?',           cevap: 'İmplant süreci genellikle 3-6 ay alır. İlk seansta vida yerleştirilir, kemiğe kaynadıktan sonra üst yapı (kuron) takılır. Süreç kişiden kişiye değişebilir.' },
  { soru: 'Çocuklar kaç yaşından itibaren getirilmeli?',cevap: 'İlk diş muayenesi için genellikle 1 yaş veya ilk dişin çıkmasıyla birlikte önerilir. Erken kontroller, ileride oluşabilecek sorunları önler.' },
  { soru: 'Sigorta ile tedavi yaptırabilir miyim?',     cevap: 'Evet, Sencard anlaşmalı kurumlardan biriyiz. Tedavilerinizin kapsamı için sigorta poliçenizi ve detayları kliniğimizle paylaşabilirsiniz.' },
  { soru: 'Diş beyazlatma kalıcı mıdır?',              cevap: 'Profesyonel diş beyazlatma etkisi ortalama 1-3 yıl sürer. Kahve, çay ve sigara gibi boyayıcı maddeleri azaltarak ve düzenli bakımla bu süre uzatılabilir.' },
  { soru: 'Acil durumlarda randevu alabilir miyim?',    cevap: 'Acil durumlar için aynı gün muayene imkânı sunmaya çalışıyoruz. WhatsApp hattımızdan "Acil" yazarak bize ulaşabilirsiniz.' },
]


// ─── KVKK MODAL ──────────────────────────────────────────────────────────────
function KVKKModal({ kapat }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 640, width: '100%', maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}>
        <button onClick={kapat} style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888', lineHeight: 1 }}>✕</button>
        <h2 style={{ marginTop: 0, color: RENK.primary, fontSize: 20 }}>KVKK Aydınlatma Metni</h2>
        <p style={{ fontSize: 13, lineHeight: 1.9, color: '#444' }}>
          <strong>Veri Sorumlusu:</strong> DentApp Diş Kliniği<br /><br />
          6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında, kliniğimize ilettiğiniz kişisel verileriniz (ad-soyad, telefon, e-posta) yalnızca randevu süreçlerinin yönetilmesi amacıyla işlenmektedir.<br /><br />
          <strong>İşleme Amaçları:</strong><br />
          • Randevu talebinizin alınması ve karşılanması<br />
          • Bilgilendirme ve hatırlatma amacıyla iletişime geçilmesi<br />
          • Yasal yükümlülüklerin yerine getirilmesi<br /><br />
          <strong>Aktarım:</strong> Kişisel verileriniz, açık rızanız olmaksızın üçüncü taraflarla ticari amaçla paylaşılmaz. Randevu takibi amacıyla yalnızca klinik çalışanları tarafından görüntülenebilir.<br /><br />
          <strong>Saklama Süresi:</strong> Verileriniz, ilgili mevzuatta öngörülen süreler boyunca saklanmakta; süre dolduğunda ya da talebiniz üzerine silinmektedir.<br /><br />
          <strong>KVKK Md. 11 Kapsamındaki Haklarınız:</strong><br />
          • Kişisel verilerinizin işlenip işlenmediğini öğrenme<br />
          • Verilere erişim ve düzeltme talep etme<br />
          • Silinmesini veya yok edilmesini isteme<br />
          • İşlemeye itiraz etme<br /><br />
          Bu haklarınızı kullanmak için kliniğimizle telefon veya WhatsApp aracılığıyla iletişime geçebilirsiniz.
        </p>
        <button onClick={kapat} style={{ background: RENK.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
          Anladım, Kapat
        </button>
      </div>
    </div>
  )
}

// ─── ÇEREZ BANNER ────────────────────────────────────────────────────────────
function CerezBanner() {
  const [gizli, setGizli] = useState(true)
  useEffect(() => { if (!localStorage.getItem('dentapp_cerez')) setGizli(false) }, [])
  const kabul  = () => { localStorage.setItem('dentapp_cerez', '1'); setGizli(true) }
  const reddet = () => { localStorage.setItem('dentapp_cerez', '0'); setGizli(true) }
  if (gizli) return null
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#1A3329', color: '#fff', zIndex: 997, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', boxShadow: '0 -4px 24px rgba(0,0,0,0.25)' }}>
      <p style={{ margin: 0, fontSize: 13, flex: 1, lineHeight: 1.6, minWidth: 200 }}>
        🍪 Web sitemiz daha iyi hizmet sunabilmek için zorunlu çerezler kullanmaktadır.
        Siteyi kullanmaya devam ederek <span style={{ color: '#86C5A3', fontWeight: 600 }}>Çerez Politikamızı</span> ve <span style={{ color: '#86C5A3', fontWeight: 600 }}>KVKK Aydınlatma Metnimizi</span> kabul etmiş sayılırsınız.
      </p>
      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
        <button onClick={kabul}  style={{ background: RENK.primary, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Kabul Et</button>
        <button onClick={reddet} style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, padding: '8px 16px', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Reddet</button>
      </div>
    </div>
  )
}

// ─── SSS ITEM ─────────────────────────────────────────────────────────────────
function SSSItem({ soru, cevap }) {
  const [acik, setAcik] = useState(false)
  return (
    <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: `1px solid ${acik ? RENK.primaryBorder : '#e8e8e8'}`, transition: 'border-color .2s' }}>
      <button
        onClick={() => setAcik(a => !a)}
        style={{ width: '100%', padding: '18px 22px', background: 'none', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left', gap: 16 }}
      >
        <span style={{ fontWeight: 600, fontSize: 15, color: RENK.text, lineHeight: 1.4 }}>{soru}</span>
        <span style={{ fontSize: 22, color: RENK.primary, flexShrink: 0, lineHeight: 1, display: 'inline-block', transform: acik ? 'rotate(45deg)' : 'none', transition: 'transform .25s' }}>+</span>
      </button>
      {acik && (
        <div style={{ padding: '14px 22px 18px', color: RENK.textLight, fontSize: 14, lineHeight: 1.8, borderTop: `1px solid ${RENK.primaryBorder}` }}>
          {cevap}
        </div>
      )}
    </div>
  )
}

// ─── LOTTİE ANİMASYON KUTUSU ──────────────────────────────────────────────────
function HizmetAnimasyon({ animPath, renk, renkAcik }) {
  const [hata, setHata] = useState(false)
  const [gorunurde, setGorunurde] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setGorunurde(true); observer.disconnect() } }, { threshold: 0.1 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={ref} style={{ position: 'relative', width: 100, height: 100, marginBottom: 20, flexShrink: 0 }}>
      {(!gorunurde || hata) && (
        <div style={{ position: 'absolute', inset: 0, borderRadius: 20, background: renkAcik, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'hizmetPulse 2.5s ease-in-out infinite' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: renk, opacity: 0.85 }} />
        </div>
      )}
      {gorunurde && !hata && (
        <Lottie path={animPath} loop autoplay style={{ position: 'absolute', inset: 0, borderRadius: 20, overflow: 'hidden', background: renkAcik }} onDataFailed={() => setHata(true)} />
      )}
    </div>
  )
}

// ─── ANA SAYFA ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { ayarlar } = useSiteAyarlari()

  // API verisi varsa kullan, yoksa hardcoded sabitlerle devam et
  const guncelHizmetler = ayarlar?.hizmetler?.length ? ayarlar.hizmetler : HIZMETLERİ
  const guncelDoktorlar = ayarlar?.doktorlar?.length ? ayarlar.doktorlar : DOKTORLAR
  const guncelMakaleler = ayarlar?.makaleler?.length ? ayarlar.makaleler : MAKALELER
  const iletisim        = ayarlar?.iletisim

  const waNumara    = iletisim?.waNumara    || WA_NUMARA
  const klinikAdres = iletisim?.adres       || KLİNİK_ADRESİ
  const telefon     = iletisim?.telefon     || '+90 540 590 10 30'
  const pztCmtSaat  = iletisim?.calismaSaatleri?.pztCmt
    ? `${iletisim.calismaSaatleri.pztCmt.baslangic} – ${iletisim.calismaSaatleri.pztCmt.bitis}`
    : '09:00 – 21:00'
  const pazarSaat   = iletisim?.calismaSaatleri?.pazar
    ? `${iletisim.calismaSaatleri.pazar.baslangic} – ${iletisim.calismaSaatleri.pazar.bitis}`
    : '11:00 – 21:00'

  const [formVeri, setFormVeri]   = useState({ ad: '', tel: '', tarih: '' })
  const [kvkkOnay, setKvkkOnay]   = useState(false)
  const [kvkkModal, setKvkkModal] = useState(false)
  const [formHata, setFormHata]   = useState('')
  const [hizmetHover, setHizmetHover] = useState(null)
  const [doktorHover, setDoktorHover] = useState(null)
  const [haritaAcik, setHaritaAcik]   = useState(false)
  const [menuAcik, setMenuAcik]       = useState(false)

  useEffect(() => {
    const kapatScroll = () => setMenuAcik(false)
    const kapatEsc    = (e) => { if (e.key === 'Escape') setMenuAcik(false) }
    window.addEventListener('scroll',  kapatScroll, { passive: true })
    window.addEventListener('keydown', kapatEsc)
    return () => {
      window.removeEventListener('scroll',  kapatScroll)
      window.removeEventListener('keydown', kapatEsc)
    }
  }, [])

  async function formGonder(e) {
    e.preventDefault()
    if (!kvkkOnay) { setFormHata('Lütfen KVKK Aydınlatma Metnini onaylayınız.'); return }
    setFormHata('')

    // Randevu talebini admin paneline kaydet (hata olsa bile WhatsApp açılır)
    try {
      await fetch(`${API_BASE}/api/randevu-talepleri`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adSoyad:     formVeri.ad,
          telefon:     formVeri.tel,
          tercihTarih: formVeri.tarih || null,
        }),
      })
    } catch (_) {
      // API'ye ulaşılamasa bile WhatsApp açılmaya devam eder
    }

    const mesaj = [
      'Merhaba DentApp Diş Kliniği! 🦷',
      '',
      'Randevu talebi iletmek istiyorum:',
      '',
      `👤 Ad Soyad: ${formVeri.ad}`,
      `📞 Telefon: ${formVeri.tel}`,
      `📅 Tercih Edilen Tarih: ${formVeri.tarih || 'Belirtilmedi'}`,
      '',
      'KVKK Aydınlatma Metnini okudum ve onaylıyorum.',
    ].join('\n')
    window.open(`https://wa.me/${waNumara}?text=${encodeURIComponent(mesaj)}`, '_blank')
  }

  const waUrl = `https://wa.me/${waNumara}?text=${encodeURIComponent('Merhaba DentApp Diş Kliniği, bilgi almak istiyorum.')}`

  return (
    <main style={{ fontFamily: "'Segoe UI', sans-serif", color: RENK.text }}>
      <style>{`
        @keyframes hizmetPulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
        @keyframes waPulse { 0%,100%{box-shadow:0 4px 20px rgba(37,211,102,0.5)} 50%{box-shadow:0 4px 36px rgba(37,211,102,0.9)} }
      `}</style>

      {/* BANNER */}
      <div style={s.ucretsizBanner}>
        🎁 <strong>İlk Muayene ve Diş Röntgeni Ücretsiz!</strong> — Hemen randevu alın, kliniğimizle tanışın.
        <a href="#randevu" style={s.bannerBtn}>Randevu Al →</a>
      </div>

      {/* HEADER */}
      <header style={s.header}>
        <div style={s.headerIc}>
          <div style={s.logo}>
            <span style={s.logoIkon}>🦷</span>
            <span style={s.logoYazi}>DentApp Diş Kliniği</span>
          </div>
          <nav className="home-nav" style={s.headerNav}>
            <a href="#hizmetler" style={s.navLink}>Hizmetler</a>
            <a href="#doktorlar" style={s.navLink}>Doktorlar</a>
            <a href="#makaleler" style={s.navLink}>Makaleler</a>
            <a href="#hakkimizda" style={s.navLink}>Hakkımızda</a>
            <a href="#randevu"   style={s.navLink}>İletişim</a>
          </nav>
          <a href="#randevu" className="home-randevu-btn" style={s.randevuBtn}>Randevu Al</a>
          <button
            className="home-hamburger"
            style={s.hamburger}
            onClick={() => setMenuAcik(a => !a)}
            aria-label={menuAcik ? 'Menüyü Kapat' : 'Menüyü Aç'}
          >
            {menuAcik ? '✕' : '☰'}
          </button>
        </div>

        {menuAcik && (
          <nav className="home-mobil-nav" style={s.mobilMenu}>
            {[
              ['#hizmetler', '🦷 Hizmetler'],
              ['#doktorlar', '👨‍⚕️ Doktorlar'],
              ['#makaleler', '📖 Makaleler'],
              ['#hakkimizda', 'ℹ️ Hakkımızda'],
              ['#randevu',   '📞 İletişim'],
            ].map(([href, yazi]) => (
              <a key={href} href={href} style={s.mobilNavLink} onClick={() => setMenuAcik(false)}>
                {yazi}
              </a>
            ))}
            <a href="#randevu" style={s.mobilRandevuBtn} onClick={() => setMenuAcik(false)}>
              📱 Randevu Al
            </a>
          </nav>
        )}
      </header>

      {/* HERO */}
      <section className="hero" style={s.hero}>
        <div className="hero-ic" style={s.heroIc}>
          <div>
            <div style={s.heroBadge}>✦ Uzman Diş Hekimliği</div>
            <h1 style={s.heroBaslik}>Sağlıklı Gülüşler,<br /><span style={{ color: '#86C5A3' }}>Parlak Gelecekler</span></h1>
            <p style={s.heroParagraf}>En son teknoloji ve uzman kadromuzla ağız-diş sağlığınızı korumak için buradayız. Her yaşa, her ihtiyaca uygun tedavi seçenekleri sunuyoruz.</p>
            <div style={{ display: 'inline-flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
              {[['Pzt – Cmt', '09:00 – 21:00'], ['Pazar', '11:00 – 21:00']].map(([gun, saat]) => (
                <div key={gun} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, padding: '8px 16px', color: '#fff', fontSize: 13, fontWeight: 500 }}>
                  <span>🕐</span><span>{gun} &nbsp;|&nbsp; <strong>{saat}</strong></span>
                </div>
              ))}
            </div>
            <div style={s.heroBtnlar}>
              <a href="#randevu"    style={s.heroPrimaryBtn}>Randevu Al</a>
              <a href="#hizmetler" style={s.heroSecondaryBtn}>Hizmetlerimiz</a>
            </div>
          </div>
          <div style={s.heroSag}>
            <div style={s.heroKart}>
              {[['15+','Yıl Deneyim'],['8.000+','Mutlu Hasta'],['12','Uzman Hekim']].map(([sayi, yazi], i) => (
                <div key={i} style={{ display: 'contents' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={s.heroStatSayi}>{sayi}</span>
                    <span style={s.heroStatYazi}>{yazi}</span>
                  </div>
                  {i < 2 && <div style={s.heroAyrac} />}
                </div>
              ))}
            </div>
            <div style={s.heroPuanKart}>
              <span style={{ fontSize: 28 }}>🦷</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: RENK.text }}>Google Değerlendirmeleri</div>
                <div style={{ color: '#f59e0b', fontSize: 18 }}>★★★★★</div>
                <div style={{ fontSize: 12, color: RENK.textLight }}>5.0 · 200+ yorum</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HİZMETLER */}
      <section id="hizmetler" style={s.bolum}>
        <div style={s.bolumIc}>
          <div style={s.bolumBaslikAlani}>
            <div style={s.etiket}>Hizmetlerimiz</div>
            <h2 style={s.bolumBaslik}>Kapsamlı Diş Sağlığı Çözümleri</h2>
            <p style={s.bolumAlt}>Uzman hekim kadromuz ile her diş sağlığı ihtiyacınıza yanıt veriyoruz.</p>
          </div>
          <div style={s.hizmetGrid}>
            {guncelHizmetler.map((h, i) => (
              <div key={i}
                style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', border: '1px solid #e8e8e8', borderTop: `4px solid ${h.renk}`, transition: 'all .25s', cursor: 'default', position: 'relative', overflow: 'hidden', boxShadow: hizmetHover === i ? `0 16px 48px ${h.renk}30` : '0 2px 8px rgba(0,0,0,0.05)', transform: hizmetHover === i ? 'translateY(-7px)' : 'none' }}
                onMouseEnter={() => setHizmetHover(i)} onMouseLeave={() => setHizmetHover(null)}
              >
                <div style={{ position: 'absolute', right: 12, bottom: 4, fontSize: 88, fontWeight: 900, color: h.renk, opacity: 0.07, lineHeight: 1, userSelect: 'none', pointerEvents: 'none' }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <HizmetAnimasyon animPath={h.animPath} renk={h.renk} renkAcik={h.renkAcik} />
                {h.ucretsiz && <span style={{ position: 'absolute', top: 16, right: 16, background: '#1F6B4C', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, letterSpacing: '0.06em' }}>ÜCRETSİZ</span>}
                <h3 style={{ margin: '0 0 10px', fontSize: 17, fontWeight: 700, color: hizmetHover === i ? h.renk : RENK.text, transition: 'color .2s' }}>{h.baslik}</h3>
                <p style={{ margin: 0, color: RENK.textLight, lineHeight: 1.7, fontSize: 14 }}>{h.aciklama}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DOKTORLAR */}
      <section id="doktorlar" style={{ ...s.bolum, background: RENK.primaryLight }}>
        <div style={s.bolumIc}>
          <div style={s.bolumBaslikAlani}>
            <div style={s.etiket}>Hekimlerimiz</div>
            <h2 style={s.bolumBaslik}>Uzman Kadromuzla Tanışın</h2>
            <p style={s.bolumAlt}>Deneyimli ve alanında uzman hekimlerimiz sağlığınız için burada.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {guncelDoktorlar.map((d, i) => (
              <div key={i}
                style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', border: `1px solid ${doktorHover === i ? RENK.primaryBorder : '#e8e8e8'}`, boxShadow: doktorHover === i ? `0 12px 40px ${d.renk}22` : '0 2px 8px rgba(0,0,0,0.05)', transform: doktorHover === i ? 'translateY(-6px)' : 'none', transition: 'all .25s' }}
                onMouseEnter={() => setDoktorHover(i)} onMouseLeave={() => setDoktorHover(null)}
              >
                <div style={{ background: `linear-gradient(135deg, ${d.renk}22, ${d.renk}44)`, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: `3px solid ${d.renk}` }}>
                  <div style={{ width: 96, height: 96, borderRadius: '50%', background: d.renk, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 800, letterSpacing: 1, boxShadow: `0 4px 16px ${d.renk}55` }}>
                    {d.bas}
                  </div>
                </div>
                <div style={{ padding: '22px 24px' }}>
                  <div style={{ display: 'inline-block', background: `${d.renk}18`, color: d.renk, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, marginBottom: 10, letterSpacing: 0.5 }}>
                    {d.uzmanlik}
                  </div>
                  <h3 style={{ margin: '0 0 2px', fontSize: 18, fontWeight: 800, color: RENK.text }}>{d.ad}</h3>
                  <p style={{ margin: '0 0 10px', fontSize: 13, color: RENK.textLight, fontWeight: 500 }}>
                    {d.unvan} · <span style={{ color: d.renk, fontWeight: 700 }}>{d.deneyim} Deneyim</span>
                  </p>
                  <p style={{ margin: 0, fontSize: 13, color: RENK.textLight, lineHeight: 1.7 }}>{d.aciklama}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HASTA YORUMLARI */}
      <section style={s.bolum}>
        <div style={s.bolumIc}>
          <div style={s.bolumBaslikAlani}>
            <div style={s.etiket}>Hasta Yorumları</div>
            <h2 style={s.bolumBaslik}>Hastalarımız Ne Diyor?</h2>
            <p style={s.bolumAlt}>Kliniğimizde hizmet aldıktan sonra gerçek deneyimlerini paylaşan hastalarımızdan seçmeler.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {YORUMLAR.map((y, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 16, padding: 24, border: `1px solid ${RENK.primaryBorder}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ color: '#f59e0b', fontSize: 18, marginBottom: 12, letterSpacing: 2 }}>
                  {'★'.repeat(y.yildiz)}{'☆'.repeat(5 - y.yildiz)}
                </div>
                <p style={{ margin: '0 0 16px', color: RENK.textLight, fontSize: 14, lineHeight: 1.8, fontStyle: 'italic' }}>"{y.yorum}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: y.renk, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                    {y.ad.split(' ').map(k => k[0]).join('')}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: RENK.text }}>{y.ad}</div>
                    <div style={{ fontSize: 11, background: RENK.primaryLight, color: RENK.primary, padding: '2px 8px', borderRadius: 12, fontWeight: 600, display: 'inline-block', marginTop: 2 }}>{y.tedavi}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MAKALELER */}
      <section id="makaleler" style={{ ...s.bolum, background: RENK.primaryLight }}>
        <div style={s.bolumIc}>
          <div style={s.bolumBaslikAlani}>
            <div style={s.etiket}>Diş Sağlığı Köşesi</div>
            <h2 style={s.bolumBaslik}>Bilgi ile Daha Sağlıklı Gülüşler</h2>
            <p style={s.bolumAlt}>Uzmanlarımızın kaleme aldığı makalelerle diş sağlığınız hakkında bilgi sahibi olun.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {guncelMakaleler.map(m => (
              <div key={m.id} style={{ background: '#fff', borderRadius: 14, padding: 24, border: `1px solid ${RENK.primaryBorder}`, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ background: RENK.primaryLight, color: RENK.primary, padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{m.kategori}</span>
                  <span style={{ color: RENK.textLight, fontSize: 12 }}>⏱ {m.sure}</span>
                </div>
                <h3 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 700, color: RENK.text, lineHeight: 1.4 }}>{m.baslik}</h3>
                <p style={{ margin: 0, color: RENK.textLight, fontSize: 13, lineHeight: 1.7, flex: 1 }}>{m.ozet}</p>
                <Link to={`/makale/${m.id}`} style={{ marginTop: 16, color: RENK.primary, fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}>Devamını oku →</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HAKKIMIZDA */}
      <section id="hakkimizda" style={s.bolum}>
        <div style={s.bolumIc}>
          <div className="hakkimizda-ic" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
            <div>
              <div style={s.etiket}>Hakkımızda</div>
              <h2 style={{ ...s.bolumBaslik, textAlign: 'left' }}>Güven ve Uzmanlıkla 15 Yıl</h2>
              <p style={{ color: RENK.textLight, lineHeight: 1.8, marginBottom: 24 }}>
                DentApp Diş Kliniği olarak 2009'dan bu yana hastalarımıza en yüksek kalitede diş hekimliği hizmeti sunuyoruz. Sürekli güncellenen ekipmanlarımız ve uzman hekim kadromuzla bölgenin güvenilir kliniği olmayı sürdürüyoruz.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[['8.000+','Tedavi Edilen Hasta'],['12','Uzman Diş Hekimi'],['%98','Hasta Memnuniyeti'],['15+','Yıl Deneyim']].map(([sayi, yazi], i) => (
                  <div key={i} style={{ background: RENK.primaryLight, borderRadius: 12, padding: '20px 16px', border: `1px solid ${RENK.primaryBorder}` }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: RENK.primary, marginBottom: 4 }}>{sayi}</div>
                    <div style={{ fontSize: 13, color: RENK.textLight }}>{yazi}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #1F6B4C 0%, #164F39 100%)', borderRadius: 20, padding: '36px 32px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
              {/* Dekoratif daireler */}
              <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: -30, left: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />

              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: 'rgba(255,255,255,0.55)', marginBottom: 10, textTransform: 'uppercase' }}>Neden DentApp?</div>
              <h3 style={{ margin: '0 0 28px', fontSize: 22, fontWeight: 800, lineHeight: 1.3 }}>Kliniğimizi Özel<br />Kılan Farklar</h3>

              {[
                { ikon: '🦷', baslik: 'Son Teknoloji Ekipmanlar',  aciklama: 'Dijital röntgen ve 3D tomografi ile hassas teşhis imkânı.' },
                { ikon: '🛡️', baslik: 'Steril Ortam Garantisi',    aciklama: 'Her seans sonrası eksiksiz sterilizasyon protokolü uygulanır.' },
                { ikon: '🕐', baslik: 'Esnek Randevu Saatleri',    aciklama: 'Pzt–Cmt 09:00–21:00, Pazar 11:00–21:00 arasında hizmet.' },
                { ikon: '👶', baslik: 'Çocuk Dostu Klinik',        aciklama: 'Özel tasarım ortamımızla çocuklarda diş hekimi korkusu ortadan kalkar.' },
                { ikon: '💳', baslik: 'Taksitli Ödeme İmkânı',     aciklama: 'Tüm tedavilerde 12 aya kadar varan taksit seçenekleri.' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 20, alignItems: 'flex-start' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    {item.ikon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{item.baslik}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>{item.aciklama}</div>
                  </div>
                </div>
              ))}

              <a href="#randevu" style={{ display: 'block', marginTop: 8, padding: '13px', background: '#fff', color: '#1F6B4C', textAlign: 'center', borderRadius: 10, fontWeight: 800, fontSize: 15, textDecoration: 'none' }}>
                Randevu Al →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SİGORTA ANLAŞMALARI */}
      <section style={{ ...s.bolum, background: RENK.primaryLight, paddingTop: 56, paddingBottom: 56 }}>
        <div style={s.bolumIc}>
          <div style={s.bolumBaslikAlani}>
            <div style={s.etiket}>Anlaşmalı Kurumlar</div>
            <h2 style={s.bolumBaslik}>Özel Sağlık Sigorta Anlaşmaları</h2>
            <p style={s.bolumAlt}>Aşağıdaki sigorta şirketleriyle anlaşmalı çalışıyoruz. Poliçe detayları için bizi arayın.</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 20 }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: '28px 48px', border: `2px solid ${RENK.primaryBorder}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', minWidth: 180 }}>
              <div style={{ width: 64, height: 64, borderRadius: 14, background: 'linear-gradient(135deg, #1a237e, #3949ab)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 900, fontSize: 22, letterSpacing: 1 }}>S</span>
              </div>
              <div style={{ fontWeight: 800, fontSize: 17, color: '#1a237e', letterSpacing: 0.5 }}>SENCARD</div>
              <div style={{ fontSize: 11, background: '#E8F5EE', color: RENK.primary, padding: '3px 12px', borderRadius: 20, fontWeight: 700 }}>Anlaşmalı Kurum</div>
            </div>
          </div>
        </div>
      </section>

      {/* SSS */}
      <section style={s.bolum}>
        <div style={s.bolumIc}>
          <div style={s.bolumBaslikAlani}>
            <div style={s.etiket}>SSS</div>
            <h2 style={s.bolumBaslik}>Sıkça Sorulan Sorular</h2>
            <p style={s.bolumAlt}>Merak ettiğiniz soruların cevapları burada. Bulamadıysanız WhatsApp'tan sorun.</p>
          </div>
          <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {SSS_LİSTESİ.map((item, i) => <SSSItem key={i} soru={item.soru} cevap={item.cevap} />)}
          </div>
        </div>
      </section>

      {/* RANDEVU / İLETİŞİM */}
      <section id="randevu" style={{ ...s.bolum, background: RENK.primaryLight }}>
        <div style={s.bolumIc}>
          <div style={s.bolumBaslikAlani}>
            <div style={s.etiket}>Randevu</div>
            <h2 style={s.bolumBaslik}>Randevu Alın</h2>
            <p style={s.bolumAlt}>Formu doldurun, gönder'e tıkladığınızda WhatsApp açılarak mesajınız otomatik hazırlanacaktır.</p>
          </div>
          <div className="iletisim-grid" style={s.iletisimGrid}>
            {/* Sol */}
            <div>
              <div style={s.bilgiKutulari}>
                <div style={s.bilgiKutu}>
                  <span style={s.bilgiIkon}>📍</span>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>Adres</div>
                    <div style={{ color: RENK.textLight, fontSize: 14 }}>{klinikAdres}</div>
                  </div>
                </div>
                <div style={s.bilgiKutu}>
                  <span style={s.bilgiIkon}>📞</span>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>Telefon / WhatsApp</div>
                    <div style={{ color: RENK.textLight, fontSize: 14 }}>{telefon}</div>
                  </div>
                </div>
                <div style={s.bilgiKutu}>
                  <span style={s.bilgiIkon}>🕒</span>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>Çalışma Saatleri</div>
                    <div style={{ color: RENK.textLight, fontSize: 14 }}>Pzt – Cmt: {pztCmtSaat}<br />Pazar: {pazarSaat}</div>
                  </div>
                </div>
              </div>

              <form onSubmit={formGonder} style={s.form}>
                <div className="form-satir" style={s.formSatir}>
                  <div style={s.formGrup}>
                    <label htmlFor="f-ad"  style={s.formEtiket}>Ad Soyad *</label>
                    <input id="f-ad" style={s.formGirdi} required placeholder="Adınız Soyadınız"
                      value={formVeri.ad}  onChange={e => setFormVeri({ ...formVeri, ad: e.target.value })} />
                  </div>
                  <div style={s.formGrup}>
                    <label htmlFor="f-tel" style={s.formEtiket}>Telefon *</label>
                    <input id="f-tel" style={s.formGirdi} type="tel" required placeholder="05xx xxx xx xx"
                      value={formVeri.tel} onChange={e => setFormVeri({ ...formVeri, tel: e.target.value })} />
                  </div>
                </div>
                <div style={s.formGrup}>
                  <label htmlFor="f-tarih" style={s.formEtiket}>Tercih Edilen Tarih</label>
                  <input id="f-tarih" style={s.formGirdi} type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={formVeri.tarih} onChange={e => setFormVeri({ ...formVeri, tarih: e.target.value })} />
                </div>

                {/* KVKK ONAY */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
                  <input type="checkbox" id="kvkk" checked={kvkkOnay} onChange={e => setKvkkOnay(e.target.checked)}
                    style={{ marginTop: 3, flexShrink: 0, accentColor: RENK.primary, width: 16, height: 16, cursor: 'pointer' }} />
                  <label htmlFor="kvkk" style={{ fontSize: 13, color: RENK.textLight, lineHeight: 1.5, cursor: 'pointer' }}>
                    <button type="button" onClick={() => setKvkkModal(true)}
                      style={{ background: 'none', border: 'none', padding: 0, color: RENK.primary, fontWeight: 700, cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>
                      KVKK Aydınlatma Metni
                    </button>
                    'ni okudum, kişisel verilerimin işlenmesini onaylıyorum. *
                  </label>
                </div>

                {formHata && (
                  <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 10, padding: '8px 12px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
                    ⚠️ {formHata}
                  </div>
                )}

                <button type="submit" style={s.formBtn}>
                  📱 WhatsApp ile Randevu Talebi Gönder
                </button>
                <p style={{ margin: '10px 0 0', fontSize: 12, color: RENK.textLight, textAlign: 'center' }}>
                  Gönder'e tıkladığınızda WhatsApp açılacak ve mesajınız otomatik olarak hazırlanacaktır.
                </p>
              </form>
            </div>

            {/* Sağ */}
            <div>
              <div style={s.puanKart}>
                <div style={s.puanSol}>
                  <div style={s.puanSayi}>5.0</div>
                  <div style={{ color: '#f59e0b', fontSize: 24, letterSpacing: 2 }}>★★★★★</div>
                  <div style={{ fontSize: 12, color: RENK.textLight, textAlign: 'center' }}>Google<br />Değerlendirmeleri</div>
                </div>
                <div style={s.puanSag}>
                  <div style={{ fontSize: 13, color: RENK.textLight, marginBottom: 10 }}>200+ değerlendirme</div>
                  {[['5 yıldız', '90%'], ['4 yıldız', '7%'], ['3 yıldız', '3%']].map(([etiket, oran]) => (
                    <div key={etiket} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: RENK.textLight, minWidth: 58 }}>{etiket}</span>
                      <div style={{ flex: 1, height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: '#f59e0b', borderRadius: 3, width: oran }} />
                      </div>
                      <span style={{ fontSize: 11, color: RENK.textLight, minWidth: 32 }}>{oran}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={s.haritaKutu}>
                <div style={{ padding: '14px 18px', borderBottom: `1px solid ${RENK.primaryBorder}` }}>
                  <span style={{ fontWeight: 700, color: RENK.primary }}>📍 Kliniğimizi Haritada Bul</span>
                </div>
                {haritaAcik ? (
                  <div style={{ position: 'relative' }}>
                    <iframe title="DentApp Konum" src={HARİTA_URL} width="100%" height="270" style={{ border: 0, display: 'block' }} loading="lazy" allowFullScreen />
                    <button style={{ position: 'absolute', top: 8, right: 8, background: RENK.primary, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: 12, cursor: 'pointer', zIndex: 10 }} onClick={() => setHaritaAcik(false)}>✕ Kapat</button>
                  </div>
                ) : (
                  <div style={{ padding: '32px 24px', textAlign: 'center', background: RENK.primaryLight }}>
                    <div style={{ fontSize: 48 }}>🗺️</div>
                    <p style={{ margin: '12px 0 6px', fontWeight: 600, color: RENK.text }}>Konumumuzu Görüntüle</p>
                    <p style={{ fontSize: 13, color: RENK.textLight, margin: '0 0 18px' }}>Google Maps'te yıldız puanlarımızı ve yorumlarımızı görmek için tıklayın.</p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button style={{ background: RENK.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }} onClick={() => setHaritaAcik(true)}>🗺️ Haritayı Göster</button>
                      <a href="https://share.google/oKUDwy1Vu5O6JQfpR" target="_blank" rel="noopener noreferrer" style={{ background: '#fff', color: RENK.primary, border: `2px solid ${RENK.primary}`, borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}>⭐ Google'da Değerlendir</a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: RENK.primaryDark, color: 'rgba(255,255,255,0.85)', padding: '48px 24px 32px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32, marginBottom: 36 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 12 }}>🦷 DentApp Diş Kliniği</div>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>Sağlıklı gülüşler için 15 yılı aşkın tecrübemizle yanınızdayız.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { ad: 'Facebook',  href: '#', svg: <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg> },
                  { ad: 'Instagram', href: '#', svg: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none"/></svg> },
                  { ad: 'YouTube',   href: '#', svg: <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#164F39"/></svg> },
                ].map(sm => (
                  <a key={sm.ad} href={sm.href} target="_blank" rel="noopener noreferrer" title={sm.ad}
                    style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                    {sm.svg}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 700, color: '#fff', marginBottom: 12, fontSize: 14 }}>Hızlı Linkler</div>
              {[['Hizmetlerimiz','#hizmetler'],['Doktorlarımız','#doktorlar'],['Makaleler','#makaleler'],['Hakkımızda','#hakkimizda'],['Randevu Al','#randevu']].map(([yazi, href]) => (
                <a key={yazi} href={href} style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 8, textDecoration: 'none' }}>→ {yazi}</a>
              ))}
            </div>

            <div>
              <div style={{ fontWeight: 700, color: '#fff', marginBottom: 12, fontSize: 14 }}>Yasal</div>
              {[['KVKK Aydınlatma Metni','#'],['Çerez Politikası','#'],['Gizlilik Politikası','#']].map(([yazi, href]) => (
                <a key={yazi} href={href} style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 8, textDecoration: 'none' }}>→ {yazi}</a>
              ))}
            </div>

            <div>
              <div style={{ fontWeight: 700, color: '#fff', marginBottom: 12, fontSize: 14 }}>İletişim</div>
              <p style={{ margin: '0 0 8px', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>📍 Reşit Paşa Cd. No:23 D:B, Avcılar / İstanbul</p>
              <p style={{ margin: '0 0 8px', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>📞 +90 540 590 10 30</p>
              <p style={{ margin: 0,         fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>🕒 Pzt–Cmt: 09:00–21:00</p>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 20, textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
              © {new Date().getFullYear()} DentApp Diş Kliniği. Tüm hakları saklıdır. · KVKK kapsamında kişisel verileriniz korunmaktadır.
            </p>
          </div>
        </div>
      </footer>

      {/* FLOATING WHATSAPP */}
      <a href={waUrl} target="_blank" rel="noopener noreferrer" title="WhatsApp ile İletişim"
        style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 998, background: '#25D366', width: 58, height: 58, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', animation: 'waPulse 2.5s ease-in-out infinite' }}>
        <svg viewBox="0 0 32 32" width="30" height="30" fill="white">
          <path d="M16 0C7.163 0 0 7.163 0 16c0 2.832.74 5.49 2.032 7.8L0 32l8.437-2.01A15.93 15.93 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm8.073 22.557c-.337.947-1.964 1.813-2.726 1.929-.737.112-1.664.16-2.683-.169-.619-.198-1.414-.463-2.43-.907-4.273-1.846-7.066-6.152-7.28-6.433-.212-.28-1.737-2.31-1.737-4.41 0-2.1 1.1-3.132 1.49-3.56.387-.427.844-.534 1.126-.534.281 0 .563.003.808.015.259.013.608-.098.952.727.353.844 1.197 2.916 1.302 3.128.105.211.175.457.035.736-.14.28-.211.457-.421.703-.211.246-.445.55-.634.738-.21.21-.428.437-.184.857.245.421 1.087 1.795 2.334 2.908 1.603 1.429 2.955 1.871 3.376 2.082.421.21.666.176.912-.106.245-.28 1.054-1.228 1.334-1.65.28-.42.562-.351.949-.21.387.14 2.457 1.158 2.878 1.368.421.21.703.316.808.492.105.176.105 1.017-.232 1.964z"/>
        </svg>
      </a>

      {menuAcik && <div style={s.mobilOverlay} onClick={() => setMenuAcik(false)} />}
      {kvkkModal && <KVKKModal kapat={() => setKvkkModal(false)} />}
      <CerezBanner />
    </main>
  )
}

// ─── STİLLER ─────────────────────────────────────────────────────────────────
const s = {
  ucretsizBanner: { background: '#f59e0b', color: '#1A3329', padding: '10px 24px', textAlign: 'center', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' },
  bannerBtn:      { background: '#164F39', color: '#fff', padding: '5px 14px', borderRadius: 20, textDecoration: 'none', fontWeight: 700, fontSize: 13 },

  header:    { position: 'sticky', top: 0, background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', zIndex: 100 },
  headerIc:  { maxWidth: 1180, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 },
  logo:      { display: 'flex', alignItems: 'center', gap: 10 },
  logoIkon:  { fontSize: 28 },
  logoYazi:  { fontWeight: 800, fontSize: 18, color: '#1F6B4C' },
  headerNav: { display: 'flex', gap: 32 },
  navLink:   { textDecoration: 'none', color: '#1A3329', fontWeight: 500, fontSize: 15 },
  randevuBtn:{ background: '#1F6B4C', color: '#fff', padding: '10px 22px', borderRadius: 24, textDecoration: 'none', fontWeight: 600, fontSize: 14 },

  hero:           { background: 'linear-gradient(135deg, #164F39 0%, #1F6B4C 60%, #2D8A62 100%)', color: '#fff', padding: '72px 24px' },
  heroIc:         { maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' },
  heroBadge:      { display: 'inline-block', background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', padding: '5px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 20 },
  heroBaslik:     { margin: '0 0 20px', fontSize: 46, fontWeight: 800, lineHeight: 1.2 },
  heroParagraf:   { fontSize: 16, lineHeight: 1.8, color: 'rgba(255,255,255,0.85)', marginBottom: 32 },
  heroBtnlar:     { display: 'flex', gap: 14, marginTop: 28 },
  heroPrimaryBtn: { background: '#fff', color: '#1F6B4C', padding: '13px 28px', borderRadius: 28, textDecoration: 'none', fontWeight: 700, fontSize: 15 },
  heroSecondaryBtn:{ background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '13px 28px', borderRadius: 28, textDecoration: 'none', fontWeight: 600, fontSize: 15, border: '2px solid rgba(255,255,255,0.3)' },
  heroSag:        { display: 'flex', flexDirection: 'column', gap: 16 },
  heroKart:       { background: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-around', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.2)' },
  heroStatSayi:   { fontSize: 28, fontWeight: 800, display: 'block' },
  heroStatYazi:   { fontSize: 12, color: 'rgba(255,255,255,0.75)', textAlign: 'center', display: 'block' },
  heroAyrac:      { width: 1, height: 48, background: 'rgba(255,255,255,0.2)' },
  heroPuanKart:   { background: '#fff', borderRadius: 14, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16 },

  bolum:            { padding: '80px 24px' },
  bolumIc:          { maxWidth: 1180, margin: '0 auto' },
  bolumBaslikAlani: { textAlign: 'center', marginBottom: 52 },
  etiket:           { display: 'inline-block', background: '#E8F5EE', color: '#1F6B4C', padding: '5px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, marginBottom: 14, border: '1px solid #B2D9C5' },
  bolumBaslik:      { margin: '0 0 16px', fontSize: 36, fontWeight: 800, color: '#1A3329' },
  bolumAlt:         { margin: '0 auto', color: '#5A7A6A', fontSize: 16, maxWidth: 560 },
  hizmetGrid:       { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 },

  iletisimGrid:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 },
  bilgiKutulari: { display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 },
  bilgiKutu:     { display: 'flex', alignItems: 'flex-start', gap: 14, background: '#fff', borderRadius: 12, padding: '14px 16px', border: '1px solid #B2D9C5' },
  bilgiIkon:     { fontSize: 20, flexShrink: 0, marginTop: 2 },
  form:          { background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #B2D9C5' },
  formSatir:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  formGrup:      { marginBottom: 14 },
  formEtiket:    { display: 'block', fontSize: 13, fontWeight: 600, color: '#1A3329', marginBottom: 6 },
  formGirdi:     { width: '100%', padding: '10px 14px', border: '1px solid #B2D9C5', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', color: '#1A3329', fontFamily: 'inherit', outline: 'none' },
  formBtn:       { width: '100%', padding: 13, background: '#25D366', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' },

  puanKart: { background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #B2D9C5', display: 'flex', gap: 20, marginBottom: 16 },
  puanSol:  { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, minWidth: 80 },
  puanSayi: { fontSize: 40, fontWeight: 800, color: '#1A3329', lineHeight: 1 },
  puanSag:  { flex: 1 },
  haritaKutu: { background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid #B2D9C5' },

  hamburger:       { display: 'none', background: 'none', border: '1px solid #e0e0e0', borderRadius: 8, width: 40, height: 40, cursor: 'pointer', fontSize: 20, alignItems: 'center', justifyContent: 'center', color: '#1A3329', flexShrink: 0, padding: 0 },
  mobilMenu:       { background: '#fff', borderTop: '1px solid #eee', padding: '8px 0 16px' },
  mobilNavLink:    { display: 'block', padding: '14px 24px', color: '#1A3329', fontWeight: 500, fontSize: 16, textDecoration: 'none', borderBottom: '1px solid #f0f0f0' },
  mobilRandevuBtn: { display: 'block', margin: '14px 24px 0', padding: 13, background: '#1F6B4C', color: '#fff', textAlign: 'center', borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: 'none' },
  mobilOverlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 99 },
}
