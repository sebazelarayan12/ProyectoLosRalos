using System.Security.Claims;
using LosRalos.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LosRalos.Api.Controllers;

[ApiController]
[Route("api/v1/documentos")]
[Authorize]
public class DocumentosController(IDocumentoService service) : ControllerBase
{
    [HttpGet("{id:guid}/file")]
    [Authorize(Roles = "Admin,Administrativo")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetFile(Guid id, [FromQuery] bool download, CancellationToken ct)
    {
        var usuarioId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var nombre = User.FindFirstValue("nombre") ?? string.Empty;
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        var archivo = await service.ObtenerArchivoAsync(id, usuarioId, nombre, ip, ct).ConfigureAwait(false);

        var disposition = download ? "attachment" : "inline";
        var encodedName = Uri.EscapeDataString(archivo.NombreOriginal);
        Response.Headers.ContentDisposition = $"{disposition}; filename*=UTF-8''{encodedName}";

        return File(archivo.Stream, archivo.ContentType);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin,Administrativo")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var usuarioId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var nombre = User.FindFirstValue("nombre") ?? string.Empty;
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        await service.EliminarAsync(id, usuarioId, nombre, ip, ct).ConfigureAwait(false);
        return NoContent();
    }
}
