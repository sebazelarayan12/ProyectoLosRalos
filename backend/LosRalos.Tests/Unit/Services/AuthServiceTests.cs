using FluentAssertions;
using LosRalos.Application.DTOs.Auth;
using LosRalos.Application.Entities;
using LosRalos.Application.Entities.Enums;
using LosRalos.Application.Exceptions;
using LosRalos.Application.Interfaces;
using LosRalos.Application.Services;
using LosRalos.Application.Settings;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using NSubstitute;

namespace LosRalos.Tests.Unit.Services;

public class AuthServiceTests
{
    private readonly IUsuarioRepository _usuarioRepo = Substitute.For<IUsuarioRepository>();
    private readonly IAuditLogRepository _auditRepo = Substitute.For<IAuditLogRepository>();
    private readonly IJwtService _jwtService = Substitute.For<IJwtService>();

    private readonly IPasswordHasher _passwordHasher = Substitute.For<IPasswordHasher>();

    private AuthService CrearServicio() => new(
        _usuarioRepo,
        _auditRepo,
        _jwtService,
        _passwordHasher,
        Options.Create(new JwtSettings { Secret = "test-secret-32-chars-minimum-ok", ExpiresInHours = 2 }),
        Options.Create(new AuditSettings { HmacKey = "test-hmac-key-32-chars-minimum-ok" }),
        NullLogger<AuthService>.Instance);

    private static Usuario UsuarioActivo() => new()
    {
        Id = Guid.NewGuid(),
        Nombre = "Juan Test",
        Email = "juan@hospital.com",
        PasswordHash = "hash-irrelevante-en-unit-test",
        Rol = RolUsuario.Visor,
        Activo = true,
        FechaCreacion = DateTime.UtcNow,
        FechaActualizacion = DateTime.UtcNow
    };

    [Fact]
    public async Task Login_CredencialesValidas_RetornaTokenYRegistraLogin()
    {
        var usuario = UsuarioActivo();
        _usuarioRepo.GetByEmailAsync(usuario.Email).Returns(usuario);
        _passwordHasher.Verify("Password123", usuario.PasswordHash).Returns(true);
        _jwtService.GenerateToken(usuario).Returns("token-generado");

        var resultado = await CrearServicio().LoginAsync(
            new LoginRequest { Email = usuario.Email, Password = "Password123" }, "1.2.3.4");

        resultado.Token.Should().Be("token-generado");
        resultado.Nombre.Should().Be(usuario.Nombre);
        resultado.Rol.Should().Be("Visor");

        await _auditRepo.Received(1).AddAsync(
            Arg.Is<AuditLog>(a => a.Accion == AccionAudit.Login && a.UsuarioId == usuario.Id));
    }

    [Fact]
    public async Task Login_EmailInexistente_LanzaUnauthorizedYRegistraLoginFallido()
    {
        _usuarioRepo.GetByEmailAsync(Arg.Any<string>()).Returns((Usuario?)null);

        var act = () => CrearServicio().LoginAsync(
            new LoginRequest { Email = "noexiste@hospital.com", Password = "Pass123" }, null);

        await act.Should().ThrowAsync<UnauthorizedException>();

        await _auditRepo.Received(1).AddAsync(
            Arg.Is<AuditLog>(a => a.Accion == AccionAudit.LoginFallido && a.UsuarioId == null));
    }

    [Fact]
    public async Task Login_PasswordIncorrecta_LanzaUnauthorizedYRegistraLoginFallido()
    {
        var usuario = UsuarioActivo();
        _usuarioRepo.GetByEmailAsync(usuario.Email).Returns(usuario);
        _passwordHasher.Verify("WrongPassword", usuario.PasswordHash).Returns(false);

        var act = () => CrearServicio().LoginAsync(
            new LoginRequest { Email = usuario.Email, Password = "WrongPassword" }, null);

        await act.Should().ThrowAsync<UnauthorizedException>();

        await _auditRepo.Received(1).AddAsync(
            Arg.Is<AuditLog>(a => a.Accion == AccionAudit.LoginFallido));
    }

    [Fact]
    public async Task Login_UsuarioInactivo_LanzaUnauthorizedYRegistraLoginFallido()
    {
        var usuario = UsuarioActivo();
        usuario.Activo = false;
        _usuarioRepo.GetByEmailAsync(usuario.Email).Returns(usuario);
        _passwordHasher.Verify("Password123", usuario.PasswordHash).Returns(true);

        var act = () => CrearServicio().LoginAsync(
            new LoginRequest { Email = usuario.Email, Password = "Password123" }, null);

        await act.Should().ThrowAsync<UnauthorizedException>();

        await _auditRepo.Received(1).AddAsync(
            Arg.Is<AuditLog>(a => a.Accion == AccionAudit.LoginFallido));
    }

    [Fact]
    public async Task Logout_RegistraAuditLog()
    {
        var userId = Guid.NewGuid();

        await CrearServicio().LogoutAsync(userId, "Juan Test", "1.2.3.4");

        await _auditRepo.Received(1).AddAsync(
            Arg.Is<AuditLog>(a => a.Accion == AccionAudit.Logout && a.UsuarioId == userId));
    }
}
