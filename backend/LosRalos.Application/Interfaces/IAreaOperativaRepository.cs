using LosRalos.Application.Entities;

namespace LosRalos.Application.Interfaces;

public interface IAreaOperativaRepository
{
    Task<AreaOperativa> GetOrCreateAsync(string nombre, CancellationToken ct);
    Task<List<AreaOperativa>> ListAllAsync(CancellationToken ct);
}
