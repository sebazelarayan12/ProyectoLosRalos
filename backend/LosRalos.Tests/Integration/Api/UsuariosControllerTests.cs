using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using LosRalos.Application.DTOs.Auth;
using LosRalos.Application.DTOs.Usuarios;
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

public class UsuariosControllerTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16")
        .Build();

    private WebApplicationFactory<Program> _factory = null!;
    private HttpClient _adminClient = null!;
    private HttpClient _administrativoClient = null!;
    private HttpClient _anonClient = null!;
    private Guid _adminId;

    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web);

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
        _administrativoClient = await BuildClientAsync("administrativo@test.com", "Test1234");
    }

    public async Task DisposeAsync()
    {
        _adminClient.Dispose();
        _administrativoClient.Dispose();
        _anonClient.Dispose();
        await _factory.DisposeAsync();
        await _postgres.DisposeAsync();
    }

    private async Task SeedAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        await db.Database.MigrateAsync();

        _adminId = Guid.NewGuid();

        db.Usuarios.AddRange(
            new Usuario
            {
                Id = _adminId,
                Nombre = "Admin Test",
                Email = "admin@test.com",
                PasswordHash = hasher.Hash("Test1234"),
                Rol = RolUsuario.Admin,
                Activo = true,
                FechaCreacion = DateTime.UtcNow,
                FechaActualizacion = DateTime.UtcNow
            },
            new Usuario
            {
                Id = Guid.NewGuid(),
                Nombre = "Administrativo Test",
                Email = "administrativo@test.com",
                PasswordHash = hasher.Hash("Test1234"),
                Rol = RolUsuario.Administrativo,
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

    private static UsuarioRequest BuildRequest(string email = "nuevo@test.com", RolUsuario rol = RolUsuario.Administrativo)
        => new()
        {
            Nombre = "Usuario Nuevo",
            Email = email,
            Password = "password123",
            Rol = rol
        };

    // --- GET /api/v1/usuarios ---

    [Fact]
    public async Task Search_SinToken_Retorna401()
    {
        var resp = await _anonClient.GetAsync("/api/v1/usuarios");
        resp.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Search_AdministrativoToken_Retorna403()
    {
        var resp = await _administrativoClient.GetAsync("/api/v1/usuarios");
        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Search_AdminToken_Retorna200ConSeeds()
    {
        var resp = await _adminClient.GetAsync("/api/v1/usuarios");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("items").GetArrayLength().Should().Be(2);
    }

    // --- POST /api/v1/usuarios ---

    [Fact]
    public async Task Create_AdministrativoToken_Retorna403()
    {
        var resp = await _administrativoClient.PostAsJsonAsync("/api/v1/usuarios", BuildRequest());
        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Create_DatosValidos_Retorna201()
    {
        var resp = await _adminClient.PostAsJsonAsync("/api/v1/usuarios", BuildRequest(email: "creado@test.com"));

        resp.StatusCode.Should().Be(HttpStatusCode.Created);

        var body = await resp.Content.ReadFromJsonAsync<UsuarioResponse>();
        body!.Email.Should().Be("creado@test.com");
        body.Rol.Should().Be(nameof(RolUsuario.Administrativo));
    }

    [Fact]
    public async Task Create_EmailDuplicado_Retorna409()
    {
        await _adminClient.PostAsJsonAsync("/api/v1/usuarios", BuildRequest(email: "dup@test.com"));

        var resp = await _adminClient.PostAsJsonAsync("/api/v1/usuarios", BuildRequest(email: "dup@test.com"));

        resp.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Create_PasswordSinNumero_Retorna400()
    {
        var req = BuildRequest(email: "sinpass@test.com");
        req.Password = "passwordsinnumero";

        var resp = await _adminClient.PostAsJsonAsync("/api/v1/usuarios", req);

        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Create_PasswordCorta_Retorna400()
    {
        var req = BuildRequest(email: "corta@test.com");
        req.Password = "abc1";

        var resp = await _adminClient.PostAsJsonAsync("/api/v1/usuarios", req);

        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // --- PATCH /api/v1/usuarios/{id} ---

    [Fact]
    public async Task Update_CambiarNombre_Retorna200()
    {
        var createResp = await _adminClient.PostAsJsonAsync("/api/v1/usuarios", BuildRequest(email: "editar@test.com"));
        var creado = await createResp.Content.ReadFromJsonAsync<UsuarioResponse>();

        var resp = await _adminClient.PatchAsJsonAsync($"/api/v1/usuarios/{creado!.Id}", new { nombre = "Nombre Editado" });

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await resp.Content.ReadFromJsonAsync<UsuarioResponse>();
        body!.Nombre.Should().Be("Nombre Editado");
    }

    [Fact]
    public async Task Update_CambiarPropioRol_Retorna403()
    {
        var resp = await _adminClient.PatchAsJsonAsync($"/api/v1/usuarios/{_adminId}", new { rol = "Administrativo" });

        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Update_UsuarioNoExistente_Retorna404()
    {
        var resp = await _adminClient.PatchAsJsonAsync($"/api/v1/usuarios/{Guid.NewGuid()}", new { nombre = "X" });

        resp.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // --- PATCH /api/v1/usuarios/{id}/desactivar & activar ---

    [Fact]
    public async Task Desactivar_AutoDesactivacion_Retorna403()
    {
        var resp = await _adminClient.PatchAsync($"/api/v1/usuarios/{_adminId}/desactivar", null);

        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task DesactivarYActivar_UsuarioValido_Retorna204()
    {
        var createResp = await _adminClient.PostAsJsonAsync("/api/v1/usuarios", BuildRequest(email: "toggle@test.com"));
        var creado = await createResp.Content.ReadFromJsonAsync<UsuarioResponse>();

        var respDesactivar = await _adminClient.PatchAsync($"/api/v1/usuarios/{creado!.Id}/desactivar", null);
        respDesactivar.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var respActivar = await _adminClient.PatchAsync($"/api/v1/usuarios/{creado.Id}/activar", null);
        respActivar.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    // --- POST /api/v1/usuarios/{id}/reset-password ---

    [Fact]
    public async Task ResetPassword_UsuarioValido_Retorna204YPermiteLoginConNuevaPassword()
    {
        var createResp = await _adminClient.PostAsJsonAsync("/api/v1/usuarios", BuildRequest(email: "reset@test.com"));
        var creado = await createResp.Content.ReadFromJsonAsync<UsuarioResponse>();

        var resp = await _adminClient.PostAsJsonAsync(
            $"/api/v1/usuarios/{creado!.Id}/reset-password", new { nuevaPassword = "nuevaPassword1" });

        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var loginResp = await _anonClient.PostAsJsonAsync(
            "/api/v1/auth/login", new { email = "reset@test.com", password = "nuevaPassword1" });
        loginResp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ResetPassword_PasswordInvalida_Retorna400()
    {
        var createResp = await _adminClient.PostAsJsonAsync("/api/v1/usuarios", BuildRequest(email: "resetinvalido@test.com"));
        var creado = await createResp.Content.ReadFromJsonAsync<UsuarioResponse>();

        var resp = await _adminClient.PostAsJsonAsync(
            $"/api/v1/usuarios/{creado!.Id}/reset-password", new { nuevaPassword = "corta" });

        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
