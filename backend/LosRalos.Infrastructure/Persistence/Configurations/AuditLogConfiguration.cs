using LosRalos.Application.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LosRalos.Infrastructure.Persistence.Configurations;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("audit_logs");

        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id)
            .HasDefaultValueSql("gen_random_uuid()")
            .ValueGeneratedOnAdd();

        builder.Property(a => a.NombreUsuario).HasMaxLength(100);
        builder.Property(a => a.DetalleExtra).HasMaxLength(500);
        builder.Property(a => a.IpOrigen).HasMaxLength(45);
        builder.Property(a => a.Timestamp).IsRequired();

        builder.Property(a => a.Accion)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.HasOne(a => a.Usuario)
            .WithMany()
            .HasForeignKey(a => a.UsuarioId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(a => a.UsuarioId)
            .HasDatabaseName("idx_auditlog_usuario_id");

        builder.HasIndex(a => a.ProfesionalId)
            .HasDatabaseName("idx_auditlog_profesional_id");

        builder.HasIndex(a => a.Timestamp)
            .HasDatabaseName("idx_auditlog_timestamp")
            .IsDescending(true);
    }
}
