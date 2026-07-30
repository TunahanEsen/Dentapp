using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using DentApp.API.Data;
using DentApp.API.DTOs;
using DentApp.API.Models;

var builder = WebApplication.CreateBuilder(args);

// Render gibi platformlar dinlenecek portu PORT ortam değişkeniyle verir.
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}

// -------------------------------------------------------------------
// SERVİSLER
// -------------------------------------------------------------------

// Yerel geliştirme origin'i her zaman açık; canlı frontend adresi
// FrontendUrl ortam değişkeniyle (Render'da ayarlanır) eklenir.
var allowedOrigins = new List<string> { "http://localhost:5173" };
var frontendUrl = builder.Configuration["FrontendUrl"];
if (!string.IsNullOrWhiteSpace(frontendUrl))
{
    allowedOrigins.Add(frontendUrl);
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins(allowedOrigins.ToArray())
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// JWT ayarlarını appsettings.json'dan oku
var jwtSettings  = builder.Configuration.GetSection("Jwt");
var secretKey    = jwtSettings["SecretKey"]!;
var issuer       = jwtSettings["Issuer"]!;
var audience     = jwtSettings["Audience"]!;

// JWT kimlik doğrulamasını kaydet.
// "Bearer <token>" başlıklı istekleri otomatik doğrular.
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,   // Token süresi dolmuş mu kontrol et
            ValidateIssuerSigningKey = true,
            ValidIssuer              = issuer,
            ValidAudience            = audience,
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
        };
    });

builder.Services.AddAuthorization(options =>
{
    // "AdminOnly" policy: sadece Role = "Admin" olan token'lar geçebilir
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
});

var app = builder.Build();

