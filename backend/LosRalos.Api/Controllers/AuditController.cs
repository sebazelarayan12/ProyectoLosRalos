using LosRalos.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LosRalos.Api.Controllers;

[ApiController]
[Route("api/v1/audit")]
[Authorize(Roles = "Admin")]
public class AuditController(IAuditService service) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(200)]
    public async Task<IActionResult> Search(
        [FromQuery] Guid? usuarioId,
        [FromQuery] Guid? profesionalId,
        [FromQuery] DateTime? desde,
        [FromQuery] DateTime? hasta,
        [FromQuery] string? cursor,
        [FromQuery] int porPagina = 50,
        CancellationToken ct = default)
    {
        var result = await service.SearchAsync(usuarioId, profesionalId, desde, hasta, cursor, porPagina, ct)
            .ConfigureAwait(false);
        return Ok(result);
    }
}
