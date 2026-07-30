namespace DentApp.API.Models;

public class StokKalemi
{
    public int      Id             { get; set; }
    public string   UrunAdi        { get; set; } = "";
    public string   Kategori       { get; set; } = "";  // Malzeme, İlaç, Ekipman
    public string   Birim          { get; set; } = "";  // adet, kutu, ml, gr
    public decimal  Miktar         { get; set; }
    public decimal  MinimumMiktar  { get; set; }        // Bu altına düşünce uyarı
    public decimal  BirimFiyat     { get; set; }
    public DateTime SonGuncelleme  { get; set; } = DateTime.UtcNow;
}
