namespace LosRalos.Application.DTOs.Audit;

public class AuditLogResponse
{
    public Guid Id { get; init; }
    public Guid? UsuarioId { get; init; }
    public string? NombreUsuario { get; init; }
    public string Accion { get; init; } = string.Empty;
    public Guid? ProfesionalId { get; init; }
    public string? DetalleExtra { get; init; }
    public DateTime Timestamp { get; init; }
    public string? IpOrigen { get; init; }
}
