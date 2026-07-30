namespace DentApp.API.Models;

public class RandevuTalebi
{
    public int     Id                 { get; set; }
    public string  AdSoyad            { get; set; } = string.Empty;
    public string  Telefon            { get; set; } = string.Empty;
    public string? TercihTarih        { get; set; }  // "yyyy-MM-dd" formatında
    public string  Durum              { get; set; } = "Bekliyor"; // Bekliyor | Görüşüldü | İptal
    public int?    GorusenCalisanId   { get; set; }
    public Calisan? GorusenCalisan    { get; set; }
    public string? IptalSebebi        { get; set; }
    public DateTime OlusturulmaTarihi { get; set; } = DateTime.UtcNow;
}
