using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TouchLove.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SplitUserActiveFlags : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "IsActive",
                table: "AspNetUsers",
                newName: "IsSalesActive");

            migrationBuilder.AddColumn<bool>(
                name: "IsNfcActive",
                table: "AspNetUsers",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsNfcActive",
                table: "AspNetUsers");

            migrationBuilder.RenameColumn(
                name: "IsSalesActive",
                table: "AspNetUsers",
                newName: "IsActive");
        }
    }
}
