using LosRalos.Application.Entities;

namespace LosRalos.Application.DTOs.Audit;

public static class AuditMappingExtensions
{
    public static AuditLogResponse ToResponse(this AuditLog a) => new()
    {
        Id = a.Id,
        UsuarioId = a.UsuarioId,
        NombreUsuario = a.NombreUsuario,
        Accion = a.Accion.ToString(),
        ProfesionalId = a.ProfesionalId,
        DetalleExtra = a.DetalleExtra,
        Timestamp = a.Timestamp,
        IpOrigen = a.IpOrigen
    };
}
