namespace DentApp.API.Models;

public class Lab
{
    public int     Id      { get; set; }
    public string  Ad      { get; set; } = "";
    public string? Telefon { get; set; }
    public string? Notlar  { get; set; }
    public bool    Aktif   { get; set; } = true;
}
