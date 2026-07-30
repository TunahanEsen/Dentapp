using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DentApp.API.Migrations
{
    /// <inheritdoc />
    public partial class NobetVardiyaEkle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Calisanlar",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    AdSoyad = table.Column<string>(type: "TEXT", nullable: false),
                    Unvan = table.Column<string>(type: "TEXT", nullable: false),
                    Renk = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Calisanlar", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Vardiyalar",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CalisanId = table.Column<int>(type: "INTEGER", nullable: false),
                    Tarih = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    Tur = table.Column<string>(type: "TEXT", nullable: false),
                    Not = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Vardiyalar", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Vardiyalar_Calisanlar_CalisanId",
                        column: x => x.CalisanId,
                        principalTable: "Calisanlar",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Vardiyalar_CalisanId",
                table: "Vardiyalar",
                column: "CalisanId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Vardiyalar");

            migrationBuilder.DropTable(
                name: "Calisanlar");
        }
    }
}
