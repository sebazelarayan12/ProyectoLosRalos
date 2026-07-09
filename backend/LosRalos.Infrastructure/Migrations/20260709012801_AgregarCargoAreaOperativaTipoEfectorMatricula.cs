using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LosRalos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarCargoAreaOperativaTipoEfectorMatricula : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "chk_profesional_tipo",
                table: "profesionales");

            // Migration de datos: el valor "Administrativo" de Tipo pasa a llamarse "NoAsistencial"
            // (ver docs/specs/2026-07-08-cambios-profesional.md). Corre sin constraint activo.
            migrationBuilder.Sql(@"UPDATE profesionales SET ""Tipo"" = 'NoAsistencial' WHERE ""Tipo"" = 'Administrativo';");

            migrationBuilder.DropColumn(
                name: "Funcion",
                table: "profesionales");

            migrationBuilder.DropColumn(
                name: "Servicio",
                table: "profesionales");

            migrationBuilder.AddColumn<Guid>(
                name: "AreaOperativaId",
                table: "profesionales",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "CargoId",
                table: "profesionales",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "Matricula",
                table: "profesionales",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TipoEfector",
                table: "profesionales",
                type: "character varying(15)",
                maxLength: 15,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "areas_operativas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    Nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_areas_operativas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "cargos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    Nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cargos", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "idx_profesional_area_operativa",
                table: "profesionales",
                column: "AreaOperativaId");

            migrationBuilder.CreateIndex(
                name: "idx_profesional_cargo",
                table: "profesionales",
                column: "CargoId");

            migrationBuilder.AddCheckConstraint(
                name: "chk_profesional_tipo",
                table: "profesionales",
                sql: "\"Tipo\" IN ('Asistencial', 'NoAsistencial', 'CP')");

            migrationBuilder.AddCheckConstraint(
                name: "chk_profesional_tipo_efector",
                table: "profesionales",
                sql: "\"TipoEfector\" IN ('Hospital', 'CAPS')");

            migrationBuilder.AddForeignKey(
                name: "FK_profesionales_areas_operativas_AreaOperativaId",
                table: "profesionales",
                column: "AreaOperativaId",
                principalTable: "areas_operativas",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_profesionales_cargos_CargoId",
                table: "profesionales",
                column: "CargoId",
                principalTable: "cargos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            // Unicidad case-insensitive de los catalogos dinamicos (mismo patron que tipos_documento)
            migrationBuilder.Sql(@"CREATE UNIQUE INDEX idx_cargo_nombre_lower ON cargos (LOWER(""Nombre""));");
            migrationBuilder.Sql(@"CREATE UNIQUE INDEX idx_area_operativa_nombre_lower ON areas_operativas (LOWER(""Nombre""));");

            // Busqueda por Dni/Cuil (mismo patron que idx_profesional_apellido_trgm)
            migrationBuilder.Sql(@"CREATE EXTENSION IF NOT EXISTS pg_trgm;");
            migrationBuilder.Sql(@"CREATE INDEX idx_profesional_dni_trgm ON profesionales USING GIN (""Dni"" gin_trgm_ops);");
            migrationBuilder.Sql(@"CREATE INDEX idx_profesional_cuil_trgm ON profesionales USING GIN (""Cuil"" gin_trgm_ops);");

            // Seed: cargos normalizados del ROSTER LOS RALOS 2024 LIMPIO.xlsx
            migrationBuilder.Sql(@"
                INSERT INTO cargos (""Id"", ""Nombre"", ""FechaCreacion"") VALUES
                (gen_random_uuid(), 'ENFERMERA', now()),
                (gen_random_uuid(), 'MEDICO', now()),
                (gen_random_uuid(), 'ADMINISTRATIVO', now()),
                (gen_random_uuid(), 'ASS', now()),
                (gen_random_uuid(), 'ADMISIONISTA', now()),
                (gen_random_uuid(), 'ENFERMERO', now()),
                (gen_random_uuid(), 'ADMINISTRATIVA', now()),
                (gen_random_uuid(), 'AUXILIAR EN ENFERMERIA', now()),
                (gen_random_uuid(), 'JEFE DE CAPS', now()),
                (gen_random_uuid(), 'AUXILIAR DE FARMACIA', now()),
                (gen_random_uuid(), 'COCINERA', now()),
                (gen_random_uuid(), 'BIOQUIMICA', now()),
                (gen_random_uuid(), 'RADIOLOGO', now()),
                (gen_random_uuid(), 'FONODIOLOGA', now()),
                (gen_random_uuid(), 'ENCARGADA DE FARMACIA', now()),
                (gen_random_uuid(), 'KINESIOLOGO', now()),
                (gen_random_uuid(), 'LICENCIADA EN OBSTETRICIA', now()),
                (gen_random_uuid(), 'PSICOLOGA', now()),
                (gen_random_uuid(), 'ODONTOLOGO', now()),
                (gen_random_uuid(), 'LICENCIADA EN ENFERMERIA', now()),
                (gen_random_uuid(), 'ODONTOLOGA', now()),
                (gen_random_uuid(), 'TECNICO DE LABORATORIO', now()),
                (gen_random_uuid(), 'ADMINISTRADORA', now()),
                (gen_random_uuid(), 'RECUPERO DE COSTOS', now()),
                (gen_random_uuid(), 'GESTOR', now()),
                (gen_random_uuid(), 'SERVICIOS GENERALES', now()),
                (gen_random_uuid(), 'TECNICA RADIOLOGA', now()),
                (gen_random_uuid(), 'TECNICA EN OBSTETRICIA', now()),
                (gen_random_uuid(), 'ADMINISTRADOR DE FARMACIA', now()),
                (gen_random_uuid(), 'SUPERVISORA ASS', now()),
                (gen_random_uuid(), 'OBSTETRA', now()),
                (gen_random_uuid(), 'NUTRICIONISTA', now()),
                (gen_random_uuid(), 'TECNICO RADIOLOGO', now()),
                (gen_random_uuid(), 'MEDICO EN PEDIATRIA', now()),
                (gen_random_uuid(), 'DIRECTORA', now());
            ");

            // Seed: areas operativas del ROSTER LOS RALOS 2024 LIMPIO.xlsx
            migrationBuilder.Sql(@"
                INSERT INTO areas_operativas (""Id"", ""Nombre"", ""FechaCreacion"") VALUES
                (gen_random_uuid(), 'LOS RALOS', now()),
                (gen_random_uuid(), 'LAS CEJAS', now()),
                (gen_random_uuid(), 'FINCA MAYO', now()),
                (gen_random_uuid(), 'LOS PEREZ', now());
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"DROP INDEX IF EXISTS idx_profesional_dni_trgm;");
            migrationBuilder.Sql(@"DROP INDEX IF EXISTS idx_profesional_cuil_trgm;");
            migrationBuilder.Sql(@"DROP INDEX IF EXISTS idx_cargo_nombre_lower;");
            migrationBuilder.Sql(@"DROP INDEX IF EXISTS idx_area_operativa_nombre_lower;");

            migrationBuilder.DropForeignKey(
                name: "FK_profesionales_areas_operativas_AreaOperativaId",
                table: "profesionales");

            migrationBuilder.DropForeignKey(
                name: "FK_profesionales_cargos_CargoId",
                table: "profesionales");

            migrationBuilder.DropTable(
                name: "areas_operativas");

            migrationBuilder.DropTable(
                name: "cargos");

            migrationBuilder.DropIndex(
                name: "idx_profesional_area_operativa",
                table: "profesionales");

            migrationBuilder.DropIndex(
                name: "idx_profesional_cargo",
                table: "profesionales");

            migrationBuilder.DropCheckConstraint(
                name: "chk_profesional_tipo",
                table: "profesionales");

            migrationBuilder.DropCheckConstraint(
                name: "chk_profesional_tipo_efector",
                table: "profesionales");

            migrationBuilder.DropColumn(
                name: "AreaOperativaId",
                table: "profesionales");

            migrationBuilder.DropColumn(
                name: "CargoId",
                table: "profesionales");

            migrationBuilder.DropColumn(
                name: "Matricula",
                table: "profesionales");

            migrationBuilder.DropColumn(
                name: "TipoEfector",
                table: "profesionales");

            migrationBuilder.AddColumn<string>(
                name: "Funcion",
                table: "profesionales",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Servicio",
                table: "profesionales",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            // Reversion de datos: NoAsistencial y CP no tienen equivalente 1:1 en el esquema viejo,
            // se mapean a "Administrativo" (perdida de informacion aceptada en un rollback).
            migrationBuilder.Sql(@"UPDATE profesionales SET ""Tipo"" = 'Administrativo' WHERE ""Tipo"" IN ('NoAsistencial', 'CP');");

            migrationBuilder.AddCheckConstraint(
                name: "chk_profesional_tipo",
                table: "profesionales",
                sql: "\"Tipo\" IN ('Asistencial', 'Administrativo')");
        }
    }
}
