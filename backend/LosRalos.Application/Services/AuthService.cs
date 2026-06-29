using System.Security.Cryptography;
using System.Text;
using LosRalos.Application.DTOs.Auth;
using LosRalos.Application.Entities;
using LosRalos.Application.Entities.Enums;
using LosRalos.Application.Exceptions;
using LosRalos.Application.Interfaces;
using LosRalos.Application.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace LosRalos.Application.Services;

public class AuthService(
    IUsuarioRepository usuarioRepo,
    IAuditLogRepository auditRepo,
    IJwtService jwtService,
    IPasswordHasher passwordHasher,
    IOptions<JwtSettings> jwtSettings,
    IOptions<AuditSettings> auditSettings,
    ILogger<AuthService> logger) : IAuthService
{
    public async Task<LoginResponse> LoginAsync(LoginRequest request, string? ipOrigen, CancellationToken ct = default)
    {
        var usuario = await usuarioRepo.GetByEmailAsync(request.Email, ct).ConfigureAwait(false);

        if (usuario is null || !passwordHasher.Verify(request.Password, usuario.PasswordHash))
        {
            await RegistrarLoginFallidoAsync(request.Email, ipOrigen, ct).ConfigureAwait(false);
            throw new UnauthorizedException("Credenciales invalidas");
        }

        if (!usuario.Activo)
        {
            await RegistrarLoginFallidoAsync(request.Email, ipOrigen, ct).ConfigureAwait(false);
            throw new UnauthorizedException("Credenciales invalidas");
        }

        var token = jwtService.GenerateToken(usuario);
        var expiraEn = DateTime.UtcNow.AddHours(jwtSettings.Value.ExpiresInHours);

        await auditRepo.AddAsync(new AuditLog
        {
            UsuarioId = usuario.Id,
            NombreUsuario = usuario.Nombre,
            Accion = AccionAudit.Login,
            Timestamp = DateTime.UtcNow,
            IpOrigen = ipOrigen
        }, ct).ConfigureAwait(false);

        await usuarioRepo.UpdateUltimoAccesoAsync(usuario.Id, DateTime.UtcNow, ct).ConfigureAwait(false);

        logger.LogInformation("Login exitoso para usuario {UsuarioId}", usuario.Id);

        return new LoginResponse
        {
            Token = token,
            Rol = usuario.Rol.ToString(),
            Nombre = usuario.Nombre,
            ExpiraEn = expiraEn
        };
    }

    public async Task LogoutAsync(Guid userId, string nombreUsuario, string? ipOrigen, CancellationToken ct = default)
    {
        await auditRepo.AddAsync(new AuditLog
        {
            UsuarioId = userId,
            NombreUsuario = nombreUsuario,
            Accion = AccionAudit.Logout,
            Timestamp = DateTime.UtcNow,
            IpOrigen = ipOrigen
        }, ct).ConfigureAwait(false);

        logger.LogInformation("Logout registrado para usuario {UsuarioId}", userId);
    }

    private async Task RegistrarLoginFallidoAsync(string emailIntentado, string? ipOrigen, CancellationToken ct)
    {
        var hmacHash = ComputarHmacSha256(emailIntentado, auditSettings.Value.HmacKey);

        await auditRepo.AddAsync(new AuditLog
        {
            UsuarioId = null,
            NombreUsuario = null,
            Accion = AccionAudit.LoginFallido,
            DetalleExtra = hmacHash,
            Timestamp = DateTime.UtcNow,
            IpOrigen = ipOrigen
        }, ct).ConfigureAwait(false);
    }

    private static string ComputarHmacSha256(string data, string key)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
