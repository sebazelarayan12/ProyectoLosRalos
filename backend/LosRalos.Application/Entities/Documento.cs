namespace LosRalos.Application.Entities;

public class Documento
{
    public Guid Id { get; set; }
    public Guid ProfesionalId { get; set; }
    public Guid TipoDocumentoId { get; set; }
    public string UrlArchivo { get; set; } = string.Empty;
    public string NombreOriginal { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long TamanioBytes { get; set; }
    public DateTime FechaCarga { get; set; }
    public Guid CargadoPorId { get; set; }
    public DateTime? EliminadoEn { get; set; }

    public TipoDocumento? TipoDocumento { get; set; }
}
