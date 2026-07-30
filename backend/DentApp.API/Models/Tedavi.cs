namespace DentApp.API.Models;

public class Tedavi
{
    public int     Id         { get; set; }
    public string  Ad         { get; set; } = "";
    public string  Kategori   { get; set; } = "";  // Muayene, Dolgu, Kanal, İmplant...
    public decimal TemelFiyat { get; set; }
}
