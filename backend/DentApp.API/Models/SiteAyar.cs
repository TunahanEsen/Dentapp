namespace DentApp.API.Models;

public class SiteAyar
{
    public int    Id     { get; set; }
    public string Bolum  { get; set; } = "";   // iletisim | doktorlar | hizmetler | makaleler
    public string Icerik { get; set; } = "{}"; // JSON string
}
