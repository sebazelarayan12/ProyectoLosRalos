using System.ComponentModel.DataAnnotations;
using LosRalos.Application.Entities.Enums;

namespace LosRalos.Application.DTOs.Usuarios;

public class PatchUsuarioRequest
{
    [MaxLength(100)]
    public string? Nombre { get; set; }

    [MaxLength(150)]
    [EmailAddress]
    public string? Email { get; set; }

    public RolUsuario? Rol { get; set; }
}
