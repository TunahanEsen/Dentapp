using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DentApp.API.Migrations
{
    /// <inheritdoc />
    public partial class GorevEkle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Gorevler",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Baslik = table.Column<string>(type: "TEXT", nullable: false),
                    Aciklama = table.Column<string>(type: "TEXT", nullable: true),
                    Oncelik = table.Column<string>(type: "TEXT", nullable: false),
                    Durum = table.Column<string>(type: "TEXT", nullable: false),
                    SonTarih = table.Column<string>(type: "TEXT", nullable: true),
                    AtananCalisanId = table.Column<int>(type: "INTEGER", nullable: true),
                    OlusturulmaTarihi = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Gorevler", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Gorevler_Calisanlar_AtananCalisanId",
                        column: x => x.AtananCalisanId,
                        principalTable: "Calisanlar",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Gorevler_AtananCalisanId",
                table: "Gorevler",
                column: "AtananCalisanId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Gorevler");
        }
    }
}
