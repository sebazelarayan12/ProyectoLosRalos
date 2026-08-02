using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LosRalos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class NormalizarEmailUsuarioMinusculas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"UPDATE usuarios SET ""Email"" = lower(trim(""Email""));");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Normalizacion de datos no reversible (se pierde el casing/espacios originales).
        }
    }
}
