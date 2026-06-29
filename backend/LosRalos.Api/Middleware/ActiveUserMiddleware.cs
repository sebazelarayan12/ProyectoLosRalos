using System.Security.Claims;
using LosRalos.Application.Interfaces;

namespace LosRalos.Api.Middleware;

public class ActiveUserMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, IUsuarioRepository usuarioRepo)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (Guid.TryParse(userIdClaim, out var userId))
            {
                var isActive = await usuarioRepo.ExistsActiveAsync(userId, context.RequestAborted)
                    .ConfigureAwait(false);

                if (!isActive)
                {
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    await context.Response.WriteAsJsonAsync(
                        new { type = "Unauthorized", message = "Usuario desactivado o no encontrado" });
                    return;
                }
            }
        }

        await next(context);
    }
}
