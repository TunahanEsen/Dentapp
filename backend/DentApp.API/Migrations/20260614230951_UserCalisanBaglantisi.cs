using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DentApp.API.Migrations
{
    /// <inheritdoc />
    public partial class UserCalisanBaglantisi : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CalisanId",
                table: "Users",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_CalisanId",
                table: "Users",
                column: "CalisanId");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Calisanlar_CalisanId",
                table: "Users",
                column: "CalisanId",
                principalTable: "Calisanlar",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Calisanlar_CalisanId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_CalisanId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CalisanId",
                table: "Users");
        }
    }
}
