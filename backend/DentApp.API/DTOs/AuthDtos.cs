namespace DentApp.API.DTOs;

// Kayıt olurken istemcinin göndereceği veri
public record RegisterRequest(string FullName, string Email, string Password);

// Giriş yaparken istemcinin göndereceği veri
public record LoginRequest(string Email, string Password);

// Başarılı girişte istemciye döndüreceğimiz veri
public record AuthResponse(string Token, string FullName, string Role);

// Şifre değiştirirken istemcinin göndereceği veri
public record SifreDegistirDto(string MevcutSifre, string YeniSifre);

// Profil güncellenirken istemcinin göndereceği veri
public record ProfilGuncelleDto(string FullName, string Email);
