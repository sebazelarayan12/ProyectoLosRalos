using LosRalos.Application.DTOs.Auth;

namespace LosRalos.Application.Interfaces;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request, string? ipOrigen, CancellationToken ct = default);
    Task LogoutAsync(Guid userId, string nombreUsuario, string? ipOrigen, CancellationToken ct = default);
}
