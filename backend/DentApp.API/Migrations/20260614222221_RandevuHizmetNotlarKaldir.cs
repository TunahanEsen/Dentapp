using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DentApp.API.Migrations
{
    /// <inheritdoc />
    public partial class RandevuHizmetNotlarKaldir : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Hizmet",
                table: "RandevuTalepleri");

            migrationBuilder.DropColumn(
                name: "Notlar",
                table: "RandevuTalepleri");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Hizmet",
                table: "RandevuTalepleri",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Notlar",
                table: "RandevuTalepleri",
                type: "TEXT",
                nullable: true);
        }
    }
}
