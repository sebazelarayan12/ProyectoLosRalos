using LosRalos.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LosRalos.Api.Controllers;

[ApiController]
[Route("api/v1/tipos-documento")]
[Authorize]
public class TiposDocumentoController(IDocumentoService service) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = "Admin,Administrativo")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var result = await service.ListarTiposAsync(ct).ConfigureAwait(false);
        return Ok(result);
    }
}
