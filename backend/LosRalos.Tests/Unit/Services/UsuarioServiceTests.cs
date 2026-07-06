using FluentAssertions;
using LosRalos.Application.DTOs.Usuarios;
using LosRalos.Application.Entities;
using LosRalos.Application.Entities.Enums;
using LosRalos.Application.Exceptions;
using LosRalos.Application.Interfaces;
using LosRalos.Application.Services;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;

namespace LosRalos.Tests.Unit.Services;

public class UsuarioServiceTests
{
    private readonly IUsuarioRepository _repo = Substitute.For<IUsuarioRepository>();
    private readonly IAuditLogRepository _auditRepo = Substitute.For<IAuditLogRepository>();
    private readonly IPasswordHasher _hasher = Substitute.For<IPasswordHasher>();

    private UsuarioService CrearServicio() => new(
        _repo,
        _auditRepo,
        _hasher,
        NullLogger<UsuarioService>.Instance);

    private static readonly Guid AdminId = Guid.NewGuid();
    private const string AdminNombre = "Admin Test";

    private static Usuario UsuarioActivo(RolUsuario rol = RolUsuario.Administrativo) => new()
    {
        Id = Guid.NewGuid(),
        Nombre = "Juan Perez",
        Email = "juan.perez@example.com",
        PasswordHash = "hash-existente",
        Rol = rol,
        Activo = true,
        FechaCreacion = DateTime.UtcNow,
        FechaActualizacion = DateTime.UtcNow
    };

    private static UsuarioRequest RequestValido() => new()
    {
        Nombre = "Maria Gomez",
        Email = "maria.gomez@example.com",
        Password = "password123",
        Rol = RolUsuario.Administrativo
    };