// -------------------------------------------------------------------
// STARTUP SEED — Hiç Admin yoksa varsayılan Admin oluştur
// -------------------------------------------------------------------
using (var kapsam = app.Services.CreateScope())
{
    var db = kapsam.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();

    // ── Admin kullanıcı ──────────────────────────────────────────────
    if (!db.Users.Any(u => u.Role == "Admin"))
    {
        db.Users.Add(new User
        {
            FullName     = "Admin",
            Email        = "admin@dentapp.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
            Role         = "Admin"
        });
        db.SaveChanges();
        Console.WriteLine("Varsayılan admin oluşturuldu: admin@dentapp.com / Admin123!");
    }

    // ── Örnek Stok Kalemleri ─────────────────────────────────────────
    if (!db.StokKalemleri.Any())
    {
        db.StokKalemleri.AddRange(
            new StokKalemi { UrunAdi = "Kompozit Dolgu Malzemesi", Kategori = "Malzeme", Birim = "gr",    Miktar = 240,  MinimumMiktar = 50,  BirimFiyat = 12.50m,  SonGuncelleme = DateTime.UtcNow },
            new StokKalemi { UrunAdi = "Anestezi Kartuşu",         Kategori = "İlaç",    Birim = "kutu",  Miktar = 6,    MinimumMiktar = 10,  BirimFiyat = 85.00m,  SonGuncelleme = DateTime.UtcNow },
            new StokKalemi { UrunAdi = "Lateks Eldiven (M)",        Kategori = "Sarf",    Birim = "kutu",  Miktar = 18,   MinimumMiktar = 5,   BirimFiyat = 32.00m,  SonGuncelleme = DateTime.UtcNow },
            new StokKalemi { UrunAdi = "Steril Gazlı Bez",          Kategori = "Sarf",    Birim = "paket", Miktar = 40,   MinimumMiktar = 10,  BirimFiyat = 14.50m,  SonGuncelleme = DateTime.UtcNow },
            new StokKalemi { UrunAdi = "Kavite Dedektörü",          Kategori = "İlaç",    Birim = "ml",    Miktar = 3,    MinimumMiktar = 5,   BirimFiyat = 145.00m, SonGuncelleme = DateTime.UtcNow },
            new StokKalemi { UrunAdi = "Panoramik Film",            Kategori = "Ekipman", Birim = "adet",  Miktar = 80,   MinimumMiktar = 20,  BirimFiyat = 9.00m,   SonGuncelleme = DateTime.UtcNow },
            new StokKalemi { UrunAdi = "Diş İpi (Floss)",           Kategori = "Sarf",    Birim = "adet",  Miktar = 60,   MinimumMiktar = 10,  BirimFiyat = 5.50m,   SonGuncelleme = DateTime.UtcNow },
            new StokKalemi { UrunAdi = "İmplant Vida (3.5mm)",      Kategori = "Ekipman", Birim = "adet",  Miktar = 12,   MinimumMiktar = 5,   BirimFiyat = 850.00m, SonGuncelleme = DateTime.UtcNow }
        );
        db.SaveChanges();
        Console.WriteLine("Örnek stok kalemleri eklendi.");
    }

    // ── Örnek Tedaviler ──────────────────────────────────────────────
    if (!db.Tedaviler.Any())
    {
        db.Tedaviler.AddRange(
            new Tedavi { Ad = "Kontrol Muayenesi",      Kategori = "Muayene",        TemelFiyat = 150m   },
            new Tedavi { Ad = "Periyodik Muayene",       Kategori = "Muayene",        TemelFiyat = 200m   },
            new Tedavi { Ad = "Kompozit Dolgu (Tek)",    Kategori = "Dolgu",          TemelFiyat = 400m   },
            new Tedavi { Ad = "Kompozit Dolgu (Çoklu)", Kategori = "Dolgu",          TemelFiyat = 650m   },
            new Tedavi { Ad = "Kanal Tedavisi (Tek K)", Kategori = "Kanal Tedavisi", TemelFiyat = 800m   },
            new Tedavi { Ad = "Kanal Tedavisi (Çok K)", Kategori = "Kanal Tedavisi", TemelFiyat = 1200m  },
            new Tedavi { Ad = "Titanyum İmplant",       Kategori = "İmplant",        TemelFiyat = 8500m  },
            new Tedavi { Ad = "Zirkon Kaplama",         Kategori = "Estetik",        TemelFiyat = 3000m  },
            new Tedavi { Ad = "Diş Beyazlatma",         Kategori = "Estetik",        TemelFiyat = 1500m  },
            new Tedavi { Ad = "Diş Teli (Tel)",         Kategori = "Ortodonti",      TemelFiyat = 5000m  },
            new Tedavi { Ad = "Şeffaf Plak",            Kategori = "Ortodonti",      TemelFiyat = 7000m  },
            new Tedavi { Ad = "Diş Çekimi (Basit)",     Kategori = "Cerrahi",        TemelFiyat = 350m   },
            new Tedavi { Ad = "Gömük Diş Çekimi",      Kategori = "Cerrahi",        TemelFiyat = 900m   },
            new Tedavi { Ad = "Diş Eti Tedavisi",       Kategori = "Muayene",        TemelFiyat = 600m   }
        );
        db.SaveChanges();
        Console.WriteLine("Örnek tedaviler eklendi.");
    }

    // ── Örnek Çalışanlar ─────────────────────────────────────────────
    if (!db.Calisanlar.Any())
    {
        db.Calisanlar.AddRange(
            new Calisan { AdSoyad = "Dr. Ayşe Yılmaz",  Unvan = "Diş Hekimi",     Renk = "#1F6B4C" },
            new Calisan { AdSoyad = "Dr. Mehmet Kaya",   Unvan = "Diş Hekimi",     Renk = "#1b5e20" },
            new Calisan { AdSoyad = "Dr. Selin Arslan",  Unvan = "Diş Hekimi",     Renk = "#b71c1c" },
            new Calisan { AdSoyad = "Zeynep Demir",      Unvan = "Resepsiyonist",   Renk = "#e65100" },
            new Calisan { AdSoyad = "Ali Çelik",         Unvan = "Teknisyen",       Renk = "#4a148c" }
        );
        db.SaveChanges();
        Console.WriteLine("Örnek çalışanlar eklendi.");
    }

    // ── Örnek Gelir / Gider Kayıtları ────────────────────────────────
    if (!db.GelirGiderler.Any())
    {
        db.GelirGiderler.AddRange(
            // Nisan 2026
            new GelirGider { Tur = "Gelir", Kategori = "Tedavi Geliri",  Miktar = 12500m, Tarih = new DateOnly(2026, 4, 3),  Aciklama = "Haftalık tedavi tahsilatı"    },
            new GelirGider { Tur = "Gelir", Kategori = "Tedavi Geliri",  Miktar = 9800m,  Tarih = new DateOnly(2026, 4, 10), Aciklama = "İmplant tedavisi ödemeleri"   },
            new GelirGider { Tur = "Gider", Kategori = "Malzeme",        Miktar = 3200m,  Tarih = new DateOnly(2026, 4, 5),  Aciklama = "Aylık sarf malzeme alımı"     },
            new GelirGider { Tur = "Gider", Kategori = "Maaş",           Miktar = 18000m, Tarih = new DateOnly(2026, 4, 30), Aciklama = "Nisan ayı maaş ödemeleri"     },
            new GelirGider { Tur = "Gider", Kategori = "Kira",           Miktar = 5500m,  Tarih = new DateOnly(2026, 4, 1),  Aciklama = "Nisan kirası"                 },
            // Mayıs 2026
            new GelirGider { Tur = "Gelir", Kategori = "Tedavi Geliri",  Miktar = 15600m, Tarih = new DateOnly(2026, 5, 8),  Aciklama = "Ortodonti + implant gelirleri"},
            new GelirGider { Tur = "Gelir", Kategori = "Danışmanlık",    Miktar = 2000m,  Tarih = new DateOnly(2026, 5, 15), Aciklama = "Online diş danışmanlığı"      },
            new GelirGider { Tur = "Gider", Kategori = "Malzeme",        Miktar = 4100m,  Tarih = new DateOnly(2026, 5, 6),  Aciklama = "İmplant vida alımı"           },
            new GelirGider { Tur = "Gider", Kategori = "Elektrik/Su",    Miktar = 1800m,  Tarih = new DateOnly(2026, 5, 12), Aciklama = "Mayıs elektrik faturası"      },
            new GelirGider { Tur = "Gider", Kategori = "Maaş",           Miktar = 18000m, Tarih = new DateOnly(2026, 5, 31), Aciklama = "Mayıs ayı maaş ödemeleri"    },
            new GelirGider { Tur = "Gider", Kategori = "Kira",           Miktar = 5500m,  Tarih = new DateOnly(2026, 5, 1),  Aciklama = "Mayıs kirası"                 },
            // Haziran 2026
            new GelirGider { Tur = "Gelir", Kategori = "Tedavi Geliri",  Miktar = 11200m, Tarih = new DateOnly(2026, 6, 4),  Aciklama = "Haziran tedavi tahsilatı"     },
            new GelirGider { Tur = "Gelir", Kategori = "Tedavi Geliri",  Miktar = 8500m,  Tarih = new DateOnly(2026, 6, 11), Aciklama = "Zirkon kaplama ödemeleri"     },
            new GelirGider { Tur = "Gider", Kategori = "Ekipman",        Miktar = 7200m,  Tarih = new DateOnly(2026, 6, 3),  Aciklama = "Panoramik röntgen bakımı"     },
            new GelirGider { Tur = "Gider", Kategori = "Malzeme",        Miktar = 2900m,  Tarih = new DateOnly(2026, 6, 9),  Aciklama = "Haziran sarf malzeme alımı"   },
            new GelirGider { Tur = "Gider", Kategori = "Kira",           Miktar = 5500m,  Tarih = new DateOnly(2026, 6, 1),  Aciklama = "Haziran kirası"               }
        );
        db.SaveChanges();
        Console.WriteLine("Örnek gelir/gider kayıtları eklendi.");
    }

    // ── Site Ayarları (public site içeriği) ──────────────────────────
    if (!db.SiteAyarlari.Any())
    {
        var opts = new System.Text.Json.JsonSerializerOptions
        {
            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        };

        var iletisim = new
        {
            adres    = "Denizköşkler, Reşit Paşa Cd. No:23 D:B, 34315 Avcılar/İstanbul",
            telefon  = "+90 540 590 10 30",
            waNumara = "905405901030",
            calismaSaatleri = new
            {
                pztCmt = new { baslangic = "09:00", bitis = "21:00" },
                pazar  = new { baslangic = "11:00", bitis = "21:00" }
            },
            sosyalMedya = new { facebook = "#", instagram = "#", youtube = "#" }
        };

        var doktorlar = new object[]
        {
            new { id = 1, ad = "Dr. Ayşe Yılmaz",  unvan = "Diş Hekimi", uzmanlik = "Ortodonti & Şeffaf Plak",    deneyim = "12 Yıl", bas = "AY", renk = "#1F6B4C", aciklama = "İstanbul Üniversitesi Diş Hekimliği Fakültesi mezunu. Ortodonti alanında uzmanlaşan Dr. Yılmaz, şeffaf plak ve sabit ortodontik tedavilerde deneyimlidir." },
            new { id = 2, ad = "Dr. Mehmet Kaya",   unvan = "Diş Hekimi", uzmanlik = "İmplant & Oral Cerrahi",     deneyim = "15 Yıl", bas = "MK", renk = "#1b5e20", aciklama = "Marmara Üniversitesi mezunu. İmplant cerrahisi ve oral cerrahi konularında 15 yılı aşkın deneyime sahip. 500'den fazla başarılı implant vakası." },
            new { id = 3, ad = "Dr. Selin Arslan",  unvan = "Diş Hekimi", uzmanlik = "Estetik Diş Hekimliği",     deneyim = "9 Yıl",  bas = "SA", renk = "#b71c1c", aciklama = "Gülüş tasarımı, diş beyazlatma, zirkon kaplama ve laminate veneer uygulamalarında uzman. Avrupa'da estetik diş hekimliği eğitimi almıştır." }
        };

        var hizmetler = new object[]
        {
            new { id = 1, baslik = "Muayene",               aciklama = "İlk muayeneniz tamamen ücretsiz! Uzman hekimlerimizle tanışın.",  ucretsiz = true,  renk = "#1F6B4C", renkAcik = "#E8F5EE", animPath = "/animations/muayene.json"  },
            new { id = 2, baslik = "Diş Röntgeni",          aciklama = "Dijital röntgen hizmetimiz ücretsiz sunulmaktadır.",             ucretsiz = true,  renk = "#2563EB", renkAcik = "#DBEAFE", animPath = "/animations/rontgen.json"   },
            new { id = 3, baslik = "İmplant Tedavisi",      aciklama = "Eksik dişleriniz için kalıcı ve doğal görünümlü çözümler.",     ucretsiz = false, renk = "#7C3AED", renkAcik = "#EDE9FE", animPath = "/animations/implant.json"   },
            new { id = 4, baslik = "Estetik Diş Hekimliği", aciklama = "Gülen tasarımı, beyazlatma ve porselen kaplama uygulamaları.",  ucretsiz = false, renk = "#DB2777", renkAcik = "#FCE7F3", animPath = "/animations/estetik.json"   },
            new { id = 5, baslik = "Kanal Tedavisi",         aciklama = "İleri teknoloji ile ağrısız kanal tedavisi.",                   ucretsiz = false, renk = "#0891B2", renkAcik = "#CFFAFE", animPath = "/animations/kanal.json"     },
            new { id = 6, baslik = "Ortodonti",              aciklama = "Şeffaf plak ve tel tedavileriyle mükemmel kapanış.",            ucretsiz = false, renk = "#D97706", renkAcik = "#FEF3C7", animPath = "/animations/ortodonti.json" },
            new { id = 7, baslik = "Diş Eti Tedavisi",      aciklama = "Periodontoloji uzmanı eşliğinde diş eti sağlığı.",              ucretsiz = false, renk = "#4F46E5", renkAcik = "#E0E7FF", animPath = "/animations/diseti.json"    },
            new { id = 8, baslik = "Çocuk Diş Hekimliği",  aciklama = "Çocuklar için özel tasarlanmış tedavi ortamı.",                 ucretsiz = false, renk = "#059669", renkAcik = "#D1FAE5", animPath = "/animations/cocuk.json"     }
        };

        var makaleler = new object[]
        {
            new { id = 1,  baslik = "İmplant Tedavisi Nedir? Kimler Yaptırabilir?",       ozet = "Dental implant, çenede titanyum vida kullanılarak eksik dişlerin yerine kalıcı protez yerleştirilmesi işlemidir.", sure = "3 dk", kategori = "Tedavi",        yazar = "Dr. Mehmet Kaya",  tarih = "12 Mayıs 2025",    icerik = "Dental implant, kaybedilen bir ya da birden fazla diş için uygulanan kalıcı bir diş protezi sistemidir. Biyouyumlu titanyum materyal zamanla kemikle kaynaşarak güçlü bir temel oluşturur.\n\nKimler İmplant Yaptırabilir?\n\nDiş kaybı yaşamış yetişkinler, yeterli kemik yoğunluğuna sahip kişiler ve kontrol altındaki diyabet hastaları implant yaptırabilir. Aktif diş eti hastalığı olmaması gerekir.\n\nTedavi süreci genellikle 3-6 ay alır. Birinci seansta titanyum vida çene kemiğine yerleştirilir. Kemiğe kaynaşma süreci tamamlandıktan sonra üzerine kalıcı kuron takılır.\n\nDoğal dişe en yakın görünüm ve his veren implantlar komşu dişlere zarar vermez. Uygun bakım yapıldığında 20 yıl ve üzeri kullanım ömrüne sahip olabilirler." },
            new { id = 2,  baslik = "Diş Beyazlatmanın 5 Güvenli Yöntemi",                ozet = "Profesyonel bleaching, ev tipi jel uygulamaları ve lazer beyazlatma arasındaki farklar.", sure = "4 dk", kategori = "Estetik",       yazar = "Dr. Selin Arslan", tarih = "3 Nisan 2025",     icerik = "Diş beyazlatma, minenin renklenmesini gidermek amacıyla uygulanan profesyonel ya da ev tipi ağartma işlemleridir. Kahve, çay, sigara ve yaşlanma gibi etkenlerle sararan dişler birkaç ton açılabilir.\n\n5 Güvenli Yöntem\n\nOfis tipi bleaching: Konsantre jel ve LED ışıkla tek seansta 3-8 ton açılma. Ev tipi plak: Özel plak ve %10-16 peroksit jeli ile 2-4 haftada sonuç. Lazer destekli beyazlatma, kombine tedavi ve yüzeysel leke temizliği diğer seçeneklerdir.\n\nProfesyonel diş beyazlatmanın etkisi ortalama 1-3 yıl sürer. Kahve ve sigara gibi boyayıcı maddeleri azaltarak ve düzenli diş temizliği yaptırarak süreyi uzatabilirsiniz." },
            new { id = 3,  baslik = "Ortodonti: Şeffaf Plak mı, Metal Tel mi?",           ozet = "İki yöntemin maliyet, görünüm, bakım kolaylığı ve tedavi süresi açısından karşılaştırılması.", sure = "5 dk", kategori = "Ortodonti",    yazar = "Dr. Ayşe Yılmaz",  tarih = "18 Mart 2025",     icerik = "Çarpık ya da aralıklı dişler için iki temel ortodontik tedavi yöntemi metal braket ve şeffaf plaktır. Her ikisi de etkili olup doğru seçim bireyin yaşına, vaka karmaşıklığına ve yaşam tarzına göre değişir.\n\nMetal Braket\n\nHer vakaya uygulanabilir, özellikle karmaşık olgularda üstündür. Hastanın çıkarması gerekmiyor. Maliyet açısından genellikle daha uygun. Ancak görünür metal parçaları estetik kaygı yaratabilir.\n\nŞeffaf Plak\n\nNeredeyse görünmez ve estetik açıdan avantajlıdır. Çıkarılabilir olması yeme-içme ve diş fırçalamayı kolaylaştırır. Orta-hafif vakalara daha uygun. Günde en az 22 saat takılması gerekir.\n\nTedavi süreleri her ikisinde de benzerdir; hafif vakalarda 6-12 ay, karmaşık vakalarda 18-36 aya ulaşabilir." },
            new { id = 4,  baslik = "Kanal Tedavisi Hakkında 7 Yanlış İnanç",             ozet = "\"Kanal tedavisi çok ağrılıdır\" gibi yaygın mitleri çürütüyoruz.", sure = "3 dk", kategori = "Tedavi",        yazar = "Dr. Mehmet Kaya",  tarih = "5 Şubat 2025",     icerik = "Kanal tedavisi, dişin içindeki sinir ve damar dokusunun hasar görmesi durumunda uygulanır. Yaygın yanlış inanışların aksine modern tekniklerle bu işlem oldukça konforlu hale gelmiştir.\n\nLokal anestezi ile işlem süresince ağrı hissedilmez. Doğal dişi korumak her zaman önceliklidir. Pulpa uzaklaştırılsa da diş işlevsel kalmaya devam eder. Üzerine kuron yapılırsa ömrü uzar.\n\nKanal tedavisini ertelerseniz enfeksiyon komşu dokulara yayılabilir. Erken tedavi hem daha kısa sürer hem de daha az maliyetlidir." },
            new { id = 5,  baslik = "Ağız Sağlığı ile Genel Sağlık Arasındaki Bağ",      ozet = "Araştırmalar, diş eti hastalıklarının kalp hastalıkları ve diyabetle ilişkili olduğunu göstermektedir.", sure = "4 dk", kategori = "Genel Sağlık", yazar = "Dr. Ayşe Yılmaz",  tarih = "20 Ocak 2025",     icerik = "Ağız sağlığı, vücudun genel sağlık durumunun önemli bir yansımasıdır. Diş eti iltihabı ve periodontit gibi hastalıklar yalnızca ağız içinde değil sistemik düzeyde de ciddi etkilere yol açabilir.\n\nBilimsel araştırmalar periodontit ile kalp hastalıkları, diyabet, hamilelik komplikasyonları ve solunum yolu hastalıkları arasında bağlantı olduğunu göstermektedir.\n\nGünde iki kez fırçalama, diş ipi kullanımı ve 6 ayda bir profesyonel diş temizliği; hem ağız sağlığını hem de genel sağlığı korumanın en etkili yollarıdır." },
            new { id = 6,  baslik = "Diş Gıcırdatma (Bruksizm): Belirtileri ve Tedavisi", ozet = "Uyku sırasında bilinçsizce gerçekleşen diş sıkma çenede ağrıya ve diş aşınmasına yol açar.", sure = "3 dk", kategori = "Tedavi",        yazar = "Dr. Selin Arslan", tarih = "10 Aralık 2024",   icerik = "Bruksizm, özellikle uyku sırasında farkında olmadan gerçekleşen diş sıkma ve gıcırdatma alışkanlığıdır. Kronik stres, anksiyete ve uyku bozuklukları başlıca tetikleyiciler arasındadır.\n\nBelirtiler: Sabah kalktığınızda çene ağrısı, düz ve aşınmış diş yüzeyleri, baş ağrısı ve kulak ağrısına benzer his.\n\nTedavi yöntemleri arasında gece plağı (oklüzal splint), stres yönetimi, ortodontik tedavi ve şiddetli vakalarda botoks enjeksiyonu yer alır.\n\nBruksizm tedavi edilmezse mine aşınması ve TME bozuklukları gelişebilir." },
            new { id = 7,  baslik = "Diş Eti Hastalıkları: Erken Belirtileri Kaçırmayın", ozet = "Kanayan, şişen veya çekilen dişetleri periodontit habercisi olabilir.", sure = "4 dk", kategori = "Diş Eti",      yazar = "Dr. Ayşe Yılmaz",  tarih = "22 Kasım 2024",    icerik = "Diş eti hastalıkları, dişleri çevreleyen doku ve kemik yapılarını etkileyen enfeksiyonlardır. Gingivit olarak başlayan süreç tedavi edilmezse periodontite dönüşerek kemik kaybına yol açabilir.\n\nErken belirtiler: Fırçalamada diş eti kanaması, kırmızı ve şişmiş diş etleri, artan boşluklar, ağız kokusu ve dişlerin gevşemesi.\n\nGingivit aşamasında profesyonel temizlik ve iyi ağız hijyeni ile hastalık tamamen geri döndürülebilir. Periodontit aşamasında derin temizlik veya cerrahi müdahale gerekebilir.\n\nGünde iki kez yumuşak fırçayla fırçalama ve 6 ayda bir diş hekimi kontrolü temel koruyucu adımlardır." },
            new { id = 8,  baslik = "Çocuklarda Diş Bakımı: Süttten Daimi Dişe",         ozet = "Bebeklerde ilk diş çıkışından itibaren ağız bakımı nasıl yapılır?", sure = "5 dk", kategori = "Çocuk Sağlığı", yazar = "Dr. Selin Arslan", tarih = "8 Kasım 2024",     icerik = "Çocuklarda ağız sağlığı, daha ilk dişin çıkmasıyla birlikte önem kazanır. Süt dişleri çiğneme fonksiyonu, konuşma gelişimi ve daimi dişler için yer tutuculuk açısından kritiktir.\n\n0-6 ay: İlk diş çıkmadan önce diş etleri yumuşak bezle silinebilir. 6-12 ay: Küçük bebek fırçası kullanmaya başlayın. 1-3 yaş: Pirinç tanesi büyüklüğünde flüorürlü macun. 3-6 yaş: Bezelye büyüklüğünde macun, ebeveyn gözetiminde.\n\n6 yaşında ilk kalıcı azı dişleri çıkar. Fissür örtücü uygulaması çürük riskini büyük ölçüde azaltır. Çocuğunuzu ilk diş hekimi ziyaretine 1 yaşında götürmenizi öneririz." },
            new { id = 9,  baslik = "Zirkon Kaplama: Dayanıklılık ve Estetik Bir Arada",  ozet = "Porselen ile zirkon kaplamayı karşılaştırıyoruz.", sure = "4 dk", kategori = "Estetik",       yazar = "Dr. Selin Arslan", tarih = "1 Ekim 2024",      icerik = "Zirkon kaplama, son yıllarda estetik diş hekimliğinde en çok tercih edilen restorasyon yöntemlerinden biri haline gelmiştir. Hem dayanıklılığı hem de doğal diş görünümüne olan yakınlığıyla öne çıkar.\n\nZirkon, porselen-metal kaplamalardan çok daha sağlamdır. Metal içermediğinden diş eti sınırında koyu renk oluşmaz. Işık geçirgenliği sayesinde doğal dişe çok yakın görünür ve zamanla renk değiştirmez.\n\nZirkon kaplamalar ön ve arka dişlere uygulanabilir. Tek dişten tam gülüş tasarımına kadar geniş bir uygulama yelpazesi sunar. Kliniğimizde dijital gülüş tasarımı ile sonuçları önceden görebilirsiniz." },
            new { id = 10, baslik = "Diş Hassasiyetine 6 Pratik Çözüm",                   ozet = "Sıcak veya soğuğa duyarlı dişler için günlük önlemler ve klinik uygulamalar.", sure = "3 dk", kategori = "Genel Sağlık", yazar = "Dr. Mehmet Kaya",  tarih = "14 Eylül 2024",    icerik = "Diş hassasiyeti, mine aşınması veya diş eti çekilmesi sonucu açıkta kalan dentin kanallarının sıcak, soğuk veya asidik uyaranlara karşı ani ağrıyla yanıt vermesidir.\n\n6 Pratik Çözüm:\n\nHassasiyet giderici macun kullanın. Yumuşak tüylü fırça ve hafif fırçalama tekniği uygulayın. Asidik içeceklerden sonra 30 dakika bekleyip fırçalayın. Diş hekiminizden flüorür verniği uygulatın. Diş sıkıyorsanız gece plağı kullanın. İlerlemiş diş eti çekilmesinde periodontoloji uzmanına başvurun.\n\nHassasiyet ani başlıyorsa veya tek bir dişte yoğunlaşıyorsa çürük ya da kırık olabilir. Vakit kaybetmeden diş hekiminize görünün." }
        };

        db.SiteAyarlari.AddRange(
            new SiteAyar { Bolum = "iletisim",  Icerik = System.Text.Json.JsonSerializer.Serialize(iletisim,  opts) },
            new SiteAyar { Bolum = "doktorlar", Icerik = System.Text.Json.JsonSerializer.Serialize(doktorlar, opts) },
            new SiteAyar { Bolum = "hizmetler", Icerik = System.Text.Json.JsonSerializer.Serialize(hizmetler, opts) },
            new SiteAyar { Bolum = "makaleler", Icerik = System.Text.Json.JsonSerializer.Serialize(makaleler, opts) }
        );
        db.SaveChanges();
        Console.WriteLine("Site ayarları oluşturuldu.");
    }

    // ── Lablar (tanımlı lab listesi) ─────────────────────────────────
    if (!db.Lablar.Any())
    {
        db.Lablar.AddRange(
            new Lab { Ad = "Yıldız Dental Lab",   Telefon = "0212 555 01 01", Notlar = "Kron ve köprü uzmanı",       Aktif = true },
            new Lab { Ad = "ProDent Protez Merkezi", Telefon = "0216 444 02 02", Notlar = "Tam ve bölümlü protez",   Aktif = true },
            new Lab { Ad = "DigiDent CAD/CAM",     Telefon = "0212 333 03 03", Notlar = "Zirkon ve e.max kaplamar", Aktif = true }
        );
        db.SaveChanges();
        Console.WriteLine("Örnek lablar eklendi.");
    }

    // ── Lab Takibi (örnek siparişler) ────────────────────────────────
    if (!db.LabTakibi.Any())
    {
        var bugun   = DateOnly.FromDateTime(DateTime.UtcNow);
        var doktor1 = db.Calisanlar.FirstOrDefault();
        var doktor2 = db.Calisanlar.Skip(1).FirstOrDefault();

        db.LabTakibi.AddRange(
            new LabTakibi { LabAdi = "Yıldız Dental Lab",    Tur = "Kron",    DoktorId = doktor1?.Id, GonderimTarihi = bugun.AddDays(-12), TahminiTeslim = bugun.AddDays(-5),  Durum = "Lab'da",          Notlar = "A2 rengi, metal destekli",   Ucret = 1200m, OlusturulmaTarihi = DateTime.UtcNow },
            new LabTakibi { LabAdi = "ProDent Protez Merkezi", Tur = "Köprü",  DoktorId = doktor2?.Id, GonderimTarihi = bugun.AddDays(-7),  TahminiTeslim = bugun.AddDays(3),   Durum = "Gönderildi",      Notlar = "3 üyeli köprü, zirkon",      Ucret = 2800m, OlusturulmaTarihi = DateTime.UtcNow },
            new LabTakibi { LabAdi = "DigiDent CAD/CAM",      Tur = "Veneer", DoktorId = doktor1?.Id, GonderimTarihi = bugun.AddDays(-20), TahminiTeslim = bugun.AddDays(-3),  Durum = "Klinikte",        Notlar = "6 adet üst ön veneer, B1",   Ucret = 4500m, GercekTeslim = bugun.AddDays(-1), OlusturulmaTarihi = DateTime.UtcNow },
            new LabTakibi { LabAdi = "Yıldız Dental Lab",    Tur = "Protez", DoktorId = doktor2?.Id, GonderimTarihi = bugun.AddDays(-30), TahminiTeslim = bugun.AddDays(-15), Durum = "Hastaya Verildi", Notlar = "Tam üst protez",             Ucret = 1800m, GercekTeslim = bugun.AddDays(-14), OlusturulmaTarihi = DateTime.UtcNow }
        );
        db.SaveChanges();
        Console.WriteLine("Örnek lab takibi kayıtları eklendi.");
    }
}

