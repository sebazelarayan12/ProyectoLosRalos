using LosRalos.Application.Entities;

namespace LosRalos.Application.DTOs.Usuarios;

public static class UsuarioMappingExtensions
{
    public static UsuarioResponse ToResponse(this Usuario u) => new()
    {
        Id = u.Id,
        Nombre = u.Nombre,
        Email = u.Email,
        Rol = u.Rol.ToString(),
        Activo = u.Activo,
        UltimoAcceso = u.UltimoAcceso,
        FechaCreacion = u.FechaCreacion
    };

    public static Usuario ToEntity(this UsuarioRequest req, string passwordHash) => new()
    {
        Id = Guid.NewGuid(),
        Nombre = req.Nombre,
        Email = req.Email,
        PasswordHash = passwordHash,
        Rol = req.Rol,
        Activo = true,
        FechaCreacion = DateTime.UtcNow,
        FechaActualizacion = DateTime.UtcNow
    };

    public static List<string> ApplyPatch(this Usuario u, PatchUsuarioRequest req)
    {
        var changed = new List<string>();

        if (req.Nombre is not null && req.Nombre != u.Nombre)
        { u.Nombre = req.Nombre; changed.Add(nameof(Usuario.Nombre)); }

        if (req.Email is not null && req.Email != u.Email)
        { u.Email = req.Email; changed.Add(nameof(Usuario.Email)); }

        return changed;
    }
}