    [Fact]
    public async Task Create_EmailDuplicado_LanzaConflictException()
    {
        var req = RequestValido();
        _repo.ExistsEmailAsync(req.Email, null, Arg.Any<CancellationToken>()).Returns(true);

        var act = () => CrearServicio().CreateAsync(req, AdminId, AdminNombre, null);

        await act.Should().ThrowAsync<ConflictException>();
        await _repo.DidNotReceive().AddAsync(Arg.Any<Usuario>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Create_DatosValidos_HasheaPasswordCreaUsuarioYRegistraAudit()
    {
        var req = RequestValido();
        _repo.ExistsEmailAsync(req.Email, null, Arg.Any<CancellationToken>()).Returns(false);
        _hasher.Hash(req.Password).Returns("hash-generado");

        var result = await CrearServicio().CreateAsync(req, AdminId, AdminNombre, "1.2.3.4");

        result.Nombre.Should().Be(req.Nombre);
        result.Email.Should().Be(req.Email);
        result.Rol.Should().Be(nameof(RolUsuario.Administrativo));

        await _repo.Received(1).AddAsync(
            Arg.Is<Usuario>(u => u.Email == req.Email && u.PasswordHash == "hash-generado"),
            Arg.Any<CancellationToken>());

        await _auditRepo.Received(1).AddAsync(
            Arg.Is<AuditLog>(a => a.Accion == AccionAudit.CrearUsuario && a.UsuarioId == AdminId),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Update_UsuarioNoExistente_LanzaNotFoundException()
    {
        var id = Guid.NewGuid();
        _repo.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns((Usuario?)null);

        var act = () => CrearServicio().UpdateAsync(id, new PatchUsuarioRequest(), AdminId, AdminNombre, null);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Update_EmailDuplicado_LanzaConflictException()
    {
        var usuario = UsuarioActivo();
        var req = new PatchUsuarioRequest { Email = "otro@example.com" };

        _repo.GetByIdAsync(usuario.Id, Arg.Any<CancellationToken>()).Returns(usuario);
        _repo.ExistsEmailAsync(req.Email!, usuario.Id, Arg.Any<CancellationToken>()).Returns(true);

        var act = () => CrearServicio().UpdateAsync(usuario.Id, req, AdminId, AdminNombre, null);

        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task Update_NombreYEmail_ActualizaSinAuditarCambioDeRol()
    {
        var usuario = UsuarioActivo();
        var req = new PatchUsuarioRequest { Nombre = "Nuevo Nombre" };

        _repo.GetByIdAsync(usuario.Id, Arg.Any<CancellationToken>()).Returns(usuario);

        var result = await CrearServicio().UpdateAsync(usuario.Id, req, AdminId, AdminNombre, null);

        result.Nombre.Should().Be("Nuevo Nombre");

        await _repo.Received(1).UpdateAsync(
            Arg.Is<Usuario>(u => u.Nombre == "Nuevo Nombre"), Arg.Any<CancellationToken>());

        await _auditRepo.DidNotReceive().AddAsync(Arg.Any<AuditLog>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Update_CambioDeRol_ActualizaYRegistraCambiarRol()
    {
        var usuario = UsuarioActivo(RolUsuario.Administrativo);
        var req = new PatchUsuarioRequest { Rol = RolUsuario.Admin };

        _repo.GetByIdAsync(usuario.Id, Arg.Any<CancellationToken>()).Returns(usuario);

        var result = await CrearServicio().UpdateAsync(usuario.Id, req, AdminId, AdminNombre, null);

        result.Rol.Should().Be(nameof(RolUsuario.Admin));

        await _auditRepo.Received(1).AddAsync(
            Arg.Is<AuditLog>(a => a.Accion == AccionAudit.CambiarRol && a.UsuarioId == AdminId),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Update_CambiarPropioRol_LanzaForbiddenException()
    {
        var usuario = UsuarioActivo(RolUsuario.Admin);
        usuario.Id = AdminId;
        var req = new PatchUsuarioRequest { Rol = RolUsuario.Administrativo };

        _repo.GetByIdAsync(usuario.Id, Arg.Any<CancellationToken>()).Returns(usuario);

        var act = () => CrearServicio().UpdateAsync(usuario.Id, req, AdminId, AdminNombre, null);

        await act.Should().ThrowAsync<ForbiddenException>();
        await _repo.DidNotReceive().UpdateAsync(Arg.Any<Usuario>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Update_CambiarRolUltimoAdminActivo_LanzaForbiddenException()
    {
        var usuario = UsuarioActivo(RolUsuario.Admin);
        var req = new PatchUsuarioRequest { Rol = RolUsuario.Administrativo };

        _repo.GetByIdAsync(usuario.Id, Arg.Any<CancellationToken>()).Returns(usuario);
        _repo.CountActiveAdminsAsync(Arg.Any<CancellationToken>()).Returns(1);

        var act = () => CrearServicio().UpdateAsync(usuario.Id, req, AdminId, AdminNombre, null);

        await act.Should().ThrowAsync<ForbiddenException>();
        await _repo.DidNotReceive().UpdateAsync(Arg.Any<Usuario>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Activar_UsuarioExistente_ActivaYRegistraAudit()
    {
        var usuario = UsuarioActivo();
        usuario.Activo = false;
        _repo.GetByIdAsync(usuario.Id, Arg.Any<CancellationToken>()).Returns(usuario);

        await CrearServicio().ActivarAsync(usuario.Id, AdminId, AdminNombre, null);

        await _repo.Received(1).UpdateAsync(
            Arg.Is<Usuario>(u => u.Activo), Arg.Any<CancellationToken>());

        await _auditRepo.Received(1).AddAsync(
            Arg.Is<AuditLog>(a => a.Accion == AccionAudit.ActivarUsuario), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Activar_UsuarioNoExistente_LanzaNotFoundException()
    {
        var id = Guid.NewGuid();
        _repo.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns((Usuario?)null);

        var act = () => CrearServicio().ActivarAsync(id, AdminId, AdminNombre, null);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Desactivar_UsuarioExistente_DesactivaYRegistraAudit()
    {
        var usuario = UsuarioActivo();
        _repo.GetByIdAsync(usuario.Id, Arg.Any<CancellationToken>()).Returns(usuario);

        await CrearServicio().DesactivarAsync(usuario.Id, AdminId, AdminNombre, null);

        await _repo.Received(1).UpdateAsync(
            Arg.Is<Usuario>(u => !u.Activo), Arg.Any<CancellationToken>());

        await _auditRepo.Received(1).AddAsync(
            Arg.Is<AuditLog>(a => a.Accion == AccionAudit.DesactivarUsuario), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Desactivar_AutoDesactivacion_LanzaForbiddenException()
    {
        var usuario = UsuarioActivo(RolUsuario.Admin);
        usuario.Id = AdminId;
        _repo.GetByIdAsync(usuario.Id, Arg.Any<CancellationToken>()).Returns(usuario);

        var act = () => CrearServicio().DesactivarAsync(usuario.Id, AdminId, AdminNombre, null);

        await act.Should().ThrowAsync<ForbiddenException>();
        await _repo.DidNotReceive().UpdateAsync(Arg.Any<Usuario>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Desactivar_UltimoAdminActivo_LanzaForbiddenException()
    {
        var usuario = UsuarioActivo(RolUsuario.Admin);
        _repo.GetByIdAsync(usuario.Id, Arg.Any<CancellationToken>()).Returns(usuario);
        _repo.CountActiveAdminsAsync(Arg.Any<CancellationToken>()).Returns(1);

        var act = () => CrearServicio().DesactivarAsync(usuario.Id, AdminId, AdminNombre, null);

        await act.Should().ThrowAsync<ForbiddenException>();
        await _repo.DidNotReceive().UpdateAsync(Arg.Any<Usuario>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Desactivar_UsuarioNoExistente_LanzaNotFoundException()
    {
        var id = Guid.NewGuid();
        _repo.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns((Usuario?)null);

        var act = () => CrearServicio().DesactivarAsync(id, AdminId, AdminNombre, null);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task ResetPassword_UsuarioExistente_HasheaYRegistraAudit()
    {
        var usuario = UsuarioActivo();
        var req = new ResetPasswordRequest { NuevaPassword = "nuevaPassword1" };

        _repo.GetByIdAsync(usuario.Id, Arg.Any<CancellationToken>()).Returns(usuario);
        _hasher.Hash(req.NuevaPassword).Returns("hash-nuevo");

        await CrearServicio().ResetPasswordAsync(usuario.Id, req, AdminId, AdminNombre, null);

        await _repo.Received(1).UpdateAsync(
            Arg.Is<Usuario>(u => u.PasswordHash == "hash-nuevo"), Arg.Any<CancellationToken>());

        await _auditRepo.Received(1).AddAsync(
            Arg.Is<AuditLog>(a => a.Accion == AccionAudit.ResetearPassword), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ResetPassword_UsuarioNoExistente_LanzaNotFoundException()
    {
        var id = Guid.NewGuid();
        var req = new ResetPasswordRequest { NuevaPassword = "nuevaPassword1" };
        _repo.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns((Usuario?)null);

        var act = () => CrearServicio().ResetPasswordAsync(id, req, AdminId, AdminNombre, null);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Search_RetornaPaginaMapeada()
    {
        var usuarios = new List<Usuario> { UsuarioActivo() };
        _repo.SearchAsync(null, 20, Arg.Any<CancellationToken>()).Returns((usuarios, (string?)null));

        var result = await CrearServicio().SearchAsync(null, 20, CancellationToken.None);

        result.Items.Should().HaveCount(1);
        result.HasNextPage.Should().BeFalse();
    }
}
