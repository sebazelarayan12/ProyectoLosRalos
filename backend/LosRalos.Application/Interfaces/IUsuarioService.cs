using LosRalos.Application.DTOs.Shared;
using LosRalos.Application.DTOs.Usuarios;

namespace LosRalos.Application.Interfaces;

public interface IUsuarioService
{
    Task<PaginatedResponse<UsuarioResponse>> SearchAsync(string? cursor, int porPagina, CancellationToken ct);

    Task<UsuarioResponse> CreateAsync(
        UsuarioRequest request, Guid adminId, string adminNombre, string? ip, CancellationToken ct = default);

    Task<UsuarioResponse> UpdateAsync(
        Guid id, PatchUsuarioRequest request, Guid adminId, string adminNombre, string? ip, CancellationToken ct = default);

    Task ActivarAsync(Guid id, Guid adminId, string adminNombre, string? ip, CancellationToken ct = default);

    Task DesactivarAsync(Guid id, Guid adminId, string adminNombre, string? ip, CancellationToken ct = default);

    Task ResetPasswordAsync(
        Guid id, ResetPasswordRequest request, Guid adminId, string adminNombre, string? ip, CancellationToken ct = default);
}
