namespace DentApp.API.DTOs;

public record CalisanDto(int Id, string AdSoyad, string Unvan, string Renk);
public record CalisanKaydetDto(string AdSoyad, string Unvan, string Renk);

public record VardiyaDto(int Id, int CalisanId, string CalisanAd, string CalisanRenk, string Tarih, string Tur, string Not);
public record VardiyaEkleDto(int CalisanId, string Tarih, string Tur, string Not);
