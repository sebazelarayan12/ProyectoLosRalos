using LosRalos.Application.DTOs.Documentos;
using LosRalos.Application.Entities;
using LosRalos.Application.Entities.Enums;
using LosRalos.Application.Exceptions;
using LosRalos.Application.Interfaces;
using LosRalos.Application.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace LosRalos.Application.Services;

public class DocumentoService(
    IDocumentoRepository documentoRepo,
    ITipoDocumentoRepository tipoRepo,
    IProfesionalRepository profesionalRepo,
    IFileStorageService storage,
    IAuditLogRepository auditRepo,
    IPdfSplitterService pdfSplitter,
    IOptions<StorageSettings> storageSettings,
    ILogger<DocumentoService> logger) : IDocumentoService
{
    public async Task<DocumentoResponse> SubirAsync(
        Guid profesionalId, Stream archivo, string nombreOriginal, string tipoDocumentoNombre,
        Guid usuarioId, string nombreUsuario, string? ip, CancellationToken ct)
    {
        _ = await profesionalRepo.GetByIdAsync(profesionalId, ct).ConfigureAwait(false)
            ?? throw new NotFoundException("Profesional no encontrado");

        var documento = await GuardarInternoAsync(
            profesionalId, archivo, nombreOriginal, tipoDocumentoNombre, usuarioId, nombreUsuario, ip, ct)
            .ConfigureAwait(false);

        return documento.ToResponse();
    }

    public async Task<List<DocumentoResponse>> SubirLoteAsync(
        Guid profesionalId, Stream archivo, string nombreOriginal, List<SegmentoDocumentoRequest> segmentos,
        Guid usuarioId, string nombreUsuario, string? ip, CancellationToken ct)
    {
        _ = await profesionalRepo.GetByIdAsync(profesionalId, ct).ConfigureAwait(false)
            ?? throw new NotFoundException("Profesional no encontrado");

        if (segmentos.Count == 0)
            throw new AppValidationException("segmentos", "Debe definir al menos un segmento");

        using var buffer = new MemoryStream();
        await archivo.CopyToAsync(buffer, ct).ConfigureAwait(false);
        if (buffer.Length > storageSettings.Value.MaxLoteFileSizeBytes)
            throw new AppValidationException("archivo", "El archivo combinado supera el tamanio maximo permitido.");
        buffer.Position = 0;

        if (!EsPdf(buffer))
            throw new AppValidationException("archivo", "El archivo no es un PDF valido.");

        var totalPaginas = EjecutarPdf(() => pdfSplitter.ContarPaginas(buffer));
        var ordenados = segmentos.OrderBy(s => s.PaginaInicio).ToList();

        for (var i = 0; i < ordenados.Count; i++)
        {
            var segmento = ordenados[i];
            if (segmento.PaginaInicio < 1 || segmento.PaginaFin < segmento.PaginaInicio || segmento.PaginaFin > totalPaginas)
                throw new AppValidationException(
                    "segmentos", $"Rango de paginas invalido: {segmento.PaginaInicio}-{segmento.PaginaFin}");

            if (i > 0 && segmento.PaginaInicio <= ordenados[i - 1].PaginaFin)
                throw new AppValidationException("segmentos", "Los rangos de paginas no pueden superponerse");
        }

        var resultado = new List<DocumentoResponse>();
        var nombreBase = Path.GetFileNameWithoutExtension(nombreOriginal);

        foreach (var segmento in ordenados)
        {
            using var segmentoStream = EjecutarPdf(
                () => pdfSplitter.ExtraerRango(buffer, segmento.PaginaInicio, segmento.PaginaFin));
            var nombreSegmento = $"{nombreBase}_p{segmento.PaginaInicio}-{segmento.PaginaFin}.pdf";

            var documento = await GuardarInternoAsync(
                profesionalId, segmentoStream, nombreSegmento, segmento.TipoDocumentoNombre,
                usuarioId, nombreUsuario, ip, ct).ConfigureAwait(false);

            resultado.Add(documento.ToResponse());
        }

        return resultado;
    }

    private static readonly byte[] MagicBytesPdf = [0x25, 0x50, 0x44, 0x46];

    private static bool EsPdf(MemoryStream buffer)
    {
        var bytes = buffer.GetBuffer();
        return buffer.Length >= MagicBytesPdf.Length &&
               bytes.AsSpan(0, MagicBytesPdf.Length).SequenceEqual(MagicBytesPdf);
    }

    // Cualquier fallo de la libreria de PDF (archivo truncado, protegido con contrasenia,
    // estructura corrupta) es un error de input del usuario, no un error del servidor.
    private static T EjecutarPdf<T>(Func<T> operacion)
    {
        try
        {
            return operacion();
        }
        catch (Exception ex) when (ex is not AppValidationException and not OperationCanceledException)
        {
            throw new AppValidationException(
                "archivo", "El PDF no se pudo procesar; puede estar danado o protegido con contrasenia.");
        }
    }

    private async Task<Documento> GuardarInternoAsync(
        Guid profesionalId, Stream archivo, string nombreOriginal, string tipoDocumentoNombre,
        Guid usuarioId, string nombreUsuario, string? ip, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(tipoDocumentoNombre))
            throw new AppValidationException("tipoDocumentoNombre", "El tipo de documento es requerido");

        var tipo = await tipoRepo.GetOrCreateAsync(tipoDocumentoNombre, ct).ConfigureAwait(false);
        var guardado = await storage.GuardarAsync(profesionalId, archivo, nombreOriginal, ct).ConfigureAwait(false);

        var documento = new Documento
        {
            Id = Guid.NewGuid(),
            ProfesionalId = profesionalId,
            TipoDocumentoId = tipo.Id,
            TipoDocumento = tipo,
            UrlArchivo = guardado.UrlArchivo,
            NombreOriginal = guardado.NombreOriginalSanitizado,
            ContentType = guardado.ContentType,
            TamanioBytes = guardado.TamanioBytes,
            FechaCarga = DateTime.UtcNow,
            CargadoPorId = usuarioId
        };

        await documentoRepo.AddAsync(documento, ct).ConfigureAwait(false);

        await auditRepo.AddAsync(new AuditLog
        {
            Id = Guid.NewGuid(),
            UsuarioId = usuarioId,
            NombreUsuario = nombreUsuario,
            Accion = AccionAudit.SubirDocumento,
            ProfesionalId = profesionalId,
            DetalleExtra = $"{tipo.Nombre}, {guardado.TamanioBytes} bytes",
            Timestamp = DateTime.UtcNow,
            IpOrigen = ip
        }, ct).ConfigureAwait(false);

        logger.LogInformation("Documento {DocumentoId} subido para profesional {ProfesionalId} por {UsuarioId}",
            documento.Id, profesionalId, usuarioId);

        return documento;
    }

    public async Task<ArchivoDescarga> ObtenerArchivoAsync(
        Guid documentoId, Guid usuarioId, string nombreUsuario, string? ip, CancellationToken ct)
    {
        var documento = await documentoRepo.GetByIdAsync(documentoId, ct).ConfigureAwait(false)
            ?? throw new NotFoundException("Documento no encontrado");

        var stream = await storage.AbrirAsync(documento.UrlArchivo, ct).ConfigureAwait(false);

        await auditRepo.AddAsync(new AuditLog
        {
            Id = Guid.NewGuid(),
            UsuarioId = usuarioId,
            NombreUsuario = nombreUsuario,
            Accion = AccionAudit.VerDocumento,
            ProfesionalId = documento.ProfesionalId,
            DetalleExtra = documento.TipoDocumento?.Nombre,
            Timestamp = DateTime.UtcNow,
            IpOrigen = ip
        }, ct).ConfigureAwait(false);

        logger.LogInformation("Documento {DocumentoId} visto por {UsuarioId}", documentoId, usuarioId);

        return new ArchivoDescarga(stream, documento.ContentType, documento.NombreOriginal);
    }

    public async Task EliminarAsync(Guid documentoId, Guid usuarioId, string nombreUsuario, string? ip, CancellationToken ct)
    {
        var documento = await documentoRepo.GetByIdAsync(documentoId, ct).ConfigureAwait(false)
            ?? throw new NotFoundException("Documento no encontrado");

        documento.EliminadoEn = DateTime.UtcNow;
        storage.Eliminar(documento.UrlArchivo);

        await documentoRepo.UpdateAsync(documento, ct).ConfigureAwait(false);

        await auditRepo.AddAsync(new AuditLog
        {
            Id = Guid.NewGuid(),
            UsuarioId = usuarioId,
            NombreUsuario = nombreUsuario,
            Accion = AccionAudit.EliminarDocumento,
            ProfesionalId = documento.ProfesionalId,
            DetalleExtra = documento.TipoDocumento?.Nombre,
            Timestamp = DateTime.UtcNow,
            IpOrigen = ip
        }, ct).ConfigureAwait(false);

        logger.LogInformation("Documento {DocumentoId} eliminado por {UsuarioId}", documentoId, usuarioId);
    }

    public async Task<List<TipoDocumentoResponse>> ListarTiposAsync(CancellationToken ct)
    {
        var tipos = await tipoRepo.ListAllAsync(ct).ConfigureAwait(false);
        return tipos.Select(t => t.ToResponse()).ToList();
    }
}
