using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using LosRalos.Application.DTOs.Auth;
using LosRalos.Application.DTOs.Profesionales;
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

public class DocumentosControllerTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16")
        .Build();

    private WebApplicationFactory<Program> _factory = null!;
    private HttpClient _adminClient = null!;
    private HttpClient _visorClient = null!;
    private HttpClient _anonClient = null!;

    private static readonly byte[] JpegBytes = [0xFF, 0xD8, 0xFF, 0x00, 0x01, 0x02, 0x03];
    private static readonly byte[] TextBytes = "no soy un archivo valido"u8.ToArray();

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
                        ["Audit:HmacKey"] = "test-hmac-key-32-caracteres-minimo",
                        ["Storage:BasePath"] = Path.Combine(Path.GetTempPath(), "losralos-integration-" + Guid.NewGuid()),
                        ["Storage:MaxFileSizeBytes"] = "1048576"
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

    private async Task SeedAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        await db.Database.MigrateAsync();

        db.Usuarios.AddRange(
            new Usuario
            {
                Id = Guid.NewGuid(),
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
                Nombre = "Visor Test",
                Email = "visor@test.com",
                PasswordHash = hasher.Hash("Test1234"),
                Rol = RolUsuario.Visor,
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

    private async Task<Guid> CrearProfesionalAsync(string apellido, string dni, string cuil)
    {
        var req = new ProfesionalRequest
        {
            Apellido = apellido,
            Nombre = "Juan",
            Dni = dni,
            Cuil = cuil,
            FechaNacimiento = new DateOnly(1985, 6, 15),
            Sexo = Sexo.Masculino,
            EstadoCivil = EstadoCivil.Soltero,
            Domicilio = "Calle Falsa 123",
            Localidad = "San Miguel de Tucuman",
            Provincia = "Tucuman",
            Funcion = "Medico",
            Nivel = Nivel.Universitario,
            Planta = Planta.PermanenteEfectivo,
            Tipo = TipoLegajo.Asistencial
        };
        var resp = await _adminClient.PostAsJsonAsync("/api/v1/profesionales", req);
        var detalle = await resp.Content.ReadFromJsonAsync<ProfesionalDetalleResponse>();
        return detalle!.Id;
    }

    private static MultipartFormDataContent BuildUpload(byte[] bytes, string fileName, string tipoDocumentoNombre)
    {
        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(bytes);
        content.Add(fileContent, "archivo", fileName);
        content.Add(new StringContent(tipoDocumentoNombre), "tipoDocumentoNombre");
        return content;
    }

    // --- POST /api/v1/profesionales/{id}/documentos ---

    [Fact]
    public async Task Subir_ArchivoValido_Retorna201ConDocumentoResponse()
    {
        var profesionalId = await CrearProfesionalAsync("Ramirez", "10.000.001", "20-10000001-0");

        var resp = await _adminClient.PostAsync(
            $"/api/v1/profesionales/{profesionalId}/documentos",
            BuildUpload(JpegBytes, "foto.jpg", "Titulo"));

        resp.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("tipoDocumento").GetProperty("nombre").GetString().Should().Be("TITULO");
        body.GetProperty("contentType").GetString().Should().Be("image/jpeg");
    }

    [Fact]
    public async Task Subir_VisorToken_Retorna403()
    {
        var profesionalId = await CrearProfesionalAsync("Salazar", "10.000.002", "20-10000002-0");

        var resp = await _visorClient.PostAsync(
            $"/api/v1/profesionales/{profesionalId}/documentos",
            BuildUpload(JpegBytes, "foto.jpg", "Titulo"));

        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Subir_ProfesionalNoExiste_Retorna404()
    {
        var resp = await _adminClient.PostAsync(
            $"/api/v1/profesionales/{Guid.NewGuid()}/documentos",
            BuildUpload(JpegBytes, "foto.jpg", "Titulo"));

        resp.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Subir_MimeInvalido_Retorna400()
    {
        var profesionalId = await CrearProfesionalAsync("Torrez", "10.000.003", "20-10000003-0");

        var resp = await _adminClient.PostAsync(
            $"/api/v1/profesionales/{profesionalId}/documentos",
            BuildUpload(TextBytes, "archivo.txt", "Titulo"));

        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Subir_ArchivoSuperaTamanioMaximo_Retorna400()
    {
        var profesionalId = await CrearProfesionalAsync("Ibanez", "10.000.004", "20-10000004-0");
        var dataGrande = new byte[] { 0xFF, 0xD8, 0xFF }.Concat(new byte[2 * 1024 * 1024]).ToArray();

        var resp = await _adminClient.PostAsync(
            $"/api/v1/profesionales/{profesionalId}/documentos",
            BuildUpload(dataGrande, "grande.jpg", "Titulo"));

        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Subir_TipoDocumentoNuevo_SeCreaEnCatalogo()
    {
        var profesionalId = await CrearProfesionalAsync("Farias", "10.000.005", "20-10000005-0");

        await _adminClient.PostAsync(
            $"/api/v1/profesionales/{profesionalId}/documentos",
            BuildUpload(JpegBytes, "foto.jpg", "Certificado Antecedentes Penales"));

        var tiposResp = await _adminClient.GetAsync("/api/v1/tipos-documento");
        var tipos = await tiposResp.Content.ReadFromJsonAsync<JsonElement>();
        var nombres = tipos.EnumerateArray().Select(t => t.GetProperty("nombre").GetString()).ToList();

        nombres.Should().Contain("CERTIFICADO ANTECEDENTES PENALES");
    }

    [Fact]
    public async Task Subir_TipoDocumentoEnMinusculas_SeNormalizaAMayusculas()
    {
        var profesionalId = await CrearProfesionalAsync("Vega", "10.000.011", "20-10000011-0");

        var resp = await _adminClient.PostAsync(
            $"/api/v1/profesionales/{profesionalId}/documentos",
            BuildUpload(JpegBytes, "foto.jpg", "carnet vacunacion"));

        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("tipoDocumento").GetProperty("nombre").GetString().Should().Be("CARNET VACUNACION");
    }

    // --- GET /api/v1/documentos/{id}/file ---

    [Fact]
    public async Task Descargar_ArchivoExistente_Retorna200ConContentDisposition()
    {
        var profesionalId = await CrearProfesionalAsync("Correa", "10.000.006", "20-10000006-0");
        var upload = await _adminClient.PostAsync(
            $"/api/v1/profesionales/{profesionalId}/documentos",
            BuildUpload(JpegBytes, "foto.jpg", "Titulo"));
        var doc = await upload.Content.ReadFromJsonAsync<JsonElement>();
        var docId = doc.GetProperty("id").GetGuid();

        var resp = await _adminClient.GetAsync($"/api/v1/documentos/{docId}/file");

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        resp.Content.Headers.ContentDisposition!.DispositionType.Should().Be("inline");
        var bytes = await resp.Content.ReadAsByteArrayAsync();
        bytes.Should().Equal(JpegBytes);
    }

    [Fact]
    public async Task Descargar_ConDownloadTrue_ContentDispositionAttachment()
    {
        var profesionalId = await CrearProfesionalAsync("Molina", "10.000.007", "20-10000007-0");
        var upload = await _adminClient.PostAsync(
            $"/api/v1/profesionales/{profesionalId}/documentos",
            BuildUpload(JpegBytes, "foto.jpg", "Titulo"));
        var doc = await upload.Content.ReadFromJsonAsync<JsonElement>();
        var docId = doc.GetProperty("id").GetGuid();

        var resp = await _adminClient.GetAsync($"/api/v1/documentos/{docId}/file?download=true");

        resp.Content.Headers.ContentDisposition!.DispositionType.Should().Be("attachment");
    }

    [Fact]
    public async Task Descargar_NoExiste_Retorna404()
    {
        var resp = await _adminClient.GetAsync($"/api/v1/documentos/{Guid.NewGuid()}/file");
        resp.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Descargar_VisorPuedeVer()
    {
        var profesionalId = await CrearProfesionalAsync("Aguero", "10.000.008", "20-10000008-0");
        var upload = await _adminClient.PostAsync(
            $"/api/v1/profesionales/{profesionalId}/documentos",
            BuildUpload(JpegBytes, "foto.jpg", "Titulo"));
        var doc = await upload.Content.ReadFromJsonAsync<JsonElement>();
        var docId = doc.GetProperty("id").GetGuid();

        var resp = await _visorClient.GetAsync($"/api/v1/documentos/{docId}/file");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // --- DELETE /api/v1/documentos/{id} ---

    [Fact]
    public async Task Eliminar_Existente_Retorna204YQuedaSoftDeleted()
    {
        var profesionalId = await CrearProfesionalAsync("Nunez", "10.000.009", "20-10000009-0");
        var upload = await _adminClient.PostAsync(
            $"/api/v1/profesionales/{profesionalId}/documentos",
            BuildUpload(JpegBytes, "foto.jpg", "Titulo"));
        var doc = await upload.Content.ReadFromJsonAsync<JsonElement>();
        var docId = doc.GetProperty("id").GetGuid();

        var deleteResp = await _adminClient.DeleteAsync($"/api/v1/documentos/{docId}");
        deleteResp.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var getResp = await _adminClient.GetAsync($"/api/v1/documentos/{docId}/file");
        getResp.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Eliminar_VisorToken_Retorna403()
    {
        var profesionalId = await CrearProfesionalAsync("Paz", "10.000.010", "20-10000010-0");
        var upload = await _adminClient.PostAsync(
            $"/api/v1/profesionales/{profesionalId}/documentos",
            BuildUpload(JpegBytes, "foto.jpg", "Titulo"));
        var doc = await upload.Content.ReadFromJsonAsync<JsonElement>();
        var docId = doc.GetProperty("id").GetGuid();

        var resp = await _visorClient.DeleteAsync($"/api/v1/documentos/{docId}");
        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // --- GET /api/v1/tipos-documento ---

    [Fact]
    public async Task ListarTipos_IncluyeSeedInicial()
    {
        var resp = await _adminClient.GetAsync("/api/v1/tipos-documento");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        var nombres = body.EnumerateArray().Select(t => t.GetProperty("nombre").GetString()).ToList();

        nombres.Should().Contain(["DNI FRENTE", "DNI DORSO", "TITULO", "RESOLUCION"]);
    }

    [Fact]
    public async Task ListarTipos_SinToken_Retorna401()
    {
        var resp = await _anonClient.GetAsync("/api/v1/tipos-documento");
        resp.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
