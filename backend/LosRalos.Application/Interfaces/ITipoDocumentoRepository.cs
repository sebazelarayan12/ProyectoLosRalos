using LosRalos.Application.Entities;

namespace LosRalos.Application.Interfaces;

public interface ITipoDocumentoRepository
{
    Task<TipoDocumento> GetOrCreateAsync(string nombre, CancellationToken ct);
    Task<List<TipoDocumento>> ListAllAsync(CancellationToken ct);
}
