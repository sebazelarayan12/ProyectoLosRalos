using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LosRalos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddNroExpedienteTrgmIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"CREATE INDEX idx_profesional_nroexpediente_trgm ON profesionales USING GIN (""NroExpediente"" gin_trgm_ops);");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"DROP INDEX IF EXISTS idx_profesional_nroexpediente_trgm;");
        }
    }
}
