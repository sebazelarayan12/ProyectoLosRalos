using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LosRalos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class NormalizarTipoDocumentoMayusculas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"UPDATE tipos_documento SET ""Nombre"" = UPPER(""Nombre"");");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Irreversible: no se conserva el casing original de los tipos de documento.
        }
    }
}
