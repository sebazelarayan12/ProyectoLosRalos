using LosRalos.Application.DTOs.Documentos;

namespace LosRalos.Application.Interfaces;

public record ArchivoDescarga(Stream Stream, string ContentType, string NombreOriginal);

public interface IDocumentoService
{
    Task<DocumentoResponse> SubirAsync(
        Guid profesionalId, Stream archivo, string nombreOriginal, string tipoDocumentoNombre,
        Guid usuarioId, string nombreUsuario, string? ip, CancellationToken ct);

    Task<ArchivoDescarga> ObtenerArchivoAsync(
        Guid documentoId, Guid usuarioId, string nombreUsuario, string? ip, CancellationToken ct);

    Task EliminarAsync(Guid documentoId, Guid usuarioId, string nombreUsuario, string? ip, CancellationToken ct);

    Task<List<TipoDocumentoResponse>> ListarTiposAsync(CancellationToken ct);
}
