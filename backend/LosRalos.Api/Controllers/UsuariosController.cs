using System.Security.Claims;
using LosRalos.Application.DTOs.Usuarios;
using LosRalos.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LosRalos.Api.Controllers;

[ApiController]
[Route("api/v1/usuarios")]
[Authorize(Roles = "Admin")]
public class UsuariosController(IUsuarioService service) : ControllerBase
{
    private Guid AdminId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private string AdminNombre => User.FindFirstValue("nombre") ?? string.Empty;
    private string? Ip => HttpContext.Connection.RemoteIpAddress?.ToString();

    [HttpGet]
    [ProducesResponseType(200)]
    public async Task<IActionResult> Search(
        [FromQuery] string? cursor, [FromQuery] int porPagina = 20, CancellationToken ct = default)
    {
        var result = await service.SearchAsync(cursor, porPagina, ct).ConfigureAwait(false);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(409)]
    public async Task<IActionResult> Create([FromBody] UsuarioRequest request, CancellationToken ct)
    {
        var result = await service.CreateAsync(request, AdminId, AdminNombre, Ip, ct).ConfigureAwait(false);
        return Created($"/api/v1/usuarios/{result.Id}", result);
    }

    [HttpPatch("{id:guid}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    [ProducesResponseType(409)]
    public async Task<IActionResult> Update(Guid id, [FromBody] PatchUsuarioRequest request, CancellationToken ct)
    {
        var result = await service.UpdateAsync(id, request, AdminId, AdminNombre, Ip, ct).ConfigureAwait(false);
        return Ok(result);
    }

    [HttpPatch("{id:guid}/activar")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Activar(Guid id, CancellationToken ct)
    {
        await service.ActivarAsync(id, AdminId, AdminNombre, Ip, ct).ConfigureAwait(false);
        return NoContent();
    }

    [HttpPatch("{id:guid}/desactivar")]
    [ProducesResponseType(204)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Desactivar(Guid id, CancellationToken ct)
    {
        await service.DesactivarAsync(id, AdminId, AdminNombre, Ip, ct).ConfigureAwait(false);
        return NoContent();
    }

    [HttpPost("{id:guid}/reset-password")]
    [ProducesResponseType(204)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> ResetPassword(Guid id, [FromBody] ResetPasswordRequest request, CancellationToken ct)
    {
        await service.ResetPasswordAsync(id, request, AdminId, AdminNombre, Ip, ct).ConfigureAwait(false);
        return NoContent();
    }
}
