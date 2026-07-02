using FluentAssertions;
using LosRalos.Application.Entities;
using LosRalos.Application.Entities.Enums;
using LosRalos.Application.Exceptions;
using LosRalos.Application.Interfaces;
using LosRalos.Application.Services;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;

namespace LosRalos.Tests.Unit.Services;

public class DocumentoServiceTests
{
    private readonly IDocumentoRepository _documentoRepo = Substitute.For<IDocumentoRepository>();
    private readonly ITipoDocumentoRepository _tipoRepo = Substitute.For<ITipoDocumentoRepository>();
    private readonly IProfesionalRepository _profesionalRepo = Substitute.For<IProfesionalRepository>();
    private readonly IFileStorageService _storage = Substitute.For<IFileStorageService>();
    private readonly IAuditLogRepository _auditRepo = Substitute.For<IAuditLogRepository>();

    private DocumentoService CrearServicio() => new(
        _documentoRepo, _tipoRepo, _profesionalRepo, _storage, _auditRepo,
        NullLogger<DocumentoService>.Instance);

    private static readonly Guid UsuarioId = Guid.NewGuid();
    private const string NombreUsuario = "Admin Test";

    private static Profesional ProfesionalActivo(Guid id) => new()
    {
        Id = id,
        Apellido = "Gomez",
        Nombre = "Maria",
        Dni = "12.345.678",
        Cuil = "27-12345678-3",
        FechaNacimiento = new DateOnly(1985, 3, 15),
        Sexo = Sexo.Femenino,
        EstadoCivil = EstadoCivil.Casado,
        Domicilio = "Calle Falsa 123",
        Localidad = "Los Ralos",
        Provincia = "Tucuman",
        Funcion = "Odontologa",
        Nivel = Nivel.Universitario,
        Planta = Planta.PermanenteEfectivo,
        Tipo = TipoLegajo.Asistencial,
        Activo = true,
        FechaCreacion = DateTime.UtcNow,
        FechaActualizacion = DateTime.UtcNow
    };

    private static TipoDocumento TipoTitulo() => new() { Id = Guid.NewGuid(), Nombre = "Titulo", FechaCreacion = DateTime.UtcNow };

    // --- SubirAsync ---

