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

public class ProfesionalesControllerTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16")
        .Build();

    private WebApplicationFactory<Program> _factory = null!;
    private HttpClient _adminClient = null!;
    private HttpClient _administrativoClient = null!;
    private HttpClient _anonClient = null!;

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

    private static ProfesionalRequest BuildRequest(string apellido = "Garcia", string dni = "12.345.678", string cuil = "20-12345678-0")
        => new()
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
            Cargo = "Medico",
            AreaOperativa = "Los Ralos",
            TipoEfector = TipoEfector.Hospital,
            Nivel = Nivel.Universitario,
            Planta = Planta.PermanenteEfectivo,
            Tipo = TipoLegajo.Asistencial
        };

    // --- GET /api/v1/profesionales ---

    [Fact]
    public async Task Search_SinToken_Retorna401()
    {
        var resp = await _anonClient.GetAsync("/api/v1/profesionales");
        resp.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Search_AdministrativoToken_Retorna200()
    {
        var resp = await _administrativoClient.GetAsync("/api/v1/profesionales");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Search_SinProfesionales_RetornaListaVacia()
    {
        var resp = await _adminClient.GetAsync("/api/v1/profesionales");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("items").GetArrayLength().Should().Be(0);
        body.GetProperty("hasNextPage").GetBoolean().Should().BeFalse();
    }

    [Fact]
    public async Task Search_SinEstado_NoIncluyeDesactivados()
    {
        var created = await _adminClient.PostAsJsonAsync("/api/v1/profesionales",
            BuildRequest(apellido: "FiltroSinEstado", dni: "10.500.500", cuil: "20-10500500-0"));
        var detalle = await created.Content.ReadFromJsonAsync<ProfesionalDetalleResponse>();
        await _adminClient.DeleteAsync($"/api/v1/profesionales/{detalle!.Id}");

        var resp = await _adminClient.GetAsync("/api/v1/profesionales");
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        var ids = body.GetProperty("items").EnumerateArray()
            .Select(x => x.GetProperty("id").GetString()).ToList();

        ids.Should().NotContain(detalle.Id.ToString());
    }

    [Fact]
    public async Task Search_EstadoInactivos_SoloIncluyeDesactivados()
    {
        var activo = await _adminClient.PostAsJsonAsync("/api/v1/profesionales",
            BuildRequest(apellido: "FiltroActivo", dni: "10.600.600", cuil: "20-10600600-0"));
        var detalleActivo = await activo.Content.ReadFromJsonAsync<ProfesionalDetalleResponse>();

        var inactivo = await _adminClient.PostAsJsonAsync("/api/v1/profesionales",
            BuildRequest(apellido: "FiltroInactivo", dni: "10.700.700", cuil: "20-10700700-0"));
        var detalleInactivo = await inactivo.Content.ReadFromJsonAsync<ProfesionalDetalleResponse>();
        await _adminClient.DeleteAsync($"/api/v1/profesionales/{detalleInactivo!.Id}");

        var resp = await _adminClient.GetAsync("/api/v1/profesionales?estado=Inactivos");
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        var ids = body.GetProperty("items").EnumerateArray()
            .Select(x => x.GetProperty("id").GetString()).ToList();

        ids.Should().Contain(detalleInactivo.Id.ToString());
        ids.Should().NotContain(detalleActivo!.Id.ToString());
    }

    [Fact]
    public async Task Search_EstadoTodos_IncluyeActivosYDesactivados()
    {
        var activo = await _adminClient.PostAsJsonAsync("/api/v1/profesionales",
            BuildRequest(apellido: "FiltroTodosActivo", dni: "10.800.800", cuil: "20-10800800-0"));
        var detalleActivo = await activo.Content.ReadFromJsonAsync<ProfesionalDetalleResponse>();

        var inactivo = await _adminClient.PostAsJsonAsync("/api/v1/profesionales",
            BuildRequest(apellido: "FiltroTodosInactivo", dni: "10.900.900", cuil: "20-10900900-0"));
        var detalleInactivo = await inactivo.Content.ReadFromJsonAsync<ProfesionalDetalleResponse>();
        await _adminClient.DeleteAsync($"/api/v1/profesionales/{detalleInactivo!.Id}");

        var resp = await _adminClient.GetAsync("/api/v1/profesionales?estado=Todos");
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        var ids = body.GetProperty("items").EnumerateArray()
            .Select(x => x.GetProperty("id").GetString()).ToList();

        ids.Should().Contain(detalleActivo!.Id.ToString());
        ids.Should().Contain(detalleInactivo.Id.ToString());
    }

    [Fact]
    public async Task Search_FiltroAreaOperativaId_SoloRetornaEsaArea()
    {
        var losRalos = await _adminClient.PostAsJsonAsync("/api/v1/profesionales",
            BuildRequest(apellido: "AreaLosRalos", dni: "10.100.100", cuil: "20-10100100-0"));
        var detalleLosRalos = await losRalos.Content.ReadFromJsonAsync<ProfesionalDetalleResponse>();

        var req = BuildRequest(apellido: "AreaLasCejas", dni: "10.200.200", cuil: "20-10200200-0");
        req.AreaOperativa = "Las Cejas";
        var lasCejas = await _adminClient.PostAsJsonAsync("/api/v1/profesionales", req);
        var detalleLasCejas = await lasCejas.Content.ReadFromJsonAsync<ProfesionalDetalleResponse>();

        var areas = await _adminClient.GetFromJsonAsync<JsonElement>("/api/v1/areas-operativas");
        var idLasCejas = areas.EnumerateArray()
            .First(a => a.GetProperty("nombre").GetString() == "LAS CEJAS")
            .GetProperty("id").GetString();

        var resp = await _adminClient.GetAsync($"/api/v1/profesionales?areaOperativaId={idLasCejas}");
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        var ids = body.GetProperty("items").EnumerateArray()
            .Select(x => x.GetProperty("id").GetString()).ToList();

        ids.Should().Contain(detalleLasCejas!.Id.ToString());
        ids.Should().NotContain(detalleLosRalos!.Id.ToString());
    }

    [Fact]
    public async Task Search_FiltroTipoEfector_SoloRetornaEseEfector()
    {
        var hospital = await _adminClient.PostAsJsonAsync("/api/v1/profesionales",
            BuildRequest(apellido: "EfectorHospital", dni: "10.300.300", cuil: "20-10300300-0"));
        var detalleHospital = await hospital.Content.ReadFromJsonAsync<ProfesionalDetalleResponse>();

        var req = BuildRequest(apellido: "EfectorCaps", dni: "10.400.400", cuil: "20-10400400-0");
        req.TipoEfector = TipoEfector.CAPS;
        var caps = await _adminClient.PostAsJsonAsync("/api/v1/profesionales", req);
        var detalleCaps = await caps.Content.ReadFromJsonAsync<ProfesionalDetalleResponse>();

        var resp = await _adminClient.GetAsync("/api/v1/profesionales?tipoEfector=CAPS");
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        var ids = body.GetProperty("items").EnumerateArray()
            .Select(x => x.GetProperty("id").GetString()).ToList();

        ids.Should().Contain(detalleCaps!.Id.ToString());
        ids.Should().NotContain(detalleHospital!.Id.ToString());
    }

    [Fact]
    public async Task Search_OrdenarPorDniAsc_OrdenaNumericamenteNoAlfabeticamente()
    {
        // Apellido Z (dni chico) vs Apellido A (dni grande): si ordenara por Apellido (default)
        // el orden de Dni saldria al reves. Prueba que ordenarPor=DniAsc gana sobre el default.
        await _adminClient.PostAsJsonAsync("/api/v1/profesionales",
            BuildRequest(apellido: "ZOrdenDni", dni: "9.999.998", cuil: "20-99999980-1"));
        await _adminClient.PostAsJsonAsync("/api/v1/profesionales",
            BuildRequest(apellido: "AOrdenDni", dni: "10.000.500", cuil: "20-10000500-1"));

        var resp = await _adminClient.GetAsync("/api/v1/profesionales?ordenarPor=DniAsc&busqueda=OrdenDni");
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        var dnis = body.GetProperty("items").EnumerateArray()
            .Select(x => x.GetProperty("dni").GetString()).ToList();

        dnis.Should().Equal("9.999.998", "10.000.500");
    }

    [Fact]
    public async Task Search_OrdenarPorDniDesc_OrdenaNumericamenteDescendente()
    {
        await _adminClient.PostAsJsonAsync("/api/v1/profesionales",
            BuildRequest(apellido: "ZOrdenDesc", dni: "10.000.600", cuil: "20-10000600-1"));
        await _adminClient.PostAsJsonAsync("/api/v1/profesionales",
            BuildRequest(apellido: "AOrdenDesc", dni: "9.999.997", cuil: "20-99999970-1"));

        var resp = await _adminClient.GetAsync("/api/v1/profesionales?ordenarPor=DniDesc&busqueda=OrdenDesc");
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        var dnis = body.GetProperty("items").EnumerateArray()
            .Select(x => x.GetProperty("dni").GetString()).ToList();

        dnis.Should().Equal("10.000.600", "9.999.997");
    }

    [Fact]
    public async Task Search_OrdenarPorApellidoDesc_OrdenaDescendente()
    {
        await _adminClient.PostAsJsonAsync("/api/v1/profesionales",
            BuildRequest(apellido: "OrdenApeA", dni: "10.500.501", cuil: "20-10500501-1"));
        await _adminClient.PostAsJsonAsync("/api/v1/profesionales",
            BuildRequest(apellido: "OrdenApeZ", dni: "10.500.502", cuil: "20-10500502-1"));

        var resp = await _adminClient.GetAsync("/api/v1/profesionales?ordenarPor=ApellidoDesc&busqueda=OrdenApe");
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        var apellidos = body.GetProperty("items").EnumerateArray()
            .Select(x => x.GetProperty("apellido").GetString()).ToList();

        apellidos.Should().Equal("ORDENAPEZ", "ORDENAPEA");
    }

    // --- POST /api/v1/profesionales ---

    [Fact]
    public async Task Create_AdministrativoToken_Retorna201()
    {
        var resp = await _administrativoClient.PostAsJsonAsync("/api/v1/profesionales",
            BuildRequest(apellido: "Administrativo Create", dni: "10.000.001", cuil: "20-10000001-0"));
        resp.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task Create_DatosValidos_Retorna201ConLocation()
    {
        var resp = await _adminClient.PostAsJsonAsync("/api/v1/profesionales", BuildRequest());

        resp.StatusCode.Should().Be(HttpStatusCode.Created);
        resp.Headers.Location.Should().NotBeNull();

        var body = await resp.Content.ReadFromJsonAsync<ProfesionalDetalleResponse>();
        body!.Apellido.Should().Be("GARCIA");
        body.Dni.Should().Be("12.345.678");
    }

    [Fact]
    public async Task Create_DniDuplicado_Retorna409()
    {
        await _adminClient.PostAsJsonAsync("/api/v1/profesionales", BuildRequest(dni: "11.111.111", cuil: "20-11111111-0"));

        var resp = await _adminClient.PostAsJsonAsync("/api/v1/profesionales",
            BuildRequest(apellido: "Lopez", dni: "11.111.111", cuil: "20-99999999-0"));

        resp.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Create_FormatoDniInvalido_Retorna400()
    {
        var req = BuildRequest();
        req.Dni = "12345678"; // sin puntos
        var resp = await _adminClient.PostAsJsonAsync("/api/v1/profesionales", req);
        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Create_EnumsComoStringEnElBody_Retorna201()
    {
        var payload = new
        {
            apellido = "Enums",
            nombre = "String Test",
            dni = "10.101.010",
            cuil = "20-10101010-0",
            fechaNacimiento = "1990-01-01",
            sexo = "Femenino",
            estadoCivil = "Soltero",
            domicilio = "Calle Enum 1",
            localidad = "San Miguel de Tucuman",
            provincia = "Tucuman",
            cargo = "Medica",
            areaOperativa = "Los Ralos",
            tipoEfector = "Hospital",
            nivel = "Universitario",
            planta = "PermanenteEfectivo",
            tipo = "Asistencial"
        };

        var resp = await _adminClient.PostAsJsonAsync("/api/v1/profesionales", payload);

        resp.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await resp.Content.ReadFromJsonAsync<ProfesionalDetalleResponse>();
        body!.Sexo.Should().Be("Femenino");
    }

    // --- GET /api/v1/profesionales/{id} ---

    [Fact]
    public async Task GetById_Existente_Retorna200ConDetalle()
    {
        var created = await _adminClient.PostAsJsonAsync("/api/v1/profesionales",
            BuildRequest(apellido: "Romero", dni: "22.222.222", cuil: "20-22222222-0"));
        var detalle = await created.Content.ReadFromJsonAsync<ProfesionalDetalleResponse>();

        var resp = await _adminClient.GetAsync($"/api/v1/profesionales/{detalle!.Id}");

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await resp.Content.ReadFromJsonAsync<ProfesionalDetalleResponse>();
        body!.Apellido.Should().Be("ROMERO");
    }

    [Fact]
    public async Task GetById_NoExistente_Retorna404()
    {
        var resp = await _adminClient.GetAsync($"/api/v1/profesionales/{Guid.NewGuid()}");
        resp.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetById_AdministrativoPuedeVer()
    {
        var created = await _adminClient.PostAsJsonAsync("/api/v1/profesionales",
            BuildRequest(apellido: "Diaz", dni: "33.333.333", cuil: "20-33333333-0"));
        var detalle = await created.Content.ReadFromJsonAsync<ProfesionalDetalleResponse>();

        var resp = await _administrativoClient.GetAsync($"/api/v1/profesionales/{detalle!.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetById_ConDocumentoCargado_IncluyeDocumentoEnRespuesta()
    {
        var created = await _adminClient.PostAsJsonAsync("/api/v1/profesionales",
            BuildRequest(apellido: "Mendez", dni: "99.111.222", cuil: "20-99111222-0"));
        var detalle = await created.Content.ReadFromJsonAsync<ProfesionalDetalleResponse>();

        var uploadContent = new MultipartFormDataContent();
        uploadContent.Add(new ByteArrayContent([0xFF, 0xD8, 0xFF, 0x00, 0x01, 0x02, 0x03]), "archivo", "foto.jpg");
        uploadContent.Add(new StringContent("DNI"), "tipoDocumentoNombre");
        await _adminClient.PostAsync($"/api/v1/profesionales/{detalle!.Id}/documentos", uploadContent);

        var resp = await _adminClient.GetAsync($"/api/v1/profesionales/{detalle.Id}");

        var body = await resp.Content.ReadFromJsonAsync<ProfesionalDetalleResponse>();
        body!.Documentos.Should().ContainSingle(d => d.TipoDocumento == "DNI" && d.NombreOriginal == "foto.jpg");
    }

    [Fact]
    public async Task GetById_ConDocumentoEliminado_NoLoIncluyeEnRespuesta()
    {
        var created = await _adminClient.PostAsJsonAsync("/api/v1/profesionales",
            BuildRequest(apellido: "Ibanez", dni: "99.222.333", cuil: "20-99222333-0"));
        var detalle = await created.Content.ReadFromJsonAsync<ProfesionalDetalleResponse>();

        var uploadContent = new MultipartFormDataContent();
        uploadContent.Add(new ByteArrayContent([0xFF, 0xD8, 0xFF, 0x00, 0x01, 0x02, 0x03]), "archivo", "foto.jpg");
        uploadContent.Add(new StringContent("DNI"), "tipoDocumentoNombre");
        var uploadResp = await _adminClient.PostAsync($"/api/v1/profesionales/{detalle!.Id}/documentos", uploadContent);
        var documento = await uploadResp.Content.ReadFromJsonAsync<JsonElement>();
        var documentoId = documento.GetProperty("id").GetGuid();

        await _adminClient.DeleteAsync($"/api/v1/documentos/{documentoId}");

        var resp = await _adminClient.GetAsync($"/api/v1/profesionales/{detalle.Id}");
        var body = await resp.Content.ReadFromJsonAsync<ProfesionalDetalleResponse>();
        body!.Documentos.Should().BeEmpty();
    }

    // --- PATCH /api/v1/profesionales/{id} ---

    [Fact]
    public async Task Update_CamposValidos_Retorna200()
    {
        var created = await _adminClient.PostAsJsonAsync("/api/v1/profesionales",
            BuildRequest(apellido: "Suarez", dni: "44.444.444", cuil: "20-44444444-0"));
        var original = await created.Content.ReadFromJsonAsync<ProfesionalDetalleResponse>();

        var patch = new PatchProfesionalRequest { Cargo = "Enfermero" };
        var resp = await _adminClient.PatchAsJsonAsync($"/api/v1/profesionales/{original!.Id}", patch);

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        var updated = await resp.Content.ReadFromJsonAsync<ProfesionalDetalleResponse>();
        updated!.Cargo.Should().Be("ENFERMERO");
    }

    [Fact]
    public async Task Update_AreaOperativaSinCambios_Retorna200()
    {
        var created = await _adminClient.PostAsJsonAsync("/api/v1/profesionales",
            BuildRequest(apellido: "Diaz", dni: "77.777.777", cuil: "20-77777777-0"));
        var original = await created.Content.ReadFromJsonAsync<ProfesionalDetalleResponse>();

        var patch = new PatchProfesionalRequest { AreaOperativa = "Los Ralos", NroExpediente = "1868/616-D-2017" };
        var resp = await _adminClient.PatchAsJsonAsync($"/api/v1/profesionales/{original!.Id}", patch);

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        var updated = await resp.Content.ReadFromJsonAsync<ProfesionalDetalleResponse>();
        updated!.NroExpediente.Should().Be("1868/616-D-2017");
    }

    [Fact]
    public async Task Update_AdministrativoToken_Retorna200()
    {
        var created = await _adminClient.PostAsJsonAsync("/api/v1/profesionales",
            BuildRequest(apellido: "Perez", dni: "55.555.555", cuil: "20-55555555-0"));
        var original = await created.Content.ReadFromJsonAsync<ProfesionalDetalleResponse>();

        var resp = await _administrativoClient.PatchAsJsonAsync($"/api/v1/profesionales/{original!.Id}",
            new PatchProfesionalRequest { Cargo = "Otro" });

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // --- DELETE /api/v1/profesionales/{id} ---

    [Fact]
    public async Task Deactivate_Existente_Retorna204()
    {
        var created = await _adminClient.PostAsJsonAsync("/api/v1/profesionales",
            BuildRequest(apellido: "Torres", dni: "66.666.666", cuil: "20-66666666-0"));
        var detalle = await created.Content.ReadFromJsonAsync<ProfesionalDetalleResponse>();

        var resp = await _adminClient.DeleteAsync($"/api/v1/profesionales/{detalle!.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Deactivate_NoAparece_EnListaDespues()
    {
        var created = await _adminClient.PostAsJsonAsync("/api/v1/profesionales",
            BuildRequest(apellido: "Vega", dni: "77.777.777", cuil: "20-77777777-0"));
        var detalle = await created.Content.ReadFromJsonAsync<ProfesionalDetalleResponse>();

        await _adminClient.DeleteAsync($"/api/v1/profesionales/{detalle!.Id}");

        var listResp = await _adminClient.GetAsync("/api/v1/profesionales");
        var list = await listResp.Content.ReadFromJsonAsync<JsonElement>();
        var items = list.GetProperty("items").EnumerateArray()
            .Select(x => x.GetProperty("id").GetString())
            .ToList();

        items.Should().NotContain(detalle.Id.ToString());
    }

    [Fact]
    public async Task Deactivate_AdministrativoToken_Retorna204()
    {
        var created = await _adminClient.PostAsJsonAsync("/api/v1/profesionales",
            BuildRequest(apellido: "Luna", dni: "88.888.888", cuil: "20-88888888-0"));
        var detalle = await created.Content.ReadFromJsonAsync<ProfesionalDetalleResponse>();

        var resp = await _administrativoClient.DeleteAsync($"/api/v1/profesionales/{detalle!.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    // --- PATCH /api/v1/profesionales/{id}/reactivar ---

    [Fact]
    public async Task Reactivar_ProfesionalDesactivado_Retorna204YVuelveAAparecerEnLista()
    {
        var created = await _adminClient.PostAsJsonAsync("/api/v1/profesionales",
            BuildRequest(apellido: "Acosta", dni: "10.100.100", cuil: "20-10100100-0"));
        var detalle = await created.Content.ReadFromJsonAsync<ProfesionalDetalleResponse>();
        await _adminClient.DeleteAsync($"/api/v1/profesionales/{detalle!.Id}");

        var resp = await _adminClient.PatchAsync($"/api/v1/profesionales/{detalle.Id}/reactivar", null);
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var listResp = await _adminClient.GetAsync("/api/v1/profesionales");
        var list = await listResp.Content.ReadFromJsonAsync<JsonElement>();
        var items = list.GetProperty("items").EnumerateArray()
            .Select(x => x.GetProperty("id").GetString())
            .ToList();
        items.Should().Contain(detalle.Id.ToString());
    }

    [Fact]
    public async Task Reactivar_NoExistente_Retorna404()
    {
        var resp = await _adminClient.PatchAsync($"/api/v1/profesionales/{Guid.NewGuid()}/reactivar", null);
        resp.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Reactivar_AdministrativoToken_Retorna204()
    {
        var created = await _adminClient.PostAsJsonAsync("/api/v1/profesionales",
            BuildRequest(apellido: "Reyes", dni: "10.200.200", cuil: "20-10200200-0"));
        var detalle = await created.Content.ReadFromJsonAsync<ProfesionalDetalleResponse>();
        await _adminClient.DeleteAsync($"/api/v1/profesionales/{detalle!.Id}");

        var resp = await _administrativoClient.PatchAsync($"/api/v1/profesionales/{detalle.Id}/reactivar", null);
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    // --- DELETE /api/v1/profesionales/{id}/definitivo ---

    [Fact]
    public async Task EliminarDefinitivo_SinDocumentos_Retorna204YNoExisteMas()
    {
        var created = await _adminClient.PostAsJsonAsync("/api/v1/profesionales",
            BuildRequest(apellido: "Molina", dni: "10.300.300", cuil: "20-10300300-0"));
        var detalle = await created.Content.ReadFromJsonAsync<ProfesionalDetalleResponse>();

        var resp = await _adminClient.DeleteAsync($"/api/v1/profesionales/{detalle!.Id}/definitivo");
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var getResp = await _adminClient.GetAsync($"/api/v1/profesionales/{detalle.Id}");
        getResp.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task EliminarDefinitivo_ConDocumentos_Retorna400ConMensajeClaro()
    {
        var created = await _adminClient.PostAsJsonAsync("/api/v1/profesionales",
            BuildRequest(apellido: "Herrera", dni: "10.400.400", cuil: "20-10400400-0"));
        var detalle = await created.Content.ReadFromJsonAsync<ProfesionalDetalleResponse>();

        var uploadContent = new MultipartFormDataContent();
        uploadContent.Add(new ByteArrayContent([0xFF, 0xD8, 0xFF, 0x00, 0x01, 0x02, 0x03]), "archivo", "foto.jpg");
        uploadContent.Add(new StringContent("DNI"), "tipoDocumentoNombre");
        await _adminClient.PostAsync($"/api/v1/profesionales/{detalle!.Id}/documentos", uploadContent);

        var resp = await _adminClient.DeleteAsync($"/api/v1/profesionales/{detalle.Id}/definitivo");
        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("message").GetString().Should().Contain("documentos cargados");

        var getResp = await _adminClient.GetAsync($"/api/v1/profesionales/{detalle.Id}");
        getResp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task EliminarDefinitivo_NoExistente_Retorna404()
    {
        var resp = await _adminClient.DeleteAsync($"/api/v1/profesionales/{Guid.NewGuid()}/definitivo");
        resp.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
