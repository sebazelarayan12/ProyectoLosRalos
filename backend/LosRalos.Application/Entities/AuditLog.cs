using LosRalos.Application.Entities.Enums;

namespace LosRalos.Application.Entities;

public class AuditLog
{
    public Guid Id { get; set; }
    public Guid? UsuarioId { get; set; }
    public string? NombreUsuario { get; set; }
    public AccionAudit Accion { get; set; }
    public Guid? ProfesionalId { get; set; }
    public string? DetalleExtra { get; set; }
    public DateTime Timestamp { get; set; }
    public string? IpOrigen { get; set; }

    public Usuario? Usuario { get; set; }
}
