using LosRalos.Application.Entities.Enums;

namespace LosRalos.Application.Entities;

public class Profesional
{
    public Guid Id { get; set; }
    public string Apellido { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Dni { get; set; } = string.Empty;
    public string Cuil { get; set; } = string.Empty;
    public DateOnly FechaNacimiento { get; set; }
    public Sexo Sexo { get; set; }
    public EstadoCivil EstadoCivil { get; set; }
    public string Domicilio { get; set; } = string.Empty;
    public string? Barrio { get; set; }
    public string Localidad { get; set; } = string.Empty;
    public string Provincia { get; set; } = "Tucuman";
    public string? CodigoPostal { get; set; }
    public string? Telefono { get; set; }
    public string? Email { get; set; }
    public string Funcion { get; set; } = string.Empty;
    public string? Servicio { get; set; }
    public Nivel Nivel { get; set; }
    public Planta Planta { get; set; }
    public string? NroExpediente { get; set; }
    public TipoLegajo Tipo { get; set; }
    public bool Activo { get; set; } = true;
    public DateTime FechaCreacion { get; set; }
    public DateTime FechaActualizacion { get; set; }
}
