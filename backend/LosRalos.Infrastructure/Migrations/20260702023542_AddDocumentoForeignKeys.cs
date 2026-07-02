using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LosRalos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDocumentoForeignKeys : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddForeignKey(
                name: "FK_documentos_profesionales_ProfesionalId",
                table: "documentos",
                column: "ProfesionalId",
                principalTable: "profesionales",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_documentos_usuarios_CargadoPorId",
                table: "documentos",
                column: "CargadoPorId",
                principalTable: "usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_documentos_profesionales_ProfesionalId",
                table: "documentos");

            migrationBuilder.DropForeignKey(
                name: "FK_documentos_usuarios_CargadoPorId",
                table: "documentos");
        }
    }
}
