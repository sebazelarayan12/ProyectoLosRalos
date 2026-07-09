using LosRalos.Application.Entities;

namespace LosRalos.Application.Interfaces;

public interface ICargoRepository
{
    Task<Cargo> GetOrCreateAsync(string nombre, CancellationToken ct);
    Task<List<Cargo>> ListAllAsync(CancellationToken ct);
}
