using System.Security.Claims;
using LosRalos.Application.DTOs.Auth;
using LosRalos.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace LosRalos.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController(IAuthService authService) : ControllerBase
{
    /// <summary>Autentica un usuario y retorna un JWT.</summary>
    [HttpPost("login")]
    [EnableRateLimiting("LoginRateLimit")]
    [ProducesResponseType<LoginResponse>(200)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var response = await authService.LoginAsync(request, ip, ct).ConfigureAwait(false);
        return Ok(response);
    }

    /// <summary>Registra el logout del usuario autenticado.</summary>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(204)]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var nombre = User.FindFirst("nombre")?.Value ?? string.Empty;
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        await authService.LogoutAsync(userId, nombre, ip, ct).ConfigureAwait(false);
        return NoContent();
    }
}
