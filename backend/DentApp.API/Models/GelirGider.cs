namespace DentApp.API.Models;

public class GelirGider
{
    public int      Id        { get; set; }
    public string   Tur       { get; set; } = ""; // "Gelir" | "Gider"
    public string   Kategori  { get; set; } = "";
    public decimal  Miktar    { get; set; }
    public DateOnly Tarih     { get; set; }
    public string   Aciklama  { get; set; } = "";
}
