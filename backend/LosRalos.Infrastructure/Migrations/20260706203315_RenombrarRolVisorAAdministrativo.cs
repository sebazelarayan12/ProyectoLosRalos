using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LosRalos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RenombrarRolVisorAAdministrativo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "chk_usuario_rol",
                table: "usuarios");

            migrationBuilder.Sql(
                "UPDATE usuarios SET \"Rol\" = 'Administrativo' WHERE \"Rol\" = 'Visor';");

            migrationBuilder.AddCheckConstraint(
                name: "chk_usuario_rol",
                table: "usuarios",
                sql: "\"Rol\" IN ('Admin', 'Administrativo')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "chk_usuario_rol",
                table: "usuarios");

            migrationBuilder.Sql(
                "UPDATE usuarios SET \"Rol\" = 'Visor' WHERE \"Rol\" = 'Administrativo';");

            migrationBuilder.AddCheckConstraint(
                name: "chk_usuario_rol",
                table: "usuarios",
                sql: "\"Rol\" IN ('Admin', 'Visor')");
        }
    }
}
