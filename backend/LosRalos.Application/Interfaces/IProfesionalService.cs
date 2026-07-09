using LosRalos.Application.DTOs.Profesionales;
using LosRalos.Application.DTOs.Shared;
using LosRalos.Application.Entities.Enums;

namespace LosRalos.Application.Interfaces;

public interface IProfesionalService
{
    Task<PaginatedResponse<ProfesionalResumenResponse>> SearchAsync(
        string? busqueda, TipoLegajo? tipo, Planta? planta, EstadoProfesionalFiltro? estado,
        string? cursor, int porPagina, CancellationToken ct);

    Task<ProfesionalDetalleResponse> GetByIdAsync(
        Guid id, Guid usuarioId, string nombreUsuario, string? ip,
        CancellationToken ct = default);

    Task<ProfesionalDetalleResponse> CreateAsync(
        ProfesionalRequest request, Guid usuarioId, string nombreUsuario, string? ip,
        CancellationToken ct = default);

    Task<ProfesionalDetalleResponse> UpdateAsync(
        Guid id, PatchProfesionalRequest request, Guid usuarioId, string nombreUsuario, string? ip,
        CancellationToken ct = default);

    Task DeactivateAsync(
        Guid id, Guid usuarioId, string nombreUsuario, string? ip,
        CancellationToken ct = default);

    Task ReactivarAsync(
        Guid id, Guid usuarioId, string nombreUsuario, string? ip,
        CancellationToken ct = default);

    Task EliminarDefinitivoAsync(
        Guid id, Guid usuarioId, string nombreUsuario, string? ip,
        CancellationToken ct = default);

    Task<List<CargoResponse>> ListarCargosAsync(CancellationToken ct);

    Task<List<AreaOperativaResponse>> ListarAreasOperativasAsync(CancellationToken ct);
}
