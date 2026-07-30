namespace DentApp.API.Models;

public class Vardiya
{
    public int     Id        { get; set; }
    public int     CalisanId { get; set; }
    public Calisan Calisan   { get; set; } = null!;  // Navigation property — EF Core ilişkiyi buradan bilir
    public DateOnly Tarih    { get; set; }
    public string  Tur       { get; set; } = "";     // Sabah, Öğleden Sonra, Tam Gün, Nöbet
    public string  Not       { get; set; } = "";
}
