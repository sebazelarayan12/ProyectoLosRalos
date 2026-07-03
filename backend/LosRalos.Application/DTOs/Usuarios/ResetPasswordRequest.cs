using System.ComponentModel.DataAnnotations;

namespace LosRalos.Application.DTOs.Usuarios;

public class ResetPasswordRequest
{
    [Required]
    [RegularExpression(@"^(?=.*\d).{8,}$", ErrorMessage = "La contrasenia debe tener minimo 8 caracteres y al menos 1 numero")]
    public string NuevaPassword { get; set; } = string.Empty;
}
