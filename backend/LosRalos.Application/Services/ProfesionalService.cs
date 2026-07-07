using LosRalos.Application.DTOs.Profesionales;
using LosRalos.Application.DTOs.Shared;
using LosRalos.Application.Entities;
using LosRalos.Application.Entities.Enums;
using LosRalos.Application.Exceptions;
using LosRalos.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace LosRalos.Application.Services;

public class ProfesionalService(
    IProfesionalRepository repo,
    IAuditLogRepository auditRepo,
    ILogger<ProfesionalService> logger) : IProfesionalService
{
    public async Task<PaginatedResponse<ProfesionalResumenResponse>> SearchAsync(
        string? busqueda, TipoLegajo? tipo, Planta? planta, EstadoProfesionalFiltro? estado,
        string? cursor, int porPagina, CancellationToken ct)
    {
        var (items, nextCursor) = await repo.SearchAsync(busqueda, tipo, planta, estado, cursor, porPagina, ct)
            .ConfigureAwait(false);

        return new PaginatedResponse<ProfesionalResumenResponse>
        {
            Items = items.Select(p => p.ToResumenResponse()).ToList(),
            PorPagina = porPagina,
            HasNextPage = nextCursor is not null,
            Cursor = nextCursor
        };
    }

    public async Task<ProfesionalDetalleResponse> GetByIdAsync(
        Guid id, Guid usuarioId, string nombreUsuario, string? ip, CancellationToken ct = default)
    {
        var profesional = await repo.GetByIdAsync(id, ct).ConfigureAwait(false)
            ?? throw new NotFoundException("Profesional no encontrado");

        await auditRepo.AddAsync(new AuditLog
        {
            Id = Guid.NewGuid(),
            UsuarioId = usuarioId,
            NombreUsuario = nombreUsuario,
            Accion = AccionAudit.VerLegajo,
            ProfesionalId = profesional.Id,
            Timestamp = DateTime.UtcNow,
            IpOrigen = ip
        }, ct).ConfigureAwait(false);

        logger.LogInformation("Legajo {ProfesionalId} visto por {UsuarioId}", id, usuarioId);

        return profesional.ToDetalleResponse();
    }

    public async Task<ProfesionalDetalleResponse> CreateAsync(
        ProfesionalRequest request, Guid usuarioId, string nombreUsuario, string? ip, CancellationToken ct = default)
    {
        if (await repo.ExistsDniAsync(request.Dni, null, ct).ConfigureAwait(false))
            throw new ConflictException("El DNI ya existe en el sistema");

        if (await repo.ExistsCuilAsync(request.Cuil, null, ct).ConfigureAwait(false))
            throw new ConflictException("El CUIL ya existe en el sistema");

        var profesional = request.ToEntity();

        await repo.AddAsync(profesional, ct).ConfigureAwait(false);

        await auditRepo.AddAsync(new AuditLog
        {
            Id = Guid.NewGuid(),
            UsuarioId = usuarioId,
            NombreUsuario = nombreUsuario,
            Accion = AccionAudit.CrearProfesional,
            ProfesionalId = profesional.Id,
            Timestamp = DateTime.UtcNow,
            IpOrigen = ip
        }, ct).ConfigureAwait(false);

        logger.LogInformation("Profesional {ProfesionalId} creado por {UsuarioId}", profesional.Id, usuarioId);

        return profesional.ToDetalleResponse();
    }

    public async Task<ProfesionalDetalleResponse> UpdateAsync(
        Guid id, PatchProfesionalRequest request, Guid usuarioId, string nombreUsuario, string? ip, CancellationToken ct = default)
    {
        var profesional = await repo.GetByIdAsync(id, ct).ConfigureAwait(false)
            ?? throw new NotFoundException("Profesional no encontrado");

        if (request.Dni is not null && request.Dni != profesional.Dni &&
            await repo.ExistsDniAsync(request.Dni, profesional.Id, ct).ConfigureAwait(false))
            throw new ConflictException("El DNI ya existe en el sistema");

        if (request.Cuil is not null && request.Cuil != profesional.Cuil &&
            await repo.ExistsCuilAsync(request.Cuil, profesional.Id, ct).ConfigureAwait(false))
            throw new ConflictException("El CUIL ya existe en el sistema");

        var camposModificados = profesional.ApplyPatch(request);

        if (camposModificados.Count == 0)
            return profesional.ToDetalleResponse();

        await repo.UpdateAsync(profesional, ct).ConfigureAwait(false);

        await auditRepo.AddAsync(new AuditLog
        {
            Id = Guid.NewGuid(),
            UsuarioId = usuarioId,
            NombreUsuario = nombreUsuario,
            Accion = AccionAudit.EditarProfesional,
            ProfesionalId = profesional.Id,
            DetalleExtra = string.Join(",", camposModificados),
            Timestamp = DateTime.UtcNow,
            IpOrigen = ip
        }, ct).ConfigureAwait(false);

        logger.LogInformation("Profesional {ProfesionalId} editado por {UsuarioId}", id, usuarioId);

        return profesional.ToDetalleResponse();
    }

    public async Task DeactivateAsync(
        Guid id, Guid usuarioId, string nombreUsuario, string? ip, CancellationToken ct = default)
    {
        var profesional = await repo.GetByIdAsync(id, ct).ConfigureAwait(false)
            ?? throw new NotFoundException("Profesional no encontrado");

        profesional.Activo = false;

        await repo.UpdateAsync(profesional, ct).ConfigureAwait(false);

        await auditRepo.AddAsync(new AuditLog
        {
            Id = Guid.NewGuid(),
            UsuarioId = usuarioId,
            NombreUsuario = nombreUsuario,
            Accion = AccionAudit.DesactivarProfesional,
            ProfesionalId = profesional.Id,
            Timestamp = DateTime.UtcNow,
            IpOrigen = ip
        }, ct).ConfigureAwait(false);

        logger.LogInformation("Profesional {ProfesionalId} desactivado por {UsuarioId}", id, usuarioId);
    }

    public async Task ReactivarAsync(
        Guid id, Guid usuarioId, string nombreUsuario, string? ip, CancellationToken ct = default)
    {
        var profesional = await repo.GetByIdAsync(id, ct).ConfigureAwait(false)
            ?? throw new NotFoundException("Profesional no encontrado");

        profesional.Activo = true;

        await repo.UpdateAsync(profesional, ct).ConfigureAwait(false);

        await auditRepo.AddAsync(new AuditLog
        {
            Id = Guid.NewGuid(),
            UsuarioId = usuarioId,
            NombreUsuario = nombreUsuario,
            Accion = AccionAudit.ReactivarProfesional,
            ProfesionalId = profesional.Id,
            Timestamp = DateTime.UtcNow,
            IpOrigen = ip
        }, ct).ConfigureAwait(false);

        logger.LogInformation("Profesional {ProfesionalId} reactivado por {UsuarioId}", id, usuarioId);
    }

    public async Task EliminarDefinitivoAsync(
        Guid id, Guid usuarioId, string nombreUsuario, string? ip, CancellationToken ct = default)
    {
        var profesional = await repo.GetByIdAsync(id, ct).ConfigureAwait(false)
            ?? throw new NotFoundException("Profesional no encontrado");

        if (profesional.Documentos.Count > 0)
            throw new AppValidationException("documentos",
                "No se puede eliminar: el profesional tiene documentos cargados. Elimine los documentos primero.");

        await auditRepo.AddAsync(new AuditLog
        {
            Id = Guid.NewGuid(),
            UsuarioId = usuarioId,
            NombreUsuario = nombreUsuario,
            Accion = AccionAudit.EliminarProfesionalDefinitivo,
            ProfesionalId = profesional.Id,
            DetalleExtra = $"{profesional.Apellido}, {profesional.Nombre}, DNI {profesional.Dni}",
            Timestamp = DateTime.UtcNow,
            IpOrigen = ip
        }, ct).ConfigureAwait(false);

        await repo.DeleteAsync(profesional, ct).ConfigureAwait(false);

        logger.LogInformation("Profesional {ProfesionalId} eliminado definitivamente por {UsuarioId}", id, usuarioId);
    }
}
