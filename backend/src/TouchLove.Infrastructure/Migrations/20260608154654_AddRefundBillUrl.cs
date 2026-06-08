using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TouchLove.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRefundBillUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RefundBillUrl",
                table: "Orders",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RefundBillUrl",
                table: "Orders");
        }
    }
}
