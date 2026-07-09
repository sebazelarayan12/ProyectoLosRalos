namespace LosRalos.Application.DTOs.Profesionales;

public class ProfesionalDetalleResponse
{
    public Guid Id { get; init; }
    public string Apellido { get; init; } = string.Empty;
    public string Nombre { get; init; } = string.Empty;
    public string Dni { get; init; } = string.Empty;
    public string? Cuil { get; init; }
    public DateOnly FechaNacimiento { get; init; }
    public string Sexo { get; init; } = string.Empty;
    public string? EstadoCivil { get; init; }
    public string? Domicilio { get; init; }
    public string? Barrio { get; init; }
    public string Localidad { get; init; } = string.Empty;
    public string Provincia { get; init; } = string.Empty;
    public string? CodigoPostal { get; init; }
    public string? Telefono { get; init; }
    public string? Email { get; init; }
    public string? Matricula { get; init; }
    public string Cargo { get; init; } = string.Empty;
    public string AreaOperativa { get; init; } = string.Empty;
    public string TipoEfector { get; init; } = string.Empty;
    public string? Nivel { get; init; }
    public string? Planta { get; init; }
    public string? NroExpediente { get; init; }
    public string? Tipo { get; init; }
    public bool Activo { get; init; }
    public DateTime FechaCreacion { get; init; }
    public DateTime FechaActualizacion { get; init; }
    public List<DocumentoResumenResponse> Documentos { get; init; } = [];
}
