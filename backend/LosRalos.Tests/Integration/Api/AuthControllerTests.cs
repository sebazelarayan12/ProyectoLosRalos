using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using LosRalos.Application.DTOs.Auth;
using LosRalos.Application.Entities;
using LosRalos.Application.Entities.Enums;
using LosRalos.Application.Interfaces;
using LosRalos.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;

namespace LosRalos.Tests.Integration.Api;

public class AuthControllerTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16")
        .Build();

    private WebApplicationFactory<Program> _factory = null!;
    private HttpClient _client = null!;

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();

        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseEnvironment("Testing");
                builder.ConfigureServices(services =>
                {
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                    if (descriptor is not null) services.Remove(descriptor);

                    services.AddDbContext<AppDbContext>((sp, opts) =>
                        opts.UseNpgsql(_postgres.GetConnectionString())
                            .AddInterceptors(sp.GetRequiredService<LosRalos.Infrastructure.Persistence.Interceptors.TimestampInterceptor>()));
                });
                builder.ConfigureAppConfiguration((_, config) =>
                {
                    config.AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        ["Jwt:Secret"] = "test-secret-de-minimo-32-caracteres-ok",
                        ["Audit:HmacKey"] = "test-hmac-key-32-caracteres-minimo"
                    });
                });
            });

        _client = _factory.CreateClient();

        await SeedAsync();
    }

    public async Task DisposeAsync()
    {
        _client.Dispose();
        await _factory.DisposeAsync();
        await _postgres.DisposeAsync();
    }

    private async Task SeedAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        await db.Database.MigrateAsync();

        db.Usuarios.Add(new Usuario
        {
            Id = Guid.NewGuid(),
            Nombre = "Admin Test",
            Email = "admin@test.com",
            PasswordHash = hasher.Hash("Test1234"),
            Rol = RolUsuario.Admin,
            Activo = true,
            FechaCreacion = DateTime.UtcNow,
            FechaActualizacion = DateTime.UtcNow
        });

        db.Usuarios.Add(new Usuario
        {
            Id = Guid.NewGuid(),
            Nombre = "Usuario Inactivo",
            Email = "inactivo@test.com",
            PasswordHash = hasher.Hash("Test1234"),
            Rol = RolUsuario.Administrativo,
            Activo = false,
            FechaCreacion = DateTime.UtcNow,
            FechaActualizacion = DateTime.UtcNow
        });

        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task Login_CredencialesValidas_Retorna200ConToken()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login",
            new { email = "admin@test.com", password = "Test1234" });

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<LoginResponse>();
        body!.Token.Should().NotBeNullOrEmpty();
        body.Rol.Should().Be("Admin");
        body.Nombre.Should().Be("Admin Test");
    }

    [Fact]
    public async Task Login_PasswordIncorrecta_Retorna401()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login",
            new { email = "admin@test.com", password = "WrongPass" });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_EmailInexistente_Retorna401()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login",
            new { email = "noexiste@test.com", password = "Test1234" });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_UsuarioInactivo_Retorna401()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login",
            new { email = "inactivo@test.com", password = "Test1234" });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Logout_SinToken_Retorna401()
    {
        var response = await _client.PostAsync("/api/v1/auth/logout", null);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Logout_ConTokenValido_Retorna204()
    {
        var loginResp = await _client.PostAsJsonAsync("/api/v1/auth/login",
            new { email = "admin@test.com", password = "Test1234" });
        var loginBody = await loginResp.Content.ReadFromJsonAsync<LoginResponse>();

        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", loginBody!.Token);

        var response = await _client.PostAsync("/api/v1/auth/logout", null);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Logout_ConMetodoGet_Retorna405()
    {
        var response = await _client.GetAsync("/api/v1/auth/logout");

        response.StatusCode.Should().Be(HttpStatusCode.MethodNotAllowed);
    }

    [Fact]
    public async Task Login_SeisIntentosFallidos_SextoRetorna429()
    {
        for (var i = 0; i < 5; i++)
        {
            var resp = await _client.PostAsJsonAsync("/api/v1/auth/login",
                new { email = "admin@test.com", password = "WrongPass" });
            resp.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }

        var sexto = await _client.PostAsJsonAsync("/api/v1/auth/login",
            new { email = "admin@test.com", password = "WrongPass" });

        sexto.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);
    }
}
