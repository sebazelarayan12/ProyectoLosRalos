using LosRalos.Application.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LosRalos.Infrastructure.Persistence.Configurations;

public class DocumentoConfiguration : IEntityTypeConfiguration<Documento>
{
    public void Configure(EntityTypeBuilder<Documento> builder)
    {
        builder.ToTable("documentos");

        builder.HasKey(d => d.Id);
        builder.Property(d => d.Id)
            .HasDefaultValueSql("gen_random_uuid()")
            .ValueGeneratedOnAdd();

        builder.Property(d => d.ProfesionalId).IsRequired();
        builder.Property(d => d.TipoDocumentoId).IsRequired();
        builder.Property(d => d.UrlArchivo).IsRequired();
        builder.Property(d => d.NombreOriginal).IsRequired().HasMaxLength(255);
        builder.Property(d => d.ContentType).IsRequired().HasMaxLength(100);
        builder.Property(d => d.TamanioBytes).IsRequired();
        builder.Property(d => d.FechaCarga).IsRequired();
        builder.Property(d => d.CargadoPorId).IsRequired();

        builder.HasOne(d => d.TipoDocumento)
            .WithMany()
            .HasForeignKey(d => d.TipoDocumentoId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Profesional>()
            .WithMany(p => p.Documentos)
            .HasForeignKey(d => d.ProfesionalId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Usuario>()
            .WithMany()
            .HasForeignKey(d => d.CargadoPorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(d => d.ProfesionalId).HasDatabaseName("idx_documento_profesional_id");
        builder.HasIndex(d => d.CargadoPorId).HasDatabaseName("idx_documento_cargado_por_id");
        builder.HasIndex(d => d.TipoDocumentoId).HasDatabaseName("idx_documento_tipo_documento_id");

        // Sin UNIQUE entre ProfesionalId y TipoDocumentoId — ver spec Sec. 4.3.
        // Un profesional puede tener multiples documentos del mismo tipo.
    }
}
