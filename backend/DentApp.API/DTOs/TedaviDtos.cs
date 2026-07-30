namespace DentApp.API.DTOs;

public record TedaviDto(int Id, string Ad, string Kategori, decimal TemelFiyat);

public record TedaviKaydetDto(string Ad, string Kategori, decimal TemelFiyat);
