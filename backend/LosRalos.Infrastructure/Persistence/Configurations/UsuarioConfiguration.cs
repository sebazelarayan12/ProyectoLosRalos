using LosRalos.Application.Entities;
using LosRalos.Application.Entities.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LosRalos.Infrastructure.Persistence.Configurations;

public class UsuarioConfiguration : IEntityTypeConfiguration<Usuario>
{
    public void Configure(EntityTypeBuilder<Usuario> builder)
    {
        builder.ToTable("usuarios");

        builder.HasKey(u => u.Id);
        builder.Property(u => u.Id)
            .HasDefaultValueSql("gen_random_uuid()")
            .ValueGeneratedOnAdd();

        builder.Property(u => u.Nombre).IsRequired().HasMaxLength(100);
        builder.Property(u => u.Email).IsRequired().HasMaxLength(150);
        builder.Property(u => u.PasswordHash).IsRequired();
        builder.Property(u => u.Activo).IsRequired();
        builder.Property(u => u.FechaCreacion).IsRequired();
        builder.Property(u => u.FechaActualizacion).IsRequired();

        builder.Property(u => u.Rol)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.HasIndex(u => u.Email)
            .IsUnique()
            .HasDatabaseName("uq_usuario_email");

        builder.HasCheckConstraint("chk_usuario_rol", "rol IN ('Admin', 'Visor')");
    }
}
