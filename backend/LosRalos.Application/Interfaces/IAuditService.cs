using LosRalos.Application.DTOs.Audit;
using LosRalos.Application.DTOs.Shared;

namespace LosRalos.Application.Interfaces;

public interface IAuditService
{
    Task<PaginatedResponse<AuditLogResponse>> SearchAsync(
        Guid? usuarioId, Guid? profesionalId, DateTime? desde, DateTime? hasta,
        string? cursor, int porPagina, CancellationToken ct);
}
