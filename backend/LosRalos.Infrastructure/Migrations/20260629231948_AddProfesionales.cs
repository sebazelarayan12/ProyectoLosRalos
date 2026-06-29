using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LosRalos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProfesionales : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "chk_usuario_rol",
                table: "usuarios");

            migrationBuilder.CreateTable(
                name: "profesionales",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    Apellido = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Dni = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                    Cuil = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                    FechaNacimiento = table.Column<DateOnly>(type: "date", nullable: false),
                    Sexo = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                    EstadoCivil = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                    Domicilio = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Barrio = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Localidad = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Provincia = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false, defaultValue: "Tucuman"),
                    CodigoPostal = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    Telefono = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    Funcion = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Servicio = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Nivel = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Planta = table.Column<string>(type: "character varying(25)", maxLength: 25, nullable: false),
                    NroExpediente = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Tipo = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaActualizacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_profesionales", x => x.Id);
                    table.CheckConstraint("chk_profesional_estado_civil", "\"EstadoCivil\" IN ('Soltero', 'Casado', 'Divorciado', 'Viudo', 'Otro')");
                    table.CheckConstraint("chk_profesional_nivel", "\"Nivel\" IN ('Secundario', 'Terciario', 'Universitario')");
                    table.CheckConstraint("chk_profesional_planta", "\"Planta\" IN ('Transitorio', 'PermanenteInterino', 'PermanenteEfectivo')");
                    table.CheckConstraint("chk_profesional_sexo", "\"Sexo\" IN ('Masculino', 'Femenino', 'Otro')");
                    table.CheckConstraint("chk_profesional_tipo", "\"Tipo\" IN ('Asistencial', 'Administrativo')");
                });

            migrationBuilder.AddCheckConstraint(
                name: "chk_usuario_rol",
                table: "usuarios",
                sql: "\"Rol\" IN ('Admin', 'Visor')");

            migrationBuilder.CreateIndex(
                name: "idx_profesional_activo",
                table: "profesionales",
                column: "Activo",
                filter: "\"Activo\" = true");

            migrationBuilder.CreateIndex(
                name: "idx_profesional_tipo",
                table: "profesionales",
                column: "Tipo");

            migrationBuilder.CreateIndex(
                name: "uq_profesional_cuil",
                table: "profesionales",
                column: "Cuil",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "uq_profesional_dni",
                table: "profesionales",
                column: "Dni",
                unique: true);

            migrationBuilder.Sql(@"CREATE EXTENSION IF NOT EXISTS pg_trgm;");
            migrationBuilder.Sql(@"CREATE INDEX idx_profesional_apellido_trgm ON profesionales USING GIN (""Apellido"" gin_trgm_ops);");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"DROP INDEX IF EXISTS idx_profesional_apellido_trgm;");

            migrationBuilder.DropTable(
                name: "profesionales");

            migrationBuilder.DropCheckConstraint(
                name: "chk_usuario_rol",
                table: "usuarios");

            migrationBuilder.AddCheckConstraint(
                name: "chk_usuario_rol",
                table: "usuarios",
                sql: "rol IN ('Admin', 'Visor')");
        }
    }
}
