namespace LosRalos.Application.DTOs.Documentos;

public class SegmentoDocumentoRequest
{
    public int PaginaInicio { get; init; }
    public int PaginaFin { get; init; }
    public string TipoDocumentoNombre { get; init; } = string.Empty;
}
