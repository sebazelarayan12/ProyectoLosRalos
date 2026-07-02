namespace LosRalos.Application.Interfaces;

public record ArchivoGuardado(string UrlArchivo, string ContentType, long TamanioBytes, string NombreOriginalSanitizado);

public interface IFileStorageService
{
    Task<ArchivoGuardado> GuardarAsync(Guid profesionalId, Stream contenido, string nombreOriginal, CancellationToken ct);
    Task<Stream> AbrirAsync(string urlArchivo, CancellationToken ct);
    void Eliminar(string urlArchivo);
}
