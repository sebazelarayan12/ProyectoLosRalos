using LosRalos.Application.Entities;
using LosRalos.Application.Entities.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LosRalos.Infrastructure.Persistence.Configurations;

public class ProfesionalConfiguration : IEntityTypeConfiguration<Profesional>
{
    public void Configure(EntityTypeBuilder<Profesional> builder)
    {
        builder.ToTable("profesionales", t =>
        {
            t.HasCheckConstraint("chk_profesional_tipo", "\"Tipo\" IN ('Asistencial', 'NoAsistencial', 'CP')");
            t.HasCheckConstraint("chk_profesional_sexo", "\"Sexo\" IN ('Masculino', 'Femenino', 'Otro')");
            t.HasCheckConstraint("chk_profesional_estado_civil", "\"EstadoCivil\" IN ('Soltero', 'Casado', 'Divorciado', 'Viudo', 'Otro')");
            t.HasCheckConstraint("chk_profesional_nivel", "\"Nivel\" IN ('Secundario', 'Terciario', 'Universitario')");
            t.HasCheckConstraint("chk_profesional_planta", "\"Planta\" IN ('Transitorio', 'PermanenteInterino', 'PermanenteEfectivo')");
            t.HasCheckConstraint("chk_profesional_tipo_efector", "\"TipoEfector\" IN ('Hospital', 'CAPS')");
        });

        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id)
            .HasDefaultValueSql("gen_random_uuid()")
            .ValueGeneratedOnAdd();

        builder.Property(p => p.Apellido).IsRequired().HasMaxLength(100);
        builder.Property(p => p.Nombre).IsRequired().HasMaxLength(100);
        builder.Property(p => p.Dni).IsRequired().HasMaxLength(15);
        builder.Property(p => p.Cuil).IsRequired().HasMaxLength(15);
        builder.Property(p => p.FechaNacimiento).IsRequired();
        builder.Property(p => p.Domicilio).IsRequired().HasMaxLength(200);
        builder.Property(p => p.Barrio).HasMaxLength(100);
        builder.Property(p => p.Localidad).IsRequired().HasMaxLength(100);
        builder.Property(p => p.Provincia).IsRequired().HasMaxLength(100).HasDefaultValue("Tucuman");
        builder.Property(p => p.CodigoPostal).HasMaxLength(10);
        builder.Property(p => p.Telefono).HasMaxLength(20);
        builder.Property(p => p.Email).HasMaxLength(150);
        builder.Property(p => p.Matricula).HasMaxLength(50);
        builder.Property(p => p.NroExpediente).HasMaxLength(50);
        builder.Property(p => p.Activo).IsRequired();
        builder.Property(p => p.FechaCreacion).IsRequired();
        builder.Property(p => p.FechaActualizacion).IsRequired();

        builder.Property(p => p.Sexo)
            .HasConversion<string>()
            .HasMaxLength(15);

        builder.Property(p => p.EstadoCivil)
            .HasConversion<string>()
            .HasMaxLength(15);

        builder.Property(p => p.Nivel)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(p => p.Planta)
            .HasConversion<string>()
            .HasMaxLength(25);

        builder.Property(p => p.Tipo)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(p => p.TipoEfector)
            .HasConversion<string>()
            .HasMaxLength(15);

        builder.HasOne(p => p.Cargo)
            .WithMany()
            .HasForeignKey(p => p.CargoId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.AreaOperativa)
            .WithMany()
            .HasForeignKey(p => p.AreaOperativaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(p => p.CargoId)
            .HasDatabaseName("idx_profesional_cargo");

        builder.HasIndex(p => p.AreaOperativaId)
            .HasDatabaseName("idx_profesional_area_operativa");

        // Unique constraints
        builder.HasIndex(p => p.Dni)
            .IsUnique()
            .HasDatabaseName("uq_profesional_dni");

        builder.HasIndex(p => p.Cuil)
            .IsUnique()
            .HasDatabaseName("uq_profesional_cuil");

        // Filter index — only active profesionales (partial index via raw SQL in migration)
        builder.HasIndex(p => p.Tipo)
            .HasDatabaseName("idx_profesional_tipo");

        builder.HasIndex(p => p.Activo)
            .HasDatabaseName("idx_profesional_activo")
            .HasFilter("\"Activo\" = true");

        // GIN trigram index on Apellido added as raw SQL in migration
        // GIN trigram index on NroExpediente added as raw SQL in migration (busqueda por expediente)

    }
}
