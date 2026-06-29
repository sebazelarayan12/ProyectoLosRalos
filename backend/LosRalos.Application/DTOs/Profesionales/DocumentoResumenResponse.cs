namespace LosRalos.Application.DTOs.Profesionales;

public class DocumentoResumenResponse
{
    public Guid Id { get; init; }
    public string TipoDocumento { get; init; } = string.Empty;
    public string NombreOriginal { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
    public long TamanioBytes { get; init; }
    public DateTime FechaCarga { get; init; }
}
