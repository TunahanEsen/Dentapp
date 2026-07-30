namespace DentApp.API.DTOs;

record GorevDto(
    int       Id,
    string    Baslik,
    string?   Aciklama,
    string    Oncelik,
    string    Durum,
    string?   SonTarih,
    int?      AtananCalisanId,
    string?   AtananCalisanAd,
    DateTime  OlusturulmaTarihi,
    DateTime? AtanmaTarihi,
    DateTime? BaslamaTarihi,
    DateTime? TamamlanmaTarihi
);

record GorevEkleDto(
    string  Baslik,
    string? Aciklama,
    string  Oncelik,
    string? SonTarih,
    int?    AtananCalisanId
);

record GorevGuncelleDto(
    string  Baslik,
    string? Aciklama,
    string  Oncelik,
    string? SonTarih,
    int?    AtananCalisanId
);

record GorevDurumDto(string Durum);
