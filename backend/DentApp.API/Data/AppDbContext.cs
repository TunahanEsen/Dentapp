using Microsoft.EntityFrameworkCore;
using DentApp.API.Models;

namespace DentApp.API.Data;

// DbContext: EF Core'un veritabanı bağlantısını ve tablolarını yöneten sınıf.
// Her DbSet<T> bir veritabanı tablosunu temsil eder.
public class AppDbContext : DbContext
{
    // Constructor: bağlantı ayarları dışarıdan (Program.cs'ten) enjekte edilir
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User>       Users         => Set<User>();
    public DbSet<StokKalemi> StokKalemleri => Set<StokKalemi>();
    public DbSet<Tedavi>     Tedaviler     => Set<Tedavi>();
    public DbSet<Calisan>    Calisanlar    => Set<Calisan>();
    public DbSet<Vardiya>    Vardiyalar    => Set<Vardiya>();
    public DbSet<GelirGider>    GelirGiderler   => Set<GelirGider>();
    public DbSet<RandevuTalebi> RandevuTalepleri => Set<RandevuTalebi>();
    public DbSet<Gorev>         Gorevler         => Set<Gorev>();
    public DbSet<IslemKaydi>    IslemKayitlari   => Set<IslemKaydi>();
    public DbSet<SiteAyar>      SiteAyarlari     => Set<SiteAyar>();
    public DbSet<Lab>           Lablar           => Set<Lab>();
    public DbSet<LabTakibi>     LabTakibi        => Set<LabTakibi>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Email alanının benzersiz olmasını zorunlu kıl
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();
    }
}
