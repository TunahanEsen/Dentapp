namespace DentApp.API.DTOs;

public record LabDto(int Id, string Ad, string? Telefon, string? Notlar, bool Aktif);
public record LabKaydetDto(string Ad, string? Telefon, string? Notlar);

public record LabTakibiDto(
    int      Id,
    string   LabAdi,
    string   Tur,
    int?     DoktorId,
    string?  DoktorAd,
    string   GonderimTarihi,
    string   TahminiTeslim,
    string?  GercekTeslim,
    string   Durum,
    string?  Notlar,
    decimal? Ucret,
    DateTime OlusturulmaTarihi
);

public record LabTakibiEkleDto(
    string   LabAdi,
    string   Tur,
    int?     DoktorId,
    string   GonderimTarihi,
    string   TahminiTeslim,
    string?  Notlar,
    decimal? Ucret
);

public record LabTakibiGuncelleDto(
    string   LabAdi,
    string   Tur,
    int?     DoktorId,
    string   GonderimTarihi,
    string   TahminiTeslim,
    string?  GercekTeslim,
    string   Durum,
    string?  Notlar,
    decimal? Ucret
);

public record LabDurumDto(string Durum, string? GercekTeslim);
