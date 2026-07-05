using LosRalos.Application.DTOs.Audit;
using LosRalos.Application.DTOs.Shared;
using LosRalos.Application.Interfaces;

namespace LosRalos.Application.Services;

public class AuditService(IAuditLogRepository repo) : IAuditService
{
    public async Task<PaginatedResponse<AuditLogResponse>> SearchAsync(
        Guid? usuarioId, Guid? profesionalId, DateTime? desde, DateTime? hasta,
        string? cursor, int porPagina, CancellationToken ct)
    {
        var (items, nextCursor) = await repo.SearchAsync(usuarioId, profesionalId, desde, hasta, cursor, porPagina, ct)
            .ConfigureAwait(false);

        return new PaginatedResponse<AuditLogResponse>
        {
            Items = items.Select(a => a.ToResponse()).ToList(),
            PorPagina = porPagina,
            HasNextPage = nextCursor is not null,
            Cursor = nextCursor
        };
    }
}
