namespace DentApp.API.Models;

public class IslemKaydi
{
    public int      Id            { get; set; }
    public int      DoktorId      { get; set; }
    public Calisan? Doktor        { get; set; }
    public int      TedaviId      { get; set; }
    public Tedavi?  Tedavi        { get; set; }
    public string   OdemeYontemi  { get; set; } = "Nakit";  // Nakit | Kart
    public decimal  SistemFiyati  { get; set; }
    public bool     FarkliTutar   { get; set; }
    public decimal? OdenenTutar   { get; set; }
    public string?  Notlar        { get; set; }
    public DateTime Tarih         { get; set; } = DateTime.UtcNow;
    public int?     GelirGiderId  { get; set; }   // otomatik oluşturulan GelirGider kaydının ID'si
}
