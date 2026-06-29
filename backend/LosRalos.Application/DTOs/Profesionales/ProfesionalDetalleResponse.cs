namespace LosRalos.Application.DTOs.Profesionales;

public class ProfesionalDetalleResponse
{
    public Guid Id { get; init; }
    public string Apellido { get; init; } = string.Empty;
    public string Nombre { get; init; } = string.Empty;
    public string Dni { get; init; } = string.Empty;
    public string Cuil { get; init; } = string.Empty;
    public DateOnly FechaNacimiento { get; init; }
    public string Sexo { get; init; } = string.Empty;
    public string EstadoCivil { get; init; } = string.Empty;
    public string Domicilio { get; init; } = string.Empty;
    public string? Barrio { get; init; }
    public string Localidad { get; init; } = string.Empty;
    public string Provincia { get; init; } = string.Empty;
    public string? CodigoPostal { get; init; }
    public string? Telefono { get; init; }
    public string? Email { get; init; }
    public string Funcion { get; init; } = string.Empty;
    public string? Servicio { get; init; }
    public string Nivel { get; init; } = string.Empty;
    public string Planta { get; init; } = string.Empty;
    public string? NroExpediente { get; init; }
    public string Tipo { get; init; } = string.Empty;
    public bool Activo { get; init; }
    public DateTime FechaCreacion { get; init; }
    public DateTime FechaActualizacion { get; init; }
    public List<DocumentoResumenResponse> Documentos { get; init; } = [];
}
