namespace DentApp.API.DTOs;

public record GelirGiderDto(int Id, string Tur, string Kategori, decimal Miktar, string Tarih, string Aciklama);

public record GelirGiderEkleDto(string Tur, string Kategori, decimal Miktar, string Tarih, string Aciklama);

// Grafik için: her ay toplam gelir ve gider
public record AylikOzetDto(int Ay, string AyAdi, decimal Gelir, decimal Gider, decimal Net);

// Kategori dağılımı için
public record KategoriOzetDto(string Kategori, string Tur, decimal Toplam);