// -------------------------------------------------------------------
// MIDDLEWARE (sıralama önemli!)
// -------------------------------------------------------------------

app.UseCors("AllowReactApp");
app.UseAuthentication(); // Önce kimliği doğrula...
app.UseAuthorization();  // ...sonra yetkilendir

// -------------------------------------------------------------------
// ENDPOINT'LER
// -------------------------------------------------------------------

app.MapGet("/api/health", () =>
    Results.Ok(new { status = "ok", message = "DentApp API çalışıyor!", time = DateTime.Now.ToString("HH:mm:ss") }));

// -------------------------------------------------------------------
// SİTE AYARLARI — public site içerik yönetimi
// -------------------------------------------------------------------

// Tüm bölümleri tek seferde döndür (public)
app.MapGet("/api/site-ayarlari", async (AppDbContext db) =>
{
    var ayarlar = await db.SiteAyarlari.ToListAsync();
    var parts   = ayarlar.Select(a => $"\"{a.Bolum}\": {a.Icerik}");
    var json    = "{" + string.Join(",", parts) + "}";
    return Results.Content(json, "application/json");
});

// Belirli bir bölümü güncelle (admin)
app.MapPut("/api/site-ayarlari/{bolum}", async (
    string bolum,
    System.Text.Json.JsonElement body,
    AppDbContext db) =>
{
    var icerik = body.GetRawText();
    var ayar   = await db.SiteAyarlari.FirstOrDefaultAsync(a => a.Bolum == bolum);
    if (ayar is null)
        db.SiteAyarlari.Add(new SiteAyar { Bolum = bolum, Icerik = icerik });
    else
        ayar.Icerik = icerik;
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Güncellendi." });
}).RequireAuthorization("AdminOnly");

