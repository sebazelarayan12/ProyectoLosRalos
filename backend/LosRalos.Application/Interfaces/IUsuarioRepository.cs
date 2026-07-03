using LosRalos.Application.Entities;

namespace LosRalos.Application.Interfaces;

public interface IUsuarioRepository
{
    Task<Usuario?> GetByEmailAsync(string email, CancellationToken ct = default);
    Task<Usuario?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<bool> ExistsActiveAsync(Guid id, CancellationToken ct = default);
    Task UpdateUltimoAccesoAsync(Guid id, DateTime timestamp, CancellationToken ct = default);
    Task<(List<Usuario> Items, string? NextCursor)> SearchAsync(string? cursor, int porPagina, CancellationToken ct);
    Task<bool> ExistsEmailAsync(string email, Guid? excludeId, CancellationToken ct);
    Task<int> CountActiveAdminsAsync(CancellationToken ct);
    Task AddAsync(Usuario usuario, CancellationToken ct);
    Task UpdateAsync(Usuario usuario, CancellationToken ct);
}
