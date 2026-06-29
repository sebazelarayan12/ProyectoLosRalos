using LosRalos.Application.Entities.Enums;

namespace LosRalos.Application.DTOs.Profesionales;

public class ProfesionalResumenResponse
{
    public Guid Id { get; init; }
    public string Apellido { get; init; } = string.Empty;
    public string Nombre { get; init; } = string.Empty;
    public string Funcion { get; init; } = string.Empty;
    public string? Servicio { get; init; }
    public string? NroExpediente { get; init; }
    public string Tipo { get; init; } = string.Empty;
}
