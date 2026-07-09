using LosRalos.Application.Entities.Enums;

namespace LosRalos.Application.DTOs.Profesionales;

public class ProfesionalResumenResponse
{
    public Guid Id { get; init; }
    public string Apellido { get; init; } = string.Empty;
    public string Nombre { get; init; } = string.Empty;
    public string Dni { get; init; } = string.Empty;
    public string? Cuil { get; init; }
    public string? Matricula { get; init; }
    public string Cargo { get; init; } = string.Empty;
    public string? NroExpediente { get; init; }
    public string? Tipo { get; init; }
}
