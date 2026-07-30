namespace DentApp.API.Models;

public class LabTakibi
{
    public int       Id                { get; set; }
    public string    LabAdi            { get; set; } = "";
    public string    Tur               { get; set; } = "";    // Kron | Köprü | Protez | ...
    public int?      DoktorId          { get; set; }
    public Calisan?  Doktor            { get; set; }
    public DateOnly  GonderimTarihi    { get; set; }
    public DateOnly  TahminiTeslim     { get; set; }
    public DateOnly? GercekTeslim      { get; set; }          // null → henüz teslim alınmadı
    public string    Durum             { get; set; } = "Gönderildi"; // Gönderildi | Lab'da | Klinikte | Hastaya Verildi | İptal
    public string?   Notlar            { get; set; }
    public decimal?  Ucret             { get; set; }
    public DateTime  OlusturulmaTarihi { get; set; } = DateTime.UtcNow;
}
