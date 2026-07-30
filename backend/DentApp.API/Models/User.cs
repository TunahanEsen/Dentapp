namespace DentApp.API.Models;

// Bu sınıf veritabanındaki "Users" tablosuna karşılık gelecek.
// EF Core, sınıf adını çoğullayarak tablo adını otomatik belirler: User → Users
public class User
{
    public int Id { get; set; }                  // PRIMARY KEY (otomatik artan)
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = ""; // Şifreyi düz metin saklamıyoruz!
    public string Role { get; set; } = "Staff";    // "Admin" veya "Staff"
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int? CalisanId { get; set; }
    public Calisan? Calisan { get; set; }
}
