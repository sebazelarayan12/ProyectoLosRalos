using LosRalos.Application.Entities;

namespace LosRalos.Application.Interfaces;

public interface IUsuarioRepository
{
    Task<Usuario?> GetByEmailAsync(string email, CancellationToken ct = default);
    Task<Usuario?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<bool> ExistsActiveAsync(Guid id, CancellationToken ct = default);
    Task UpdateUltimoAccesoAsync(Guid id, DateTime timestamp, CancellationToken ct = default);
}