    [Fact]
    public async Task SubirAsync_ProfesionalNoExiste_LanzaNotFoundException()
    {
        var profesionalId = Guid.NewGuid();
        _profesionalRepo.GetByIdAsync(profesionalId, Arg.Any<CancellationToken>()).Returns((Profesional?)null);

        var act = () => CrearServicio().SubirAsync(
            profesionalId, new MemoryStream(), "foto.jpg", "Titulo", UsuarioId, NombreUsuario, null, CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>();
        await _storage.DidNotReceive().GuardarAsync(Arg.Any<Guid>(), Arg.Any<Stream>(), Arg.Any<string>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task SubirAsync_TipoDocumentoNombreVacio_LanzaAppValidationException()
    {
        var profesionalId = Guid.NewGuid();
        _profesionalRepo.GetByIdAsync(profesionalId, Arg.Any<CancellationToken>()).Returns(ProfesionalActivo(profesionalId));

        var act = () => CrearServicio().SubirAsync(
            profesionalId, new MemoryStream(), "foto.jpg", "  ", UsuarioId, NombreUsuario, null, CancellationToken.None);

        await act.Should().ThrowAsync<AppValidationException>();
    }

    [Fact]
    public async Task SubirAsync_DatosValidos_GuardaDocumentoYRegistraAudit()
    {
        var profesionalId = Guid.NewGuid();
        var tipo = TipoTitulo();
        _profesionalRepo.GetByIdAsync(profesionalId, Arg.Any<CancellationToken>()).Returns(ProfesionalActivo(profesionalId));
        _tipoRepo.GetOrCreateAsync("Titulo", Arg.Any<CancellationToken>()).Returns(tipo);
        _storage.GuardarAsync(profesionalId, Arg.Any<Stream>(), "foto.jpg", Arg.Any<CancellationToken>())
            .Returns(new ArchivoGuardado("carpeta/archivo.jpg", "image/jpeg", 123, "foto.jpg"));

        var result = await CrearServicio().SubirAsync(
            profesionalId, new MemoryStream(), "foto.jpg", "Titulo", UsuarioId, NombreUsuario, "1.2.3.4", CancellationToken.None);

        result.TipoDocumento.Nombre.Should().Be("Titulo");
        result.ContentType.Should().Be("image/jpeg");

        await _documentoRepo.Received(1).AddAsync(
            Arg.Is<Documento>(d => d.ProfesionalId == profesionalId && d.TipoDocumentoId == tipo.Id),
            Arg.Any<CancellationToken>());

        await _auditRepo.Received(1).AddAsync(
            Arg.Is<AuditLog>(a => a.Accion == AccionAudit.SubirDocumento && a.ProfesionalId == profesionalId));
    }

    // --- ObtenerArchivoAsync ---

    [Fact]
    public async Task ObtenerArchivoAsync_DocumentoNoExiste_LanzaNotFoundException()
    {
        var id = Guid.NewGuid();
        _documentoRepo.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns((Documento?)null);

        var act = () => CrearServicio().ObtenerArchivoAsync(id, UsuarioId, NombreUsuario, null, CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task ObtenerArchivoAsync_Existente_AbreStreamYRegistraAudit()
    {
        var tipo = TipoTitulo();
        var documento = new Documento
        {
            Id = Guid.NewGuid(),
            ProfesionalId = Guid.NewGuid(),
            TipoDocumentoId = tipo.Id,
            TipoDocumento = tipo,
            UrlArchivo = "carpeta/archivo.jpg",
            NombreOriginal = "foto.jpg",
            ContentType = "image/jpeg",
            TamanioBytes = 123,
            FechaCarga = DateTime.UtcNow,
            CargadoPorId = UsuarioId
        };
        _documentoRepo.GetByIdAsync(documento.Id, Arg.Any<CancellationToken>()).Returns(documento);
        _storage.AbrirAsync(documento.UrlArchivo, Arg.Any<CancellationToken>()).Returns(new MemoryStream([1, 2, 3]));

        var result = await CrearServicio().ObtenerArchivoAsync(documento.Id, UsuarioId, NombreUsuario, "1.2.3.4", CancellationToken.None);

        result.ContentType.Should().Be("image/jpeg");
        result.NombreOriginal.Should().Be("foto.jpg");

        await _auditRepo.Received(1).AddAsync(
            Arg.Is<AuditLog>(a => a.Accion == AccionAudit.VerDocumento && a.ProfesionalId == documento.ProfesionalId));
    }

    // --- EliminarAsync ---

    [Fact]
    public async Task EliminarAsync_DocumentoNoExiste_LanzaNotFoundException()
    {
        var id = Guid.NewGuid();
        _documentoRepo.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns((Documento?)null);

        var act = () => CrearServicio().EliminarAsync(id, UsuarioId, NombreUsuario, null, CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task EliminarAsync_Existente_SoftDeleteBorraArchivoYRegistraAudit()
    {
        var tipo = TipoTitulo();
        var documento = new Documento
        {
            Id = Guid.NewGuid(),
            ProfesionalId = Guid.NewGuid(),
            TipoDocumentoId = tipo.Id,
            TipoDocumento = tipo,
            UrlArchivo = "carpeta/archivo.jpg",
            NombreOriginal = "foto.jpg",
            ContentType = "image/jpeg",
            TamanioBytes = 123,
            FechaCarga = DateTime.UtcNow,
            CargadoPorId = UsuarioId
        };
        _documentoRepo.GetByIdAsync(documento.Id, Arg.Any<CancellationToken>()).Returns(documento);

        await CrearServicio().EliminarAsync(documento.Id, UsuarioId, NombreUsuario, "1.2.3.4", CancellationToken.None);

        documento.EliminadoEn.Should().NotBeNull();
        _storage.Received(1).Eliminar(documento.UrlArchivo);
        await _documentoRepo.Received(1).UpdateAsync(documento, Arg.Any<CancellationToken>());

        await _auditRepo.Received(1).AddAsync(
            Arg.Is<AuditLog>(a =>
                a.Accion == AccionAudit.EliminarDocumento &&
                a.ProfesionalId == documento.ProfesionalId &&
                a.DetalleExtra == "Titulo"));
    }

    // --- ListarTiposAsync ---

    [Fact]
    public async Task ListarTiposAsync_RetornaListaMapeada()
    {
        var tipos = new List<TipoDocumento> { TipoTitulo() };
        _tipoRepo.ListAllAsync(Arg.Any<CancellationToken>()).Returns(tipos);

        var result = await CrearServicio().ListarTiposAsync(CancellationToken.None);

        result.Should().HaveCount(1);
        result[0].Nombre.Should().Be("Titulo");
    }
}
