namespace DentApp.API.DTOs;

public record KullaniciDto(int Id, string FullName, string Email, string Role, DateTime CreatedAt, int? CalisanId, string? CalisanAd);

public record KullaniciOlusturDto(string FullName, string Email, string Password, string Role, int? CalisanId);

public record KullaniciGuncelleDto(string FullName, string Role, int? CalisanId);
