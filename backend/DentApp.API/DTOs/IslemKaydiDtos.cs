namespace DentApp.API.DTOs;

record IslemKaydiDto(
    int      Id,
    int      DoktorId,
    string   DoktorAd,
    int      TedaviId,
    string   TedaviAd,
    string   TedaviKategori,
    string   OdemeYontemi,
    decimal  SistemFiyati,
    bool     FarkliTutar,
    decimal? OdenenTutar,
    string?  Notlar,
    DateTime Tarih
);

record IslemKaydiEkleDto(
    int     DoktorId,
    int     TedaviId,
    string  OdemeYontemi,
    bool    FarkliTutar,
    decimal? OdenenTutar,
    string?  Notlar
);
