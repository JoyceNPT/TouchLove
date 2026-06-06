using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TouchLove.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCoupleStorageTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "UsedStorageBytes",
                table: "Couples",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UsedStorageBytes",
                table: "Couples");
        }
    }
}
