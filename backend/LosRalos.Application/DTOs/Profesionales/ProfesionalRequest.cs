using System.ComponentModel.DataAnnotations;
using LosRalos.Application.Entities.Enums;

namespace LosRalos.Application.DTOs.Profesionales;

public class ProfesionalRequest
{
    [Required]
    [MaxLength(100)]
    public string Apellido { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [Required]
    [RegularExpression(@"^\d{1,2}\.\d{3}\.\d{3}$", ErrorMessage = "Formato de DNI invalido. Ejemplo: 12.345.678")]
    public string Dni { get; set; } = string.Empty;

    [RegularExpression(@"^\d{2}-\d{8}-\d{1}$", ErrorMessage = "Formato de CUIL invalido. Ejemplo: 20-12345678-0")]
    public string? Cuil { get; set; }

    [Required]
    public DateOnly FechaNacimiento { get; set; }

    [Required]
    public Sexo Sexo { get; set; }

    public EstadoCivil? EstadoCivil { get; set; }

    [MaxLength(200)]
    public string? Domicilio { get; set; }

    [MaxLength(100)]
    public string? Barrio { get; set; }

    [Required]
    [MaxLength(100)]
    public string Localidad { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Provincia { get; set; } = "Tucuman";

    [MaxLength(10)]
    public string? CodigoPostal { get; set; }

    [MaxLength(20)]
    public string? Telefono { get; set; }

    [MaxLength(150)]
    [EmailAddress]
    public string? Email { get; set; }

    [MaxLength(50)]
    public string? Matricula { get; set; }

    [Required]
    [MaxLength(100)]
    public string Cargo { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string AreaOperativa { get; set; } = string.Empty;

    [Required]
    public TipoEfector TipoEfector { get; set; }

    public Nivel? Nivel { get; set; }

    public Planta? Planta { get; set; }

    [MaxLength(50)]
    public string? NroExpediente { get; set; }

    public TipoLegajo? Tipo { get; set; }
}
