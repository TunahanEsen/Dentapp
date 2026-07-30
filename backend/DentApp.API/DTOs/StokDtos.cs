namespace DentApp.API.DTOs;

public record StokKalemiDto(
    int     Id,
    string  UrunAdi,
    string  Kategori,
    string  Birim,
    decimal Miktar,
    decimal MinimumMiktar,
    decimal BirimFiyat,
    bool    DusukStok,        // hesaplanmış alan: Miktar < MinimumMiktar
    DateTime SonGuncelleme
);

public record StokKalemiEkleDto(
    string  UrunAdi,
    string  Kategori,
    string  Birim,
    decimal Miktar,
    decimal MinimumMiktar,
    decimal BirimFiyat
);

public record StokGuncelleDto(
    string  UrunAdi,
    string  Kategori,
    string  Birim,
    decimal Miktar,
    decimal MinimumMiktar,
    decimal BirimFiyat
);
