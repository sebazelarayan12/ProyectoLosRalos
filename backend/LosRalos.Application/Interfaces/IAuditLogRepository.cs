using LosRalos.Application.Entities;

namespace LosRalos.Application.Interfaces;

public interface IAuditLogRepository
{
    Task AddAsync(AuditLog entry, CancellationToken ct = default);

    Task<(List<AuditLog> Items, string? NextCursor)> SearchAsync(
        Guid? usuarioId, Guid? profesionalId, DateTime? desde, DateTime? hasta,
        string? cursor, int porPagina, CancellationToken ct);
}
