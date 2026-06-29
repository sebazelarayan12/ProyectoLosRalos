using System.Text.Json;
using LosRalos.Application.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace LosRalos.Api.Middleware;

public class GlobalExceptionHandlerMiddleware(RequestDelegate next, ILogger<GlobalExceptionHandlerMiddleware> logger, IHostEnvironment env)
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception ex)
    {
        context.Response.ContentType = "application/json";

        var (statusCode, type, message, errors) = ex switch
        {
            UnauthorizedException e => (401, "Unauthorized", e.Message, (Dictionary<string, string>?)null),
            ForbiddenException e => (403, "Forbidden", e.Message, null),
            NotFoundException e => (404, "NotFound", e.Message, null),
            AppValidationException e => (400, "ValidationError", e.Message, e.Errors),
            _ => (500, "InternalServerError", "Se produjo un error inesperado.", null)
        };

        if (statusCode == 500)
            logger.LogError(ex, "Error no manejado");

        context.Response.StatusCode = statusCode;

        object body = errors is not null
            ? new { type, message, errors }
            : new { type, message };

        if (statusCode == 500 && env.IsDevelopment())
        {
            body = new { type, message, detail = ex.ToString() };
        }

        await context.Response.WriteAsync(JsonSerializer.Serialize(body, JsonOptions));
    }
}
