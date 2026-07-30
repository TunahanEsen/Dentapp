using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DentApp.API.Migrations
{
    /// <inheritdoc />
    public partial class IslemKaydiEkle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "IslemKayitlari",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    DoktorId = table.Column<int>(type: "INTEGER", nullable: false),
                    TedaviId = table.Column<int>(type: "INTEGER", nullable: false),
                    OdemeYontemi = table.Column<string>(type: "TEXT", nullable: false),
                    SistemFiyati = table.Column<decimal>(type: "TEXT", nullable: false),
                    FarkliTutar = table.Column<bool>(type: "INTEGER", nullable: false),
                    OdenenTutar = table.Column<decimal>(type: "TEXT", nullable: true),
                    Notlar = table.Column<string>(type: "TEXT", nullable: true),
                    Tarih = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IslemKayitlari", x => x.Id);
                    table.ForeignKey(
                        name: "FK_IslemKayitlari_Calisanlar_DoktorId",
                        column: x => x.DoktorId,
                        principalTable: "Calisanlar",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_IslemKayitlari_Tedaviler_TedaviId",
                        column: x => x.TedaviId,
                        principalTable: "Tedaviler",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_IslemKayitlari_DoktorId",
                table: "IslemKayitlari",
                column: "DoktorId");

            migrationBuilder.CreateIndex(
                name: "IX_IslemKayitlari_TedaviId",
                table: "IslemKayitlari",
                column: "TedaviId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "IslemKayitlari");
        }
    }
}
