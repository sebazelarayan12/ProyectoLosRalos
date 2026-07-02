using LosRalos.Application.Exceptions;
using LosRalos.Application.Interfaces;
using LosRalos.Application.Settings;
using Microsoft.Extensions.Options;

namespace LosRalos.Infrastructure.Services;

public class FileStorageService(IOptions<StorageSettings> settings) : IFileStorageService
{
    private record TipoPermitido(string ContentType, string Extension, byte[] MagicBytes);

    private static readonly TipoPermitido[] TiposPermitidos =
    [
        new("image/jpeg", ".jpg", [0xFF, 0xD8, 0xFF]),
        new("image/png", ".png", [0x89, 0x50, 0x4E, 0x47]),
        new("application/pdf", ".pdf", [0x25, 0x50, 0x44, 0x46])
    ];

    private string BasePath => settings.Value.BasePath;

    public async Task<ArchivoGuardado> GuardarAsync(Guid profesionalId, Stream contenido, string nombreOriginal, CancellationToken ct)
    {
        await using var limited = new LimitedStream(contenido, settings.Value.MaxFileSizeBytes);

        using var buffer = new MemoryStream();
        try
        {
            await limited.CopyToAsync(buffer, ct).ConfigureAwait(false);
        }
        catch (IOException)
        {
            throw new AppValidationException("archivo", "El archivo supera el tamanio maximo permitido de 10 MB.");
        }

        var bytes = buffer.ToArray();
        var tipo = DetectarTipo(bytes)
            ?? throw new AppValidationException("archivo", "Tipo de archivo no permitido. Solo se aceptan JPG, PNG y PDF.");

        var carpetaProfesional = Path.Combine(BasePath, profesionalId.ToString());
        Directory.CreateDirectory(carpetaProfesional);

        var nombreArchivo = $"{Guid.NewGuid()}{tipo.Extension}";
        var pathFisico = Path.Combine(carpetaProfesional, nombreArchivo);

        await File.WriteAllBytesAsync(pathFisico, bytes, ct).ConfigureAwait(false);

        var urlArchivo = Path.Combine(profesionalId.ToString(), nombreArchivo).Replace('\\', '/');

        return new ArchivoGuardado(urlArchivo, tipo.ContentType, bytes.LongLength, SanitizarNombre(nombreOriginal));
    }

    public async Task<Stream> AbrirAsync(string urlArchivo, CancellationToken ct)
    {
        var pathResuelto = ResolverPathSeguro(urlArchivo);
        var bytes = await File.ReadAllBytesAsync(pathResuelto, ct).ConfigureAwait(false);
        return new MemoryStream(bytes);
    }

    public void Eliminar(string urlArchivo)
    {
        var pathResuelto = ResolverPathSeguro(urlArchivo);
        if (File.Exists(pathResuelto))
            File.Delete(pathResuelto);
    }

    private string ResolverPathSeguro(string urlArchivo)
    {
        var baseCompleto = Path.GetFullPath(BasePath);
        var pathResuelto = Path.GetFullPath(Path.Combine(BasePath, urlArchivo));

        if (!pathResuelto.StartsWith(baseCompleto, StringComparison.Ordinal))
            throw new AppValidationException("urlArchivo", "Ruta de archivo invalida.");

        return pathResuelto;
    }

    private static TipoPermitido? DetectarTipo(byte[] bytes)
        => TiposPermitidos.FirstOrDefault(t =>
            bytes.Length >= t.MagicBytes.Length &&
            bytes.AsSpan(0, t.MagicBytes.Length).SequenceEqual(t.MagicBytes));

    private static string SanitizarNombre(string nombreOriginal)
    {
        var limpio = new string(nombreOriginal.Where(c => !char.IsControl(c)).ToArray());
        return limpio.Length > 255 ? limpio[..255] : limpio;
    }
}
