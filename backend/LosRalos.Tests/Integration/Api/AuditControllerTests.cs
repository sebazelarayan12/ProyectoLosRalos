using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using LosRalos.Application.DTOs.Auth;
using LosRalos.Application.Entities;
using LosRalos.Application.Interfaces;
using LosRalos.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;

namespace LosRalos.Tests.Integration.Api;

public class AuditControllerTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16")
        .Build();

    private WebApplicationFactory<Program> _factory = null!;
    private HttpClient _adminClient = null!;
    private HttpClient _visorClient = null!;
    private HttpClient _anonClient = null!;

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

        _anonClient = _factory.CreateClient();
        await SeedAsync();
        _adminClient = await BuildClientAsync("admin@test.com", "Test1234");
        _visorClient = await BuildClientAsync("visor@test.com", "Test1234");
    }

    public async Task DisposeAsync()
    {
        _adminClient.Dispose();
        _visorClient.Dispose();
        _anonClient.Dispose();
        await _factory.DisposeAsync();
        await _postgres.DisposeAsync();
    }

    private Guid _adminUsuarioId;

    private async Task SeedAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        await db.Database.MigrateAsync();

        _adminUsuarioId = Guid.NewGuid();

        db.Usuarios.AddRange(
            new Usuario
            {
                Id = _adminUsuarioId,
                Nombre = "Admin Test",
                Email = "admin@test.com",
                PasswordHash = hasher.Hash("Test1234"),
                Rol = Application.Entities.Enums.RolUsuario.Admin,
                Activo = true,
                FechaCreacion = DateTime.UtcNow,
                FechaActualizacion = DateTime.UtcNow
            },
            new Usuario
            {
                Id = Guid.NewGuid(),
                Nombre = "Visor Test",
                Email = "visor@test.com",
                PasswordHash = hasher.Hash("Test1234"),
                Rol = Application.Entities.Enums.RolUsuario.Visor,
                Activo = true,
                FechaCreacion = DateTime.UtcNow,
                FechaActualizacion = DateTime.UtcNow
            }
        );
        await db.SaveChangesAsync();
    }

    private async Task<HttpClient> BuildClientAsync(string email, string password)
    {
        var client = _factory.CreateClient();
        var resp = await client.PostAsJsonAsync("/api/v1/auth/login", new { email, password });
        var body = await resp.Content.ReadFromJsonAsync<LoginResponse>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", body!.Token);
        return client;
    }

    [Fact]
    public async Task Search_SinToken_Retorna401()
    {
        var resp = await _anonClient.GetAsync("/api/v1/audit");
        resp.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Search_VisorToken_Retorna403()
    {
        var resp = await _visorClient.GetAsync("/api/v1/audit");
        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Search_AdminToken_Retorna200ConLoginRegistrado()
    {
        // El propio login del admin (BuildClientAsync en InitializeAsync) ya genero un evento Login
        var resp = await _adminClient.GetAsync("/api/v1/audit");

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("items").GetArrayLength().Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task Search_FiltradoPorUsuarioId_SoloDevuelveEseUsuario()
    {
        var resp = await _adminClient.GetAsync($"/api/v1/audit?usuarioId={_adminUsuarioId}");

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        foreach (var item in body.GetProperty("items").EnumerateArray())
            item.GetProperty("usuarioId").GetGuid().Should().Be(_adminUsuarioId);
    }

    [Fact]
    public async Task Search_HastaEsFechaDeHoy_IncluyeEventosDeHoy()
    {
        // El login del admin (InitializeAsync) genera un evento Login con Timestamp = ahora.
        // "hasta" llega como fecha sin hora (mismo formato que manda el <input type="date"> del
        // frontend) — debe incluir todo el dia de hoy, no solo hasta la medianoche.
        var hoy = DateTime.UtcNow.ToString("yyyy-MM-dd");

        var resp = await _adminClient.GetAsync($"/api/v1/audit?hasta={hoy}");

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("items").GetArrayLength().Should().BeGreaterThan(0);
    }
}
