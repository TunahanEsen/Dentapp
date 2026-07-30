namespace DentApp.API.Models;

public class Gorev
{
    public int      Id                 { get; set; }
    public string   Baslik             { get; set; } = string.Empty;
    public string?  Aciklama           { get; set; }
    public string   Oncelik            { get; set; } = "Orta";   // Düşük | Orta | Yüksek
    public string   Durum              { get; set; } = "Yapılacak"; // Yapılacak | Devam Ediyor | Tamamlandı
    public string?  SonTarih           { get; set; }  // yyyy-MM-dd
    public int?     AtananCalisanId    { get; set; }
    public Calisan? AtananCalisan      { get; set; }
    public DateTime  OlusturulmaTarihi  { get; set; } = DateTime.UtcNow;
    public DateTime? AtanmaTarihi       { get; set; }
    public DateTime? BaslamaTarihi      { get; set; }
    public DateTime? TamamlanmaTarihi   { get; set; }
}
