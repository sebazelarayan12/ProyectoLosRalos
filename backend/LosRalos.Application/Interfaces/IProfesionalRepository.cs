using LosRalos.Application.Entities;
using LosRalos.Application.Entities.Enums;

namespace LosRalos.Application.Interfaces;

public interface IProfesionalRepository
{
    Task<(List<Profesional> Items, string? NextCursor)> SearchAsync(
        string? busqueda, TipoLegajo? tipo, Planta? planta,
        string? cursor, int porPagina, CancellationToken ct);

    Task<Profesional?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<bool> ExistsDniAsync(string dni, Guid? excludeId, CancellationToken ct);
    Task<bool> ExistsCuilAsync(string cuil, Guid? excludeId, CancellationToken ct);
    Task AddAsync(Profesional profesional, CancellationToken ct);
    Task UpdateAsync(Profesional profesional, CancellationToken ct);
    Task DeleteAsync(Profesional profesional, CancellationToken ct);
}