// KAYIT OL
// POST /api/auth/register  →  Body: { fullName, email, password }
app.MapPost("/api/auth/register", async (RegisterRequest req, AppDbContext db) =>
{
    // Aynı email ile kayıt var mı?
    var emailKullaniliyor = await db.Users.AnyAsync(u => u.Email == req.Email);
    if (emailKullaniliyor)
        return Results.BadRequest(new { message = "Bu e-posta adresi zaten kayıtlı." });

    // Şifreyi hash'le — düz metin asla saklanmaz
    var hash = BCrypt.Net.BCrypt.HashPassword(req.Password);

    var user = new User
    {
        FullName     = req.FullName,
        Email        = req.Email,
        PasswordHash = hash
    };

    db.Users.Add(user);
    await db.SaveChangesAsync();

    return Results.Ok(new { message = "Kayıt başarılı." });
});

// GİRİŞ YAP
// POST /api/auth/login  →  Body: { email, password }
app.MapPost("/api/auth/login", async (LoginRequest req, AppDbContext db) =>
{
    // Kullanıcıyı e-posta ile bul
    var user = await db.Users.SingleOrDefaultAsync(u => u.Email == req.Email);
    if (user is null)
        return Results.Unauthorized();

    // Gönderilen şifre, kayıtlı hash ile eşleşiyor mu?
    var sifreGecerli = BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash);
    if (!sifreGecerli)
        return Results.Unauthorized();

    // JWT token oluştur
    var token = TokenOlustur(user, secretKey, issuer, audience,
                    int.Parse(jwtSettings["ExpiresInMinutes"]!));

    return Results.Ok(new AuthResponse(token, user.FullName, user.Role));
});

