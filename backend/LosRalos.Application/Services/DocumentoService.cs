using LosRalos.Application.DTOs.Documentos;
using LosRalos.Application.Entities;
using LosRalos.Application.Entities.Enums;
using LosRalos.Application.Exceptions;
using LosRalos.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace LosRalos.Application.Services;

public class DocumentoService(
    IDocumentoRepository documentoRepo,
    ITipoDocumentoRepository tipoRepo,
    IProfesionalRepository profesionalRepo,
    IFileStorageService storage,
    IAuditLogRepository auditRepo,
    ILogger<DocumentoService> logger) : IDocumentoService
{
    public async Task<DocumentoResponse> SubirAsync(
        Guid profesionalId, Stream archivo, string nombreOriginal, string tipoDocumentoNombre,
        Guid usuarioId, string nombreUsuario, string? ip, CancellationToken ct)
    {
        _ = await profesionalRepo.GetByIdAsync(profesionalId, ct).ConfigureAwait(false)
            ?? throw new NotFoundException("Profesional no encontrado");

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

        return documento.ToResponse();
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
