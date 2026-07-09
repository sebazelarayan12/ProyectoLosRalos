using LosRalos.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LosRalos.Api.Controllers;

[ApiController]
[Route("api/v1/areas-operativas")]
[Authorize]
public class AreasOperativasController(IProfesionalService service) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = "Admin,Administrativo")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var result = await service.ListarAreasOperativasAsync(ct).ConfigureAwait(false);
        return Ok(result);
    }
}
