using System.ComponentModel.DataAnnotations;
using LosRalos.Application.Entities.Enums;

namespace LosRalos.Application.DTOs.Usuarios;

public class UsuarioRequest
{
    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [RegularExpression(@"^(?=.*\d).{8,}$", ErrorMessage = "La contrasenia debe tener minimo 8 caracteres y al menos 1 numero")]
    public string Password { get; set; } = string.Empty;

    [Required]
    public RolUsuario Rol { get; set; }
}
