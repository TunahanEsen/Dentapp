using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DentApp.API.Migrations
{
    /// <inheritdoc />
    public partial class RandevuTalebiEkle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RandevuTalepleri",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    AdSoyad = table.Column<string>(type: "TEXT", nullable: false),
                    Telefon = table.Column<string>(type: "TEXT", nullable: false),
                    TercihTarih = table.Column<string>(type: "TEXT", nullable: true),
                    Hizmet = table.Column<string>(type: "TEXT", nullable: true),
                    Notlar = table.Column<string>(type: "TEXT", nullable: true),
                    Durum = table.Column<string>(type: "TEXT", nullable: false),
                    GorusenCalisanId = table.Column<int>(type: "INTEGER", nullable: true),
                    IptalSebebi = table.Column<string>(type: "TEXT", nullable: true),
                    OlusturulmaTarihi = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RandevuTalepleri", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RandevuTalepleri_Calisanlar_GorusenCalisanId",
                        column: x => x.GorusenCalisanId,
                        principalTable: "Calisanlar",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_RandevuTalepleri_GorusenCalisanId",
                table: "RandevuTalepleri",
                column: "GorusenCalisanId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RandevuTalepleri");
        }
    }
}
