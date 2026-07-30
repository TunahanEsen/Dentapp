using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DentApp.API.Migrations
{
    /// <inheritdoc />
    public partial class GorevZamanDamgalari : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "AtanmaTarihi",
                table: "Gorevler",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "BaslamaTarihi",
                table: "Gorevler",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "TamamlanmaTarihi",
                table: "Gorevler",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AtanmaTarihi",
                table: "Gorevler");

            migrationBuilder.DropColumn(
                name: "BaslamaTarihi",
                table: "Gorevler");

            migrationBuilder.DropColumn(
                name: "TamamlanmaTarihi",
                table: "Gorevler");
        }
    }
}
