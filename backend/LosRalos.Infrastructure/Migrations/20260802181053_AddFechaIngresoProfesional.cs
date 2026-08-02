using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LosRalos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFechaIngresoProfesional : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateOnly>(
                name: "FechaIngreso",
                table: "profesionales",
                type: "date",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FechaIngreso",
                table: "profesionales");
        }
    }
}
