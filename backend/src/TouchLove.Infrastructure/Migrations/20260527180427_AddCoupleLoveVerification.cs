using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TouchLove.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCoupleLoveVerification : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsStartDateConfirmed",
                table: "Couples",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "ProposedByUserId",
                table: "Couples",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "ProposedStartDate",
                table: "Couples",
                type: "date",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsStartDateConfirmed",
                table: "Couples");

            migrationBuilder.DropColumn(
                name: "ProposedByUserId",
                table: "Couples");

            migrationBuilder.DropColumn(
                name: "ProposedStartDate",
                table: "Couples");
        }
    }
}
