using LosRalos.Application.Entities;
using LosRalos.Infrastructure.Persistence.Interceptors;
using Microsoft.EntityFrameworkCore;

namespace LosRalos.Infrastructure.Persistence;

public sealed class AppDbContext(
    DbContextOptions<AppDbContext> options,
    TimestampInterceptor timestampInterceptor) : DbContext(options)
{
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Profesional> Profesionales => Set<Profesional>();
    public DbSet<TipoDocumento> TiposDocumento => Set<TipoDocumento>();
    public DbSet<Documento> Documentos => Set<Documento>();
    public DbSet<Cargo> Cargos => Set<Cargo>();
    public DbSet<AreaOperativa> AreasOperativas => Set<AreaOperativa>();

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.AddInterceptors(timestampInterceptor);
        base.OnConfiguring(optionsBuilder);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
