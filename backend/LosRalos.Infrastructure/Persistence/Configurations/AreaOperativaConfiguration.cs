using LosRalos.Application.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LosRalos.Infrastructure.Persistence.Configurations;

public class AreaOperativaConfiguration : IEntityTypeConfiguration<AreaOperativa>
{
    public void Configure(EntityTypeBuilder<AreaOperativa> builder)
    {
        builder.ToTable("areas_operativas");

        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id)
            .HasDefaultValueSql("gen_random_uuid()")
            .ValueGeneratedOnAdd();

        builder.Property(a => a.Nombre).IsRequired().HasMaxLength(100);
        builder.Property(a => a.FechaCreacion).IsRequired();

        // Unicidad case-insensitive (LOWER(nombre)) agregada como SQL crudo en migration
    }
}
