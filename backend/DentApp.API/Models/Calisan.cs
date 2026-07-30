namespace DentApp.API.Models;

public class Calisan
{
    public int    Id      { get; set; }
    public string AdSoyad { get; set; } = "";
    public string Unvan   { get; set; } = "";  // Diş Hekimi, Asistan, Hemşire...
    public string Renk    { get; set; } = "#1a237e"; // Takvimde renk kodu
}
