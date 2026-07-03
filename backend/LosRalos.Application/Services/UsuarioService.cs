using LosRalos.Application.DTOs.Shared;
using LosRalos.Application.DTOs.Usuarios;
using LosRalos.Application.Entities;
using LosRalos.Application.Entities.Enums;
using LosRalos.Application.Exceptions;
using LosRalos.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace LosRalos.Application.Services;

public class UsuarioService(
    IUsuarioRepository repo,
    IAuditLogRepository auditRepo,
    IPasswordHasher passwordHasher,
    ILogger<UsuarioService> logger) : IUsuarioService
{
    public async Task<PaginatedResponse<UsuarioResponse>> SearchAsync(string? cursor, int porPagina, CancellationToken ct)
    {
        var (items, nextCursor) = await repo.SearchAsync(cursor, porPagina, ct).ConfigureAwait(false);

        return new PaginatedResponse<UsuarioResponse>
        {
            Items = items.Select(u => u.ToResponse()).ToList(),
            PorPagina = porPagina,
            HasNextPage = nextCursor is not null,
            Cursor = nextCursor
        };
    }

    public async Task<UsuarioResponse> CreateAsync(
        UsuarioRequest request, Guid adminId, string adminNombre, string? ip, CancellationToken ct = default)
    {
        if (await repo.ExistsEmailAsync(request.Email, null, ct).ConfigureAwait(false))
            throw new ConflictException("El email ya existe en el sistema");

        var passwordHash = passwordHasher.Hash(request.Password);
        var usuario = request.ToEntity(passwordHash);

        await repo.AddAsync(usuario, ct).ConfigureAwait(false);

        await auditRepo.AddAsync(new AuditLog
        {
            Id = Guid.NewGuid(),
            UsuarioId = adminId,
            NombreUsuario = adminNombre,
            Accion = AccionAudit.CrearUsuario,
            DetalleExtra = usuario.Id.ToString(),
            Timestamp = DateTime.UtcNow,
            IpOrigen = ip
        }, ct).ConfigureAwait(false);

        logger.LogInformation("Usuario {UsuarioId} creado por {AdminId}", usuario.Id, adminId);

        return usuario.ToResponse();
    }

    public async Task<UsuarioResponse> UpdateAsync(
        Guid id, PatchUsuarioRequest request, Guid adminId, string adminNombre, string? ip, CancellationToken ct = default)
    {
        var usuario = await repo.GetByIdAsync(id, ct).ConfigureAwait(false)
            ?? throw new NotFoundException("Usuario no encontrado");

        if (request.Email is not null && request.Email != usuario.Email &&
            await repo.ExistsEmailAsync(request.Email, usuario.Id, ct).ConfigureAwait(false))
            throw new ConflictException("El email ya existe en el sistema");

        var rolCambio = request.Rol.HasValue && request.Rol.Value != usuario.Rol;

        if (rolCambio)
        {
            if (usuario.Id == adminId)
                throw new ForbiddenException("No podes cambiar tu propio rol");

            if (usuario.Rol == RolUsuario.Admin && usuario.Activo &&
                await repo.CountActiveAdminsAsync(ct).ConfigureAwait(false) <= 1)
                throw new ForbiddenException("No se puede cambiar el rol del ultimo admin activo");
        }

        var rolAnterior = usuario.Rol;
        var camposModificados = usuario.ApplyPatch(request);

        if (rolCambio)
        {
            usuario.Rol = request.Rol!.Value;
            camposModificados.Add(nameof(Usuario.Rol));
        }

        if (camposModificados.Count == 0)
            return usuario.ToResponse();

        await repo.UpdateAsync(usuario, ct).ConfigureAwait(false);

        if (rolCambio)
        {
            await auditRepo.AddAsync(new AuditLog
            {
                Id = Guid.NewGuid(),
                UsuarioId = adminId,
                NombreUsuario = adminNombre,
                Accion = AccionAudit.CambiarRol,
                DetalleExtra = $"{usuario.Id}:{rolAnterior}->{usuario.Rol}",
                Timestamp = DateTime.UtcNow,
                IpOrigen = ip
            }, ct).ConfigureAwait(false);
        }

        logger.LogInformation("Usuario {UsuarioId} editado por {AdminId}", id, adminId);

        return usuario.ToResponse();
    }

    public async Task ActivarAsync(Guid id, Guid adminId, string adminNombre, string? ip, CancellationToken ct = default)
    {
        var usuario = await repo.GetByIdAsync(id, ct).ConfigureAwait(false)
            ?? throw new NotFoundException("Usuario no encontrado");

        usuario.Activo = true;
        await repo.UpdateAsync(usuario, ct).ConfigureAwait(false);

        await auditRepo.AddAsync(new AuditLog
        {
            Id = Guid.NewGuid(),
            UsuarioId = adminId,
            NombreUsuario = adminNombre,
            Accion = AccionAudit.ActivarUsuario,
            DetalleExtra = usuario.Id.ToString(),
            Timestamp = DateTime.UtcNow,
            IpOrigen = ip
        }, ct).ConfigureAwait(false);

        logger.LogInformation("Usuario {UsuarioId} activado por {AdminId}", id, adminId);
    }

    public async Task DesactivarAsync(Guid id, Guid adminId, string adminNombre, string? ip, CancellationToken ct = default)
    {
        var usuario = await repo.GetByIdAsync(id, ct).ConfigureAwait(false)
            ?? throw new NotFoundException("Usuario no encontrado");

        if (usuario.Id == adminId)
            throw new ForbiddenException("No podes desactivarte a vos mismo");

        if (usuario.Rol == RolUsuario.Admin && usuario.Activo &&
            await repo.CountActiveAdminsAsync(ct).ConfigureAwait(false) <= 1)
            throw new ForbiddenException("No se puede desactivar al ultimo admin activo");

        usuario.Activo = false;
        await repo.UpdateAsync(usuario, ct).ConfigureAwait(false);

        await auditRepo.AddAsync(new AuditLog
        {
            Id = Guid.NewGuid(),
            UsuarioId = adminId,
            NombreUsuario = adminNombre,
            Accion = AccionAudit.DesactivarUsuario,
            DetalleExtra = usuario.Id.ToString(),
            Timestamp = DateTime.UtcNow,
            IpOrigen = ip
        }, ct).ConfigureAwait(false);

        logger.LogInformation("Usuario {UsuarioId} desactivado por {AdminId}", id, adminId);
    }

    public async Task ResetPasswordAsync(
        Guid id, ResetPasswordRequest request, Guid adminId, string adminNombre, string? ip, CancellationToken ct = default)
    {
        var usuario = await repo.GetByIdAsync(id, ct).ConfigureAwait(false)
            ?? throw new NotFoundException("Usuario no encontrado");

        usuario.PasswordHash = passwordHasher.Hash(request.NuevaPassword);
        await repo.UpdateAsync(usuario, ct).ConfigureAwait(false);

        await auditRepo.AddAsync(new AuditLog
        {
            Id = Guid.NewGuid(),
            UsuarioId = adminId,
            NombreUsuario = adminNombre,
            Accion = AccionAudit.ResetearPassword,
            DetalleExtra = usuario.Id.ToString(),
            Timestamp = DateTime.UtcNow,
            IpOrigen = ip
        }, ct).ConfigureAwait(false);

        logger.LogInformation("Password reseteada para usuario {UsuarioId} por {AdminId}", id, adminId);
    }
}
