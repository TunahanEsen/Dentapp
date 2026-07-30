namespace DentApp.API.DTOs;

// Public formdan gelen yeni talep
record RandevuTalebiEkleDto(
    string  AdSoyad,
    string  Telefon,
    string? TercihTarih
);

// Admin panele gönderilen liste öğesi
record RandevuTalebiDto(
    int      Id,
    string   AdSoyad,
    string   Telefon,
    string?  TercihTarih,
    string   Durum,
    int?     GorusenCalisanId,
    string?  GorusenCalisanAd,
    string?  IptalSebebi,
    DateTime OlusturulmaTarihi
);

// Çalışanın durumu güncellemesi
record RandevuDurumGuncelleDto(
    string  Durum,
    int?    GorusenCalisanId,
    string? IptalSebebi
);