// ŞİFRE DEĞİŞTİR
// PUT /api/auth/sifre-degistir  →  Body: { mevcutSifre, yeniSifre }
app.MapPut("/api/auth/sifre-degistir", async (SifreDegistirDto dto, AppDbContext db, ClaimsPrincipal aktifKullanici) =>
{
    var userId = int.Parse(aktifKullanici.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    var user   = await db.Users.FindAsync(userId);
    if (user is null) return Results.Unauthorized();

    if (!BCrypt.Net.BCrypt.Verify(dto.MevcutSifre, user.PasswordHash))
        return Results.BadRequest(new { message = "Mevcut şifre hatalı." });

    if (dto.YeniSifre.Length < 6)
        return Results.BadRequest(new { message = "Yeni şifre en az 6 karakter olmalıdır." });

    user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.YeniSifre);
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Şifre başarıyla güncellendi." });
}).RequireAuthorization();

// Giriş yapmış kullanıcının profilini döndür (DB'den güncel veri)
app.MapGet("/api/auth/me", async (AppDbContext db, ClaimsPrincipal aktifKullanici) =>
{
    var userId = int.Parse(aktifKullanici.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    var user   = await db.Users.FindAsync(userId);
    if (user is null) return Results.Unauthorized();
    return Results.Ok(new
    {
        id        = user.Id,
        fullName  = user.FullName,
        email     = user.Email,
        role      = user.Role,
        createdAt = user.CreatedAt,
    });
}).RequireAuthorization();

// Profil güncelle (ad + e-posta)
app.MapPut("/api/auth/profil", async (ProfilGuncelleDto dto, AppDbContext db, ClaimsPrincipal aktifKullanici) =>
{
    var userId = int.Parse(aktifKullanici.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    var user   = await db.Users.FindAsync(userId);
    if (user is null) return Results.Unauthorized();

    if (string.IsNullOrWhiteSpace(dto.FullName) || string.IsNullOrWhiteSpace(dto.Email))
        return Results.BadRequest(new { message = "Ad ve e-posta boş olamaz." });

    var emailKullaniliyor = await db.Users.AnyAsync(u => u.Email == dto.Email && u.Id != userId);
    if (emailKullaniliyor)
        return Results.BadRequest(new { message = "Bu e-posta başka bir hesaba ait." });

    user.FullName = dto.FullName.Trim();
    user.Email    = dto.Email.Trim().ToLower();
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Profil güncellendi.", fullName = user.FullName, email = user.Email });
}).RequireAuthorization();

// -------------------------------------------------------------------
// STOK TAKİBİ ENDPOINT'LERİ
// -------------------------------------------------------------------

// Tüm kalemleri listele
app.MapGet("/api/stok", async (AppDbContext db) =>
{
    var kalemler = await db.StokKalemleri
        .OrderBy(k => k.UrunAdi)
        .Select(k => new StokKalemiDto(
            k.Id, k.UrunAdi, k.Kategori, k.Birim,
            k.Miktar, k.MinimumMiktar, k.BirimFiyat,
            k.Miktar < k.MinimumMiktar,   // DusukStok hesabı
            k.SonGuncelleme))
        .ToListAsync();

    return Results.Ok(kalemler);
}).RequireAuthorization();

// Yeni kalem ekle
app.MapPost("/api/stok", async (StokKalemiEkleDto dto, AppDbContext db) =>
{
    var kalem = new StokKalemi
    {
        UrunAdi       = dto.UrunAdi,
        Kategori      = dto.Kategori,
        Birim         = dto.Birim,
        Miktar        = dto.Miktar,
        MinimumMiktar = dto.MinimumMiktar,
        BirimFiyat    = dto.BirimFiyat,
        SonGuncelleme = DateTime.UtcNow
    };

    db.StokKalemleri.Add(kalem);
    await db.SaveChangesAsync();

    return Results.Created($"/api/stok/{kalem.Id}", kalem.Id);
}).RequireAuthorization();

// Kalem güncelle
app.MapPut("/api/stok/{id:int}", async (int id, StokGuncelleDto dto, AppDbContext db) =>
{
    var kalem = await db.StokKalemleri.FindAsync(id);
    if (kalem is null) return Results.NotFound();

    kalem.UrunAdi       = dto.UrunAdi;
    kalem.Kategori      = dto.Kategori;
    kalem.Birim         = dto.Birim;
    kalem.Miktar        = dto.Miktar;
    kalem.MinimumMiktar = dto.MinimumMiktar;
    kalem.BirimFiyat    = dto.BirimFiyat;
    kalem.SonGuncelleme = DateTime.UtcNow;

    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

// Kalem sil
app.MapDelete("/api/stok/{id:int}", async (int id, AppDbContext db) =>
{
    var kalem = await db.StokKalemleri.FindAsync(id);
    if (kalem is null) return Results.NotFound();

    db.StokKalemleri.Remove(kalem);
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

// -------------------------------------------------------------------
// FİYAT HESAPLAMA — TEDAVİ ENDPOINT'LERİ
// -------------------------------------------------------------------

app.MapGet("/api/tedaviler", async (AppDbContext db) =>
{
    var liste = await db.Tedaviler
        .OrderBy(t => t.Kategori).ThenBy(t => t.Ad)
        .Select(t => new TedaviDto(t.Id, t.Ad, t.Kategori, t.TemelFiyat))
        .ToListAsync();
    return Results.Ok(liste);
}).RequireAuthorization();

app.MapPost("/api/tedaviler", async (TedaviKaydetDto dto, AppDbContext db) =>
{
    var tedavi = new Tedavi { Ad = dto.Ad, Kategori = dto.Kategori, TemelFiyat = dto.TemelFiyat };
    db.Tedaviler.Add(tedavi);
    await db.SaveChangesAsync();
    return Results.Created($"/api/tedaviler/{tedavi.Id}", new TedaviDto(tedavi.Id, tedavi.Ad, tedavi.Kategori, tedavi.TemelFiyat));
}).RequireAuthorization();

app.MapPut("/api/tedaviler/{id:int}", async (int id, TedaviKaydetDto dto, AppDbContext db) =>
{
    var tedavi = await db.Tedaviler.FindAsync(id);
    if (tedavi is null) return Results.NotFound();
    tedavi.Ad = dto.Ad; tedavi.Kategori = dto.Kategori; tedavi.TemelFiyat = dto.TemelFiyat;
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

app.MapDelete("/api/tedaviler/{id:int}", async (int id, AppDbContext db) =>
{
    var tedavi = await db.Tedaviler.FindAsync(id);
    if (tedavi is null) return Results.NotFound();
    db.Tedaviler.Remove(tedavi);
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

// -------------------------------------------------------------------
// NÖBET / VARDİYA ENDPOINT'LERİ
// -------------------------------------------------------------------

// Tüm çalışanlar
app.MapGet("/api/calisanlar", async (AppDbContext db) =>
    Results.Ok(await db.Calisanlar.OrderBy(c => c.AdSoyad)
        .Select(c => new CalisanDto(c.Id, c.AdSoyad, c.Unvan, c.Renk)).ToListAsync())
).RequireAuthorization();

app.MapPost("/api/calisanlar", async (CalisanKaydetDto dto, AppDbContext db) =>
{
    var c = new Calisan { AdSoyad = dto.AdSoyad, Unvan = dto.Unvan, Renk = dto.Renk };
    db.Calisanlar.Add(c);
    await db.SaveChangesAsync();
    return Results.Created($"/api/calisanlar/{c.Id}", new CalisanDto(c.Id, c.AdSoyad, c.Unvan, c.Renk));
}).RequireAuthorization();

app.MapPut("/api/calisanlar/{id:int}", async (int id, CalisanKaydetDto dto, AppDbContext db) =>
{
    var c = await db.Calisanlar.FindAsync(id);
    if (c is null) return Results.NotFound();
    c.AdSoyad = dto.AdSoyad; c.Unvan = dto.Unvan; c.Renk = dto.Renk;
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

app.MapDelete("/api/calisanlar/{id:int}", async (int id, AppDbContext db) =>
{
    var c = await db.Calisanlar.FindAsync(id);
    if (c is null) return Results.NotFound();
    db.Calisanlar.Remove(c);
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

// Tarih aralığına göre vardiyalar — frontend "baslangic" ve "bitis" query param gönderir
app.MapGet("/api/vardiyalar", async (string baslangic, string bitis, AppDbContext db) =>
{
    var bas = DateOnly.Parse(baslangic);
    var bit = DateOnly.Parse(bitis);

    var liste = await db.Vardiyalar
        .Include(v => v.Calisan)   // navigation property: Calisan bilgisini JOIN ile getir
        .Where(v => v.Tarih >= bas && v.Tarih <= bit)
        .OrderBy(v => v.Tarih)
        .Select(v => new VardiyaDto(
            v.Id, v.CalisanId, v.Calisan.AdSoyad, v.Calisan.Renk,
            v.Tarih.ToString("yyyy-MM-dd"), v.Tur, v.Not))
        .ToListAsync();

    return Results.Ok(liste);
}).RequireAuthorization();

app.MapPost("/api/vardiyalar", async (VardiyaEkleDto dto, AppDbContext db) =>
{
    var varlik = await db.Vardiyalar.AnyAsync(v =>
        v.CalisanId == dto.CalisanId &&
        v.Tarih == DateOnly.Parse(dto.Tarih) &&
        v.Tur == dto.Tur);

    if (varlik) return Results.BadRequest(new { message = "Bu çalışana aynı gün ve vardiya türü zaten atanmış." });

    var v = new Vardiya
    {
        CalisanId = dto.CalisanId,
        Tarih     = DateOnly.Parse(dto.Tarih),
        Tur       = dto.Tur,
        Not       = dto.Not
    };
    db.Vardiyalar.Add(v);
    await db.SaveChangesAsync();
    return Results.Created($"/api/vardiyalar/{v.Id}", v.Id);
}).RequireAuthorization();

app.MapDelete("/api/vardiyalar/{id:int}", async (int id, AppDbContext db) =>
{
    var v = await db.Vardiyalar.FindAsync(id);
    if (v is null) return Results.NotFound();
    db.Vardiyalar.Remove(v);
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

// -------------------------------------------------------------------
// KULLANICI YÖNETİMİ — Sadece Admin erişebilir
// -------------------------------------------------------------------

// Tüm kullanıcıları listele
app.MapGet("/api/kullanicilar", async (AppDbContext db) =>
{
    var liste = await db.Users
        .Include(u => u.Calisan)
        .OrderBy(u => u.FullName)
        .Select(u => new KullaniciDto(u.Id, u.FullName, u.Email, u.Role, u.CreatedAt,
            u.CalisanId, u.Calisan != null ? u.Calisan.AdSoyad : null))
        .ToListAsync();
    return Results.Ok(liste);
}).RequireAuthorization("AdminOnly");

// Yeni kullanıcı oluştur (Admin, staff hesabı açar)
app.MapPost("/api/kullanicilar", async (KullaniciOlusturDto dto, AppDbContext db) =>
{
    var emailVar = await db.Users.AnyAsync(u => u.Email == dto.Email);
    if (emailVar) return Results.BadRequest(new { message = "Bu e-posta zaten kayıtlı." });

    var kullanici = new User
    {
        FullName     = dto.FullName,
        Email        = dto.Email,
        PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
        Role         = dto.Role,
        CalisanId    = dto.CalisanId,
    };
    db.Users.Add(kullanici);
    await db.SaveChangesAsync();
    return Results.Created($"/api/kullanicilar/{kullanici.Id}",
        new KullaniciDto(kullanici.Id, kullanici.FullName, kullanici.Email, kullanici.Role, kullanici.CreatedAt, kullanici.CalisanId, null));
}).RequireAuthorization("AdminOnly");

// Ad ve rol güncelle
app.MapPut("/api/kullanicilar/{id:int}", async (int id, KullaniciGuncelleDto dto, AppDbContext db, ClaimsPrincipal istekci) =>
{
    var kullanici = await db.Users.FindAsync(id);
    if (kullanici is null) return Results.NotFound();

    // Admin kendini Staff'a düşüremesin
    var istekciId = int.Parse(istekci.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    if (istekciId == id && dto.Role != "Admin")
        return Results.BadRequest(new { message = "Kendi rolünüzü değiştiremezsiniz." });

    kullanici.FullName  = dto.FullName;
    kullanici.Role      = dto.Role;
    kullanici.CalisanId = dto.CalisanId;
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization("AdminOnly");

// Kullanıcı sil
app.MapDelete("/api/kullanicilar/{id:int}", async (int id, AppDbContext db, ClaimsPrincipal istekci) =>
{
    var kullanici = await db.Users.FindAsync(id);
    if (kullanici is null) return Results.NotFound();

    // Admin kendini silemez
    var istekciId = int.Parse(istekci.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    if (istekciId == id) return Results.BadRequest(new { message = "Kendi hesabınızı silemezsiniz." });

    db.Users.Remove(kullanici);
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization("AdminOnly");

// -------------------------------------------------------------------
// GELİR / GİDER ENDPOINT'LERİ
// -------------------------------------------------------------------

// Belirli ay/yıl için işlem listesi  GET /api/gelir-gider?yil=2025&ay=6
app.MapGet("/api/gelir-gider", async (int yil, int ay, AppDbContext db) =>
{
    var liste = await db.GelirGiderler
        .Where(g => g.Tarih.Year == yil && g.Tarih.Month == ay)
        .OrderByDescending(g => g.Tarih)
        .Select(g => new GelirGiderDto(g.Id, g.Tur, g.Kategori, g.Miktar, g.Tarih.ToString("yyyy-MM-dd"), g.Aciklama))
        .ToListAsync();
    return Results.Ok(liste);
}).RequireAuthorization();

// Yıllık özet — her ay gelir/gider toplamı  GET /api/gelir-gider/yillik?yil=2025
app.MapGet("/api/gelir-gider/yillik", async (int yil, AppDbContext db) =>
{
    string[] ayAdlari = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];

    var kayitlar = await db.GelirGiderler
        .Where(g => g.Tarih.Year == yil)
        .ToListAsync();

    // Her ay için gelir ve gider topla; kayıt yoksa 0 döner
    var ozet = Enumerable.Range(1, 12).Select(ay => {
        var gelir = kayitlar.Where(g => g.Tarih.Month == ay && g.Tur == "Gelir").Sum(g => g.Miktar);
        var gider = kayitlar.Where(g => g.Tarih.Month == ay && g.Tur == "Gider").Sum(g => g.Miktar);
        return new AylikOzetDto(ay, ayAdlari[ay - 1], gelir, gider, gelir - gider);
    }).ToList();

    return Results.Ok(ozet);
}).RequireAuthorization();

// Kategori dağılımı  GET /api/gelir-gider/kategoriler?yil=2025&ay=6
app.MapGet("/api/gelir-gider/kategoriler", async (int yil, int ay, AppDbContext db) =>
{
    var liste = await db.GelirGiderler
        .Where(g => g.Tarih.Year == yil && g.Tarih.Month == ay)
        .GroupBy(g => new { g.Kategori, g.Tur })
        .Select(g => new KategoriOzetDto(g.Key.Kategori, g.Key.Tur, g.Sum(x => x.Miktar)))
        .ToListAsync();
    return Results.Ok(liste);
}).RequireAuthorization();

// Yeni kayıt ekle
app.MapPost("/api/gelir-gider", async (GelirGiderEkleDto dto, AppDbContext db) =>
{
    var kayit = new GelirGider
    {
        Tur      = dto.Tur,
        Kategori = dto.Kategori,
        Miktar   = dto.Miktar,
        Tarih    = DateOnly.Parse(dto.Tarih),
        Aciklama = dto.Aciklama
    };
    db.GelirGiderler.Add(kayit);
    await db.SaveChangesAsync();
    return Results.Created($"/api/gelir-gider/{kayit.Id}", kayit.Id);
}).RequireAuthorization();

// Kayıt sil
app.MapDelete("/api/gelir-gider/{id:int}", async (int id, AppDbContext db) =>
{
    var kayit = await db.GelirGiderler.FindAsync(id);
    if (kayit is null) return Results.NotFound();
    db.GelirGiderler.Remove(kayit);
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

// -------------------------------------------------------------------
// RANDEVU TALEPLERİ ENDPOINT'LERİ
// -------------------------------------------------------------------

// Yeni talep oluştur — public (token gerekmez, web sitesi formundan gelir)
app.MapPost("/api/randevu-talepleri", async (RandevuTalebiEkleDto dto, AppDbContext db) =>
{
    var talep = new RandevuTalebi
    {
        AdSoyad           = dto.AdSoyad,
        Telefon           = dto.Telefon,
        TercihTarih       = dto.TercihTarih,
        OlusturulmaTarihi = DateTime.UtcNow,
    };
    db.RandevuTalepleri.Add(talep);
    await db.SaveChangesAsync();
    return Results.Created($"/api/randevu-talepleri/{talep.Id}", talep.Id);
});

// Tüm talepleri listele — korumalı
app.MapGet("/api/randevu-talepleri", async (AppDbContext db) =>
{
    var liste = await db.RandevuTalepleri
        .Include(t => t.GorusenCalisan)
        .OrderByDescending(t => t.OlusturulmaTarihi)
        .Select(t => new RandevuTalebiDto(
            t.Id, t.AdSoyad, t.Telefon, t.TercihTarih,
            t.Durum, t.GorusenCalisanId,
            t.GorusenCalisan != null ? t.GorusenCalisan.AdSoyad : null,
            t.IptalSebebi, t.OlusturulmaTarihi))
        .ToListAsync();
    return Results.Ok(liste);
}).RequireAuthorization();

// Durum güncelle — korumalı
app.MapPut("/api/randevu-talepleri/{id:int}/durum", async (int id, RandevuDurumGuncelleDto dto, AppDbContext db) =>
{
    var talep = await db.RandevuTalepleri.FindAsync(id);
    if (talep is null) return Results.NotFound();

    talep.Durum            = dto.Durum;
    talep.GorusenCalisanId = dto.GorusenCalisanId;
    talep.IptalSebebi      = dto.IptalSebebi;

    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

// Talep sil — korumalı
app.MapDelete("/api/randevu-talepleri/{id:int}", async (int id, AppDbContext db) =>
{
    var talep = await db.RandevuTalepleri.FindAsync(id);
    if (talep is null) return Results.NotFound();
    db.RandevuTalepleri.Remove(talep);
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

// -------------------------------------------------------------------
// GÖREVLER ENDPOINT'LERİ
// -------------------------------------------------------------------

app.MapGet("/api/gorevler", async (AppDbContext db, ClaimsPrincipal aktifKullanici) =>
{
    var isAdmin = aktifKullanici.IsInRole("Admin");
    IQueryable<Gorev> sorgu = db.Gorevler.Include(g => g.AtananCalisan);

    if (!isAdmin)
    {
        var userId  = int.Parse(aktifKullanici.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var user    = await db.Users.FindAsync(userId);
        if (user?.CalisanId == null) return Results.Ok(Array.Empty<GorevDto>());
        sorgu = sorgu.Where(g => g.AtananCalisanId == user.CalisanId);
    }

    var liste = await sorgu
        .OrderBy(g => g.Durum)
        .ThenByDescending(g => g.OlusturulmaTarihi)
        .Select(g => new GorevDto(
            g.Id, g.Baslik, g.Aciklama, g.Oncelik, g.Durum, g.SonTarih,
            g.AtananCalisanId,
            g.AtananCalisan != null ? g.AtananCalisan.AdSoyad : null,
            g.OlusturulmaTarihi,
            g.AtanmaTarihi, g.BaslamaTarihi, g.TamamlanmaTarihi))
        .ToListAsync();
    return Results.Ok(liste);
}).RequireAuthorization();

app.MapPost("/api/gorevler", async (GorevEkleDto dto, AppDbContext db) =>
{
    var gorev = new Gorev
    {
        Baslik            = dto.Baslik,
        Aciklama          = dto.Aciklama,
        Oncelik           = dto.Oncelik,
        SonTarih          = dto.SonTarih,
        AtananCalisanId   = dto.AtananCalisanId,
        OlusturulmaTarihi = DateTime.UtcNow,
        AtanmaTarihi      = dto.AtananCalisanId.HasValue ? DateTime.UtcNow : null,
    };
    db.Gorevler.Add(gorev);
    await db.SaveChangesAsync();
    return Results.Created($"/api/gorevler/{gorev.Id}", gorev.Id);
}).RequireAuthorization();

app.MapPut("/api/gorevler/{id:int}/durum", async (int id, GorevDurumDto dto, AppDbContext db) =>
{
    var gorev = await db.Gorevler.FindAsync(id);
    if (gorev is null) return Results.NotFound();
    gorev.Durum = dto.Durum;
    if (dto.Durum == "Devam Ediyor" && gorev.BaslamaTarihi is null)
        gorev.BaslamaTarihi = DateTime.UtcNow;
    if (dto.Durum == "Tamamlandı" && gorev.TamamlanmaTarihi is null)
        gorev.TamamlanmaTarihi = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

app.MapPut("/api/gorevler/{id:int}", async (int id, GorevGuncelleDto dto, AppDbContext db) =>
{
    var gorev = await db.Gorevler.FindAsync(id);
    if (gorev is null) return Results.NotFound();
    bool yeniAtama = dto.AtananCalisanId.HasValue && dto.AtananCalisanId != gorev.AtananCalisanId;
    gorev.Baslik          = dto.Baslik;
    gorev.Aciklama        = dto.Aciklama;
    gorev.Oncelik         = dto.Oncelik;
    gorev.SonTarih        = dto.SonTarih;
    gorev.AtananCalisanId = dto.AtananCalisanId;
    if (yeniAtama) gorev.AtanmaTarihi = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization("AdminOnly");

app.MapDelete("/api/gorevler/{id:int}", async (int id, AppDbContext db) =>
{
    var gorev = await db.Gorevler.FindAsync(id);
    if (gorev is null) return Results.NotFound();
    db.Gorevler.Remove(gorev);
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

// -------------------------------------------------------------------
// İŞLEM KAYITLARI ENDPOINT'LERİ
// -------------------------------------------------------------------

// Belirli güne ait kayıtlar  GET /api/islem-kayitlari?tarih=2026-06-15
app.MapGet("/api/islem-kayitlari", async (string? tarih, AppDbContext db) =>
{
    var gun = tarih != null
        ? DateOnly.Parse(tarih)
        : DateOnly.FromDateTime(DateTime.UtcNow);

    var bas = DateTime.SpecifyKind(gun.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
    var bit = DateTime.SpecifyKind(gun.ToDateTime(TimeOnly.MaxValue), DateTimeKind.Utc);

    var liste = await db.IslemKayitlari
        .Include(k => k.Doktor)
        .Include(k => k.Tedavi)
        .Where(k => k.Tarih >= bas && k.Tarih <= bit)
        .OrderByDescending(k => k.Tarih)
        .Select(k => new IslemKaydiDto(
            k.Id, k.DoktorId, k.Doktor!.AdSoyad,
            k.TedaviId, k.Tedavi!.Ad, k.Tedavi!.Kategori,
            k.OdemeYontemi, k.SistemFiyati, k.FarkliTutar, k.OdenenTutar, k.Notlar, k.Tarih))
        .ToListAsync();
    return Results.Ok(liste);
}).RequireAuthorization();

// Yeni kayıt ekle — aynı anda GelirGider satırı da oluşturur
app.MapPost("/api/islem-kayitlari", async (IslemKaydiEkleDto dto, AppDbContext db) =>
{
    var tedavi = await db.Tedaviler.FindAsync(dto.TedaviId);
    var doktor = await db.Calisanlar.FindAsync(dto.DoktorId);
    if (tedavi is null) return Results.BadRequest(new { message = "Tedavi bulunamadı." });
    if (doktor is null) return Results.BadRequest(new { message = "Doktor bulunamadı." });

    var efektifTutar = dto.FarkliTutar && dto.OdenenTutar.HasValue
        ? dto.OdenenTutar.Value
        : tedavi.TemelFiyat;

    // Gelir/Gider tablosuna otomatik satır
    var gelirKaydi = new GelirGider
    {
        Tur      = "Gelir",
        Kategori = "Tedavi Geliri",
        Miktar   = efektifTutar,
        Tarih    = DateOnly.FromDateTime(DateTime.UtcNow),
        Aciklama = $"{tedavi.Ad} — {doktor.AdSoyad} ({dto.OdemeYontemi})",
    };
    db.GelirGiderler.Add(gelirKaydi);
    await db.SaveChangesAsync(); // önce ID üret

    var kayit = new IslemKaydi
    {
        DoktorId     = dto.DoktorId,
        TedaviId     = dto.TedaviId,
        OdemeYontemi = dto.OdemeYontemi,
        SistemFiyati = tedavi.TemelFiyat,
        FarkliTutar  = dto.FarkliTutar,
        OdenenTutar  = dto.FarkliTutar ? dto.OdenenTutar : null,
        Notlar       = dto.FarkliTutar ? dto.Notlar       : null,
        Tarih        = DateTime.UtcNow,
        GelirGiderId = gelirKaydi.Id,
    };
    db.IslemKayitlari.Add(kayit);
    await db.SaveChangesAsync();
    return Results.Created($"/api/islem-kayitlari/{kayit.Id}", kayit.Id);
}).RequireAuthorization();

// Kayıt sil — bağlı GelirGider satırını da siler (sadece Admin)
app.MapDelete("/api/islem-kayitlari/{id:int}", async (int id, AppDbContext db) =>
{
    var kayit = await db.IslemKayitlari.FindAsync(id);
    if (kayit is null) return Results.NotFound();

    if (kayit.GelirGiderId.HasValue)
    {
        var gelirKaydi = await db.GelirGiderler.FindAsync(kayit.GelirGiderId.Value);
        if (gelirKaydi is not null) db.GelirGiderler.Remove(gelirKaydi);
    }

    db.IslemKayitlari.Remove(kayit);
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization("AdminOnly");

// ─────────────────────────────────────────────────────────────────────────────
// LABLAR
// ─────────────────────────────────────────────────────────────────────────────

app.MapGet("/api/lablar", async (AppDbContext db) =>
    Results.Ok(await db.Lablar.OrderBy(l => l.Ad)
        .Select(l => new LabDto(l.Id, l.Ad, l.Telefon, l.Notlar, l.Aktif))
        .ToListAsync())
).RequireAuthorization();

app.MapPost("/api/lablar", async (LabKaydetDto dto, AppDbContext db) =>
{
    var lab = new Lab { Ad = dto.Ad, Telefon = dto.Telefon, Notlar = dto.Notlar };
    db.Lablar.Add(lab);
    await db.SaveChangesAsync();
    return Results.Created($"/api/lablar/{lab.Id}", new LabDto(lab.Id, lab.Ad, lab.Telefon, lab.Notlar, lab.Aktif));
}).RequireAuthorization("AdminOnly");

app.MapPut("/api/lablar/{id:int}", async (int id, LabKaydetDto dto, AppDbContext db) =>
{
    var lab = await db.Lablar.FindAsync(id);
    if (lab is null) return Results.NotFound();
    lab.Ad = dto.Ad; lab.Telefon = dto.Telefon; lab.Notlar = dto.Notlar;
    await db.SaveChangesAsync();
    return Results.Ok(new LabDto(lab.Id, lab.Ad, lab.Telefon, lab.Notlar, lab.Aktif));
}).RequireAuthorization("AdminOnly");

app.MapPut("/api/lablar/{id:int}/aktif", async (int id, AppDbContext db) =>
{
    var lab = await db.Lablar.FindAsync(id);
    if (lab is null) return Results.NotFound();
    lab.Aktif = !lab.Aktif;
    await db.SaveChangesAsync();
    return Results.Ok(new LabDto(lab.Id, lab.Ad, lab.Telefon, lab.Notlar, lab.Aktif));
}).RequireAuthorization("AdminOnly");

app.MapDelete("/api/lablar/{id:int}", async (int id, AppDbContext db) =>
{
    var lab = await db.Lablar.FindAsync(id);
    if (lab is null) return Results.NotFound();
    db.Lablar.Remove(lab);
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization("AdminOnly");

// ─────────────────────────────────────────────────────────────────────────────
// LAB TAKİBİ
// ─────────────────────────────────────────────────────────────────────────────

app.MapGet("/api/lab-takibi", async (AppDbContext db) =>
{
    var liste = await db.LabTakibi
        .Include(l => l.Doktor)
        .OrderByDescending(l => l.OlusturulmaTarihi)
        .Select(l => new LabTakibiDto(
            l.Id, l.LabAdi, l.Tur,
            l.DoktorId, l.Doktor != null ? l.Doktor.AdSoyad : null,
            l.GonderimTarihi.ToString("yyyy-MM-dd"),
            l.TahminiTeslim.ToString("yyyy-MM-dd"),
            l.GercekTeslim.HasValue ? l.GercekTeslim.Value.ToString("yyyy-MM-dd") : null,
            l.Durum, l.Notlar, l.Ucret, l.OlusturulmaTarihi))
        .ToListAsync();
    return Results.Ok(liste);
}).RequireAuthorization();

app.MapPost("/api/lab-takibi", async (LabTakibiEkleDto dto, AppDbContext db) =>
{
    var kayit = new LabTakibi
    {
        LabAdi         = dto.LabAdi,
        Tur            = dto.Tur,
        DoktorId       = dto.DoktorId,
        GonderimTarihi = DateOnly.Parse(dto.GonderimTarihi),
        TahminiTeslim  = DateOnly.Parse(dto.TahminiTeslim),
        Notlar         = dto.Notlar,
        Ucret          = dto.Ucret,
        Durum          = "Gönderildi",
        OlusturulmaTarihi = DateTime.UtcNow,
    };
    db.LabTakibi.Add(kayit);
    await db.SaveChangesAsync();
    return Results.Created($"/api/lab-takibi/{kayit.Id}", kayit.Id);
}).RequireAuthorization();

app.MapPut("/api/lab-takibi/{id:int}", async (int id, LabTakibiGuncelleDto dto, AppDbContext db) =>
{
    var kayit = await db.LabTakibi.FindAsync(id);
    if (kayit is null) return Results.NotFound();
    kayit.LabAdi        = dto.LabAdi;
    kayit.Tur           = dto.Tur;
    kayit.DoktorId      = dto.DoktorId;
    kayit.GonderimTarihi = DateOnly.Parse(dto.GonderimTarihi);
    kayit.TahminiTeslim  = DateOnly.Parse(dto.TahminiTeslim);
    kayit.GercekTeslim   = dto.GercekTeslim != null ? DateOnly.Parse(dto.GercekTeslim) : null;
    kayit.Durum         = dto.Durum;
    kayit.Notlar        = dto.Notlar;
    kayit.Ucret         = dto.Ucret;
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Güncellendi." });
}).RequireAuthorization();

app.MapPut("/api/lab-takibi/{id:int}/durum", async (int id, LabDurumDto dto, AppDbContext db) =>
{
    var kayit = await db.LabTakibi.FindAsync(id);
    if (kayit is null) return Results.NotFound();
    kayit.Durum = dto.Durum;
    if (dto.GercekTeslim != null)
        kayit.GercekTeslim = DateOnly.Parse(dto.GercekTeslim);
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Durum güncellendi." });
}).RequireAuthorization();

app.MapDelete("/api/lab-takibi/{id:int}", async (int id, AppDbContext db) =>
{
    var kayit = await db.LabTakibi.FindAsync(id);
    if (kayit is null) return Results.NotFound();
    db.LabTakibi.Remove(kayit);
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization("AdminOnly");

// Aylık işlem kayıtları — raporlar sayfası için  GET /api/islem-kayitlari/aylik?yil=2026&ay=6
app.MapGet("/api/islem-kayitlari/aylik", async (int yil, int ay, AppDbContext db) =>
{
    var baslangic = new DateTime(yil, ay, 1, 0, 0, 0, DateTimeKind.Utc);
    var bitis     = baslangic.AddMonths(1);

    var liste = await db.IslemKayitlari
        .Include(k => k.Doktor)
        .Include(k => k.Tedavi)
        .Where(k => k.Tarih >= baslangic && k.Tarih < bitis)
        .OrderByDescending(k => k.Tarih)
        .Select(k => new IslemKaydiDto(
            k.Id, k.DoktorId, k.Doktor!.AdSoyad,
            k.TedaviId, k.Tedavi!.Ad, k.Tedavi!.Kategori,
            k.OdemeYontemi, k.SistemFiyati, k.FarkliTutar, k.OdenenTutar, k.Notlar, k.Tarih))
        .ToListAsync();
    return Results.Ok(liste);
}).RequireAuthorization();

app.Run();

// -------------------------------------------------------------------
// YARDIMCI FONKSİYON — JWT Token Oluştur
// -------------------------------------------------------------------

static string TokenOlustur(User user, string secretKey, string issuer, string audience, int expiresInMinutes)
{
    // Claim: token içine gömmek istediğimiz bilgiler
    var claims = new[]
    {
        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new Claim(ClaimTypes.Name,  user.FullName),
        new Claim(ClaimTypes.Email, user.Email),
        new Claim(ClaimTypes.Role,  user.Role)
    };

    var key         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
    var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

    var token = new JwtSecurityToken(
        issuer:             issuer,
        audience:           audience,
        claims:             claims,
        expires:            DateTime.UtcNow.AddMinutes(expiresInMinutes),
        signingCredentials: credentials
    );

    return new JwtSecurityTokenHandler().WriteToken(token);
}
