using System.Security.Claims;
using System.Text.Json;
using LosRalos.Application.DTOs.Documentos;
using LosRalos.Application.DTOs.Profesionales;
using LosRalos.Application.Entities.Enums;
using LosRalos.Application.Exceptions;
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
    [Authorize(Roles = "Admin,Administrativo")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> Search(
        [FromQuery] string? busqueda,
        [FromQuery] TipoLegajo? tipo,
        [FromQuery] Guid? areaOperativaId,
        [FromQuery] TipoEfector? tipoEfector,
        [FromQuery] EstadoProfesionalFiltro? estado,
        [FromQuery] OrdenarPor ordenarPor = OrdenarPor.ApellidoAsc,
        [FromQuery] string? cursor = null,
        [FromQuery] int porPagina = 20,
        CancellationToken ct = default)
    {
        var result = await service.SearchAsync(
                busqueda, tipo, areaOperativaId, tipoEfector, estado, ordenarPor, cursor, porPagina, ct)
            .ConfigureAwait(false);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Roles = "Admin,Administrativo")]
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
    [Authorize(Roles = "Admin,Administrativo")]
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
    [Authorize(Roles = "Admin,Administrativo")]
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
    [Authorize(Roles = "Admin,Administrativo")]
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

    [HttpPatch("{id:guid}/reactivar")]
    [Authorize(Roles = "Admin,Administrativo")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Reactivar(Guid id, CancellationToken ct)
    {
        var usuarioId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var nombre = User.FindFirstValue("nombre") ?? string.Empty;
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        await service.ReactivarAsync(id, usuarioId, nombre, ip, ct)
            .ConfigureAwait(false);
        return NoContent();
    }

    [HttpDelete("{id:guid}/definitivo")]
    [Authorize(Roles = "Admin,Administrativo")]
    [ProducesResponseType(204)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> EliminarDefinitivo(Guid id, CancellationToken ct)
    {
        var usuarioId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var nombre = User.FindFirstValue("nombre") ?? string.Empty;
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        await service.EliminarDefinitivoAsync(id, usuarioId, nombre, ip, ct)
            .ConfigureAwait(false);
        return NoContent();
    }

    [HttpPost("{id:guid}/documentos")]
    [Authorize(Roles = "Admin,Administrativo")]
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

    [HttpPost("{id:guid}/documentos/lote")]
    [Authorize(Roles = "Admin,Administrativo")]
    [ProducesResponseType(201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    [RequestSizeLimit(32 * 1024 * 1024)]
    public async Task<IActionResult> SubirLegajoCombinado(
        Guid id, IFormFile archivo, [FromForm] string segmentos, CancellationToken ct)
    {
        var usuarioId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var nombre = User.FindFirstValue("nombre") ?? string.Empty;
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        List<SegmentoDocumentoRequest> lista;
        try
        {
            lista = JsonSerializer.Deserialize<List<SegmentoDocumentoRequest>>(
                segmentos, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? [];
        }
        catch (JsonException)
        {
            throw new AppValidationException("segmentos", "El formato de los segmentos es invalido");
        }

        await using var stream = archivo.OpenReadStream();
        var result = await documentoService.SubirLoteAsync(
            id, stream, archivo.FileName, lista, usuarioId, nombre, ip, ct)
            .ConfigureAwait(false);

        return StatusCode(StatusCodes.Status201Created, result);
    }
}
