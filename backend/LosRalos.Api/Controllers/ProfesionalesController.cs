using System.Security.Claims;
using LosRalos.Application.DTOs.Profesionales;
using LosRalos.Application.Entities.Enums;
using LosRalos.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LosRalos.Api.Controllers;

[ApiController]
[Route("api/v1/profesionales")]
[Authorize]
public class ProfesionalesController(IProfesionalService service, IDocumentoService documentoService) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = "Admin,Visor")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> Search(
        [FromQuery] string? busqueda,
        [FromQuery] TipoLegajo? tipo,
        [FromQuery] Planta? planta,
        [FromQuery] string? cursor,
        [FromQuery] int porPagina = 20,
        CancellationToken ct = default)
    {
        var result = await service.SearchAsync(busqueda, tipo, planta, cursor, porPagina, ct)
            .ConfigureAwait(false);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Roles = "Admin,Visor")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var usuarioId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var nombre = User.FindFirstValue("nombre") ?? string.Empty;
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        var result = await service.GetByIdAsync(id, usuarioId, nombre, ip, ct)
            .ConfigureAwait(false);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(409)]
    public async Task<IActionResult> Create([FromBody] ProfesionalRequest request, CancellationToken ct)
    {
        var usuarioId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var nombre = User.FindFirstValue("nombre") ?? string.Empty;
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        var result = await service.CreateAsync(request, usuarioId, nombre, ip, ct)
            .ConfigureAwait(false);

        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPatch("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    [ProducesResponseType(409)]
    public async Task<IActionResult> Update(Guid id, [FromBody] PatchProfesionalRequest request, CancellationToken ct)
    {
        var usuarioId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var nombre = User.FindFirstValue("nombre") ?? string.Empty;
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        var result = await service.UpdateAsync(id, request, usuarioId, nombre, ip, ct)
            .ConfigureAwait(false);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken ct)
    {
        var usuarioId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var nombre = User.FindFirstValue("nombre") ?? string.Empty;
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        await service.DeactivateAsync(id, usuarioId, nombre, ip, ct)
            .ConfigureAwait(false);
        return NoContent();
    }

    [HttpPost("{id:guid}/documentos")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    [RequestSizeLimit(11 * 1024 * 1024)]
    public async Task<IActionResult> SubirDocumento(
        Guid id, IFormFile archivo, [FromForm] string tipoDocumentoNombre, CancellationToken ct)
    {
        var usuarioId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var nombre = User.FindFirstValue("nombre") ?? string.Empty;
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        await using var stream = archivo.OpenReadStream();
        var result = await documentoService.SubirAsync(
            id, stream, archivo.FileName, tipoDocumentoNombre, usuarioId, nombre, ip, ct)
            .ConfigureAwait(false);

        return CreatedAtAction(
            nameof(DocumentosController.GetFile), "Documentos", new { id = result.Id }, result);
    }
}
