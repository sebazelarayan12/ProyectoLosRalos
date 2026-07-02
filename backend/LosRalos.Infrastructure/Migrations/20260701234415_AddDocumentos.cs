using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LosRalos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDocumentos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tipos_documento",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    Nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tipos_documento", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "documentos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    ProfesionalId = table.Column<Guid>(type: "uuid", nullable: false),
                    TipoDocumentoId = table.Column<Guid>(type: "uuid", nullable: false),
                    UrlArchivo = table.Column<string>(type: "text", nullable: false),
                    NombreOriginal = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    ContentType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    TamanioBytes = table.Column<long>(type: "bigint", nullable: false),
                    FechaCarga = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CargadoPorId = table.Column<Guid>(type: "uuid", nullable: false),
                    EliminadoEn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_documentos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_documentos_tipos_documento_TipoDocumentoId",
                        column: x => x.TipoDocumentoId,
                        principalTable: "tipos_documento",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "idx_documento_cargado_por_id",
                table: "documentos",
                column: "CargadoPorId");

            migrationBuilder.CreateIndex(
                name: "idx_documento_profesional_id",
                table: "documentos",
                column: "ProfesionalId");

            migrationBuilder.CreateIndex(
                name: "idx_documento_tipo_documento_id",
                table: "documentos",
                column: "TipoDocumentoId");

            migrationBuilder.Sql(@"CREATE UNIQUE INDEX idx_tipo_documento_nombre_lower ON tipos_documento (LOWER(""Nombre""));");

            migrationBuilder.Sql(@"
                INSERT INTO tipos_documento (""Id"", ""Nombre"", ""FechaCreacion"") VALUES
                (gen_random_uuid(), 'Dni Frente', now()),
                (gen_random_uuid(), 'Dni Dorso', now()),
                (gen_random_uuid(), 'Titulo', now()),
                (gen_random_uuid(), 'Declaracion Jurada', now()),
                (gen_random_uuid(), 'Constancia CUIL', now()),
                (gen_random_uuid(), 'DJ Grupo Familiar', now()),
                (gen_random_uuid(), 'Resolucion', now());
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"DROP INDEX IF EXISTS idx_tipo_documento_nombre_lower;");

            migrationBuilder.DropTable(
                name: "documentos");

            migrationBuilder.DropTable(
                name: "tipos_documento");
        }
    }
}
