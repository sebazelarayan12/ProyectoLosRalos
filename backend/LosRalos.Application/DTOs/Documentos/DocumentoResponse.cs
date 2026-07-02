namespace LosRalos.Application.DTOs.Documentos;

public class DocumentoResponse
{
    public Guid Id { get; init; }
    public Guid ProfesionalId { get; init; }
    public TipoDocumentoResponse TipoDocumento { get; init; } = new();
    public string NombreOriginal { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
    public long TamanioBytes { get; init; }
    public DateTime FechaCarga { get; init; }
}
