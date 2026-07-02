using LosRalos.Application.Entities;

namespace LosRalos.Application.Interfaces;

public interface IDocumentoRepository
{
    Task<Documento?> GetByIdAsync(Guid id, CancellationToken ct);
    Task AddAsync(Documento documento, CancellationToken ct);
    Task UpdateAsync(Documento documento, CancellationToken ct);
    Task<List<Documento>> ListByProfesionalIdAsync(Guid profesionalId, CancellationToken ct);
}
