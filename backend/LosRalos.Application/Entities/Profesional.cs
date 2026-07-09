using LosRalos.Application.Entities.Enums;

namespace LosRalos.Application.Entities;

public class Profesional
{
    public Guid Id { get; set; }
    public string Apellido { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Dni { get; set; } = string.Empty;
    public string? Cuil { get; set; }
    public DateOnly FechaNacimiento { get; set; }
    public Sexo Sexo { get; set; }
    public EstadoCivil? EstadoCivil { get; set; }
    public string? Domicilio { get; set; }
    public string? Barrio { get; set; }
    public string Localidad { get; set; } = string.Empty;
    public string Provincia { get; set; } = "Tucuman";
    public string? CodigoPostal { get; set; }
    public string? Telefono { get; set; }
    public string? Email { get; set; }
    public string? Matricula { get; set; }
    public Guid CargoId { get; set; }
    public Cargo? Cargo { get; set; }
    public Guid AreaOperativaId { get; set; }
    public AreaOperativa? AreaOperativa { get; set; }
    public TipoEfector TipoEfector { get; set; }
    public Nivel? Nivel { get; set; }
    public Planta? Planta { get; set; }
    public string? NroExpediente { get; set; }
    public TipoLegajo? Tipo { get; set; }
    public bool Activo { get; set; } = true;
    public DateTime FechaCreacion { get; set; }
    public DateTime FechaActualizacion { get; set; }

    public ICollection<Documento> Documentos { get; set; } = new List<Documento>();
}
