using FluentAssertions;
using LosRalos.Application.DTOs.Profesionales;
using LosRalos.Application.Entities;
using LosRalos.Application.Entities.Enums;
using LosRalos.Application.Exceptions;
using LosRalos.Application.Interfaces;
using LosRalos.Application.Services;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;

namespace LosRalos.Tests.Unit.Services;

public class ProfesionalServiceTests
{
    private readonly IProfesionalRepository _repo = Substitute.For<IProfesionalRepository>();
    private readonly IAuditLogRepository _auditRepo = Substitute.For<IAuditLogRepository>();
    private readonly ICargoRepository _cargoRepo = Substitute.For<ICargoRepository>();
    private readonly IAreaOperativaRepository _areaOperativaRepo = Substitute.For<IAreaOperativaRepository>();

    private ProfesionalService CrearServicio() => new(
        _repo,
        _auditRepo,
        _cargoRepo,
        _areaOperativaRepo,
        NullLogger<ProfesionalService>.Instance);

    private static readonly Guid UsuarioId = Guid.NewGuid();
    private const string NombreUsuario = "Admin Test";

    private static readonly Cargo CargoOdontologa = new() { Id = Guid.NewGuid(), Nombre = "ODONTOLOGA", FechaCreacion = DateTime.UtcNow };
    private static readonly AreaOperativa AreaLosRalos = new() { Id = Guid.NewGuid(), Nombre = "LOS RALOS", FechaCreacion = DateTime.UtcNow };
    private static readonly Cargo CargoAdministrativo = new() { Id = Guid.NewGuid(), Nombre = "ADMINISTRATIVO", FechaCreacion = DateTime.UtcNow };

    private static Profesional ProfesionalActivo() => new()
    {
        Id = Guid.NewGuid(),
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
        Cargo = CargoOdontologa,
        CargoId = CargoOdontologa.Id,
        AreaOperativa = AreaLosRalos,
        AreaOperativaId = AreaLosRalos.Id,
        TipoEfector = TipoEfector.Hospital,
        Nivel = Nivel.Universitario,
        Planta = Planta.PermanenteEfectivo,
        Tipo = TipoLegajo.Asistencial,
        Activo = true,
        FechaCreacion = DateTime.UtcNow,
        FechaActualizacion = DateTime.UtcNow
    };

    private ProfesionalRequest RequestValido()
    {
        _cargoRepo.GetOrCreateAsync("ADMINISTRATIVO", Arg.Any<CancellationToken>()).Returns(CargoAdministrativo);
        _areaOperativaRepo.GetOrCreateAsync("LOS RALOS", Arg.Any<CancellationToken>()).Returns(AreaLosRalos);

        return new ProfesionalRequest
        {
            Apellido = "Rodriguez",
            Nombre = "Juan",
            Dni = "23.456.789",
            Cuil = "20-23456789-5",
            FechaNacimiento = new DateOnly(1990, 1, 1),
            Sexo = Sexo.Masculino,
            EstadoCivil = EstadoCivil.Soltero,
            Domicilio = "Av. Siempre Viva 742",
            Localidad = "Los Ralos",
            Provincia = "Tucuman",
            Cargo = "ADMINISTRATIVO",
            AreaOperativa = "LOS RALOS",
            TipoEfector = TipoEfector.Hospital,
            Nivel = Nivel.Secundario,
            Planta = Planta.Transitorio,
            Tipo = TipoLegajo.NoAsistencial
        };
    }

    [Fact]
    public async Task GetById_ProfesionalExistente_RetornaDetalleYRegistraVerLegajo()
    {
        var profesional = ProfesionalActivo();
        _repo.GetByIdAsync(profesional.Id, Arg.Any<CancellationToken>()).Returns(profesional);

        var result = await CrearServicio().GetByIdAsync(profesional.Id, UsuarioId, NombreUsuario, "1.2.3.4");

        result.Id.Should().Be(profesional.Id);
        result.Apellido.Should().Be(profesional.Apellido);

        await _auditRepo.Received(1).AddAsync(
            Arg.Is<AuditLog>(a => a.Accion == AccionAudit.VerLegajo && a.ProfesionalId == profesional.Id));
    }

    [Fact]
    public async Task GetById_ProfesionalNoExistente_LanzaNotFoundException()
    {
        var id = Guid.NewGuid();
        _repo.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns((Profesional?)null);

        var act = () => CrearServicio().GetByIdAsync(id, UsuarioId, NombreUsuario, null);

        await act.Should().ThrowAsync<NotFoundException>();
        await _auditRepo.DidNotReceive().AddAsync(Arg.Any<AuditLog>());
    }

    [Fact]
    public async Task Create_DniDuplicado_LanzaConflictException()
    {
        var req = RequestValido();
        _repo.ExistsDniAsync(req.Dni, null, Arg.Any<CancellationToken>()).Returns(true);

        var act = () => CrearServicio().CreateAsync(req, UsuarioId, NombreUsuario, null);

        await act.Should().ThrowAsync<ConflictException>();
        await _repo.DidNotReceive().AddAsync(Arg.Any<Profesional>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Create_CuilDuplicado_LanzaConflictException()
    {
        var req = RequestValido();
        _repo.ExistsDniAsync(req.Dni, null, Arg.Any<CancellationToken>()).Returns(false);
        _repo.ExistsCuilAsync(req.Cuil, null, Arg.Any<CancellationToken>()).Returns(true);

        var act = () => CrearServicio().CreateAsync(req, UsuarioId, NombreUsuario, null);

        await act.Should().ThrowAsync<ConflictException>();
        await _repo.DidNotReceive().AddAsync(Arg.Any<Profesional>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Create_DatosValidos_CreaProfesionalYRegistraAudit()
    {
        var req = RequestValido();
        _repo.ExistsDniAsync(req.Dni, null, Arg.Any<CancellationToken>()).Returns(false);
        _repo.ExistsCuilAsync(req.Cuil, null, Arg.Any<CancellationToken>()).Returns(false);

        var result = await CrearServicio().CreateAsync(req, UsuarioId, NombreUsuario, "1.2.3.4");

        result.Apellido.Should().Be(req.Apellido);
        result.Dni.Should().Be(req.Dni);

        await _repo.Received(1).AddAsync(
            Arg.Is<Profesional>(p => p.Apellido == req.Apellido && p.Dni == req.Dni),
            Arg.Any<CancellationToken>());

        await _auditRepo.Received(1).AddAsync(
            Arg.Is<AuditLog>(a => a.Accion == AccionAudit.CrearProfesional && a.UsuarioId == UsuarioId));
    }

    [Fact]
    public async Task Update_ProfesionalNoExistente_LanzaNotFoundException()
    {
        var id = Guid.NewGuid();
        _repo.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns((Profesional?)null);

        var act = () => CrearServicio().UpdateAsync(id, new PatchProfesionalRequest(), UsuarioId, NombreUsuario, null);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Update_DniDuplicado_LanzaConflictException()
    {
        var profesional = ProfesionalActivo();
        var req = new PatchProfesionalRequest { Dni = "99.999.999" };

        _repo.GetByIdAsync(profesional.Id, Arg.Any<CancellationToken>()).Returns(profesional);
        _repo.ExistsDniAsync(req.Dni!, profesional.Id, Arg.Any<CancellationToken>()).Returns(true);

        var act = () => CrearServicio().UpdateAsync(profesional.Id, req, UsuarioId, NombreUsuario, null);

        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task Update_CamposValidos_ActualizaYRegistraAudit()
    {
        var profesional = ProfesionalActivo();
        var nuevoCargo = new Cargo { Id = Guid.NewGuid(), Nombre = "NUEVOCARGO", FechaCreacion = DateTime.UtcNow };
        var req = new PatchProfesionalRequest { Apellido = "NuevoApellido", Cargo = "NUEVOCARGO" };

        _repo.GetByIdAsync(profesional.Id, Arg.Any<CancellationToken>()).Returns(profesional);
        _cargoRepo.GetOrCreateAsync("NUEVOCARGO", Arg.Any<CancellationToken>()).Returns(nuevoCargo);

        var result = await CrearServicio().UpdateAsync(profesional.Id, req, UsuarioId, NombreUsuario, null);

        result.Apellido.Should().Be("NuevoApellido");
        result.Cargo.Should().Be("NUEVOCARGO");

        await _repo.Received(1).UpdateAsync(
            Arg.Is<Profesional>(p => p.Apellido == "NuevoApellido"),
            Arg.Any<CancellationToken>());

        await _auditRepo.Received(1).AddAsync(
            Arg.Is<AuditLog>(a =>
                a.Accion == AccionAudit.EditarProfesional &&
                a.ProfesionalId == profesional.Id &&
                a.DetalleExtra!.Contains("Apellido")));
    }

    [Fact]
    public async Task Deactivate_ProfesionalExistente_DesactivaYRegistraAudit()
    {
        var profesional = ProfesionalActivo();
        _repo.GetByIdAsync(profesional.Id, Arg.Any<CancellationToken>()).Returns(profesional);

        await CrearServicio().DeactivateAsync(profesional.Id, UsuarioId, NombreUsuario, null);

        await _repo.Received(1).UpdateAsync(
            Arg.Is<Profesional>(p => !p.Activo),
            Arg.Any<CancellationToken>());

        await _auditRepo.Received(1).AddAsync(
            Arg.Is<AuditLog>(a =>
                a.Accion == AccionAudit.DesactivarProfesional &&
                a.ProfesionalId == profesional.Id));
    }

    [Fact]
    public async Task Deactivate_ProfesionalNoExistente_LanzaNotFoundException()
    {
        var id = Guid.NewGuid();
        _repo.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns((Profesional?)null);

        var act = () => CrearServicio().DeactivateAsync(id, UsuarioId, NombreUsuario, null);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Reactivar_ProfesionalDesactivado_ReactivaYRegistraAudit()
    {
        var profesional = ProfesionalActivo();
        profesional.Activo = false;
        _repo.GetByIdAsync(profesional.Id, Arg.Any<CancellationToken>()).Returns(profesional);

        await CrearServicio().ReactivarAsync(profesional.Id, UsuarioId, NombreUsuario, null);

        await _repo.Received(1).UpdateAsync(
            Arg.Is<Profesional>(p => p.Activo),
            Arg.Any<CancellationToken>());

        await _auditRepo.Received(1).AddAsync(
            Arg.Is<AuditLog>(a =>
                a.Accion == AccionAudit.ReactivarProfesional &&
                a.ProfesionalId == profesional.Id));
    }

    [Fact]
    public async Task Reactivar_ProfesionalNoExistente_LanzaNotFoundException()
    {
        var id = Guid.NewGuid();
        _repo.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns((Profesional?)null);

        var act = () => CrearServicio().ReactivarAsync(id, UsuarioId, NombreUsuario, null);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task EliminarDefinitivo_SinDocumentos_BorraYRegistraAudit()
    {
        var profesional = ProfesionalActivo();
        _repo.GetByIdAsync(profesional.Id, Arg.Any<CancellationToken>()).Returns(profesional);

        await CrearServicio().EliminarDefinitivoAsync(profesional.Id, UsuarioId, NombreUsuario, null);

        await _repo.Received(1).DeleteAsync(
            Arg.Is<Profesional>(p => p.Id == profesional.Id),
            Arg.Any<CancellationToken>());

        await _auditRepo.Received(1).AddAsync(
            Arg.Is<AuditLog>(a =>
                a.Accion == AccionAudit.EliminarProfesionalDefinitivo &&
                a.ProfesionalId == profesional.Id &&
                a.DetalleExtra!.Contains(profesional.Dni)));
    }

    [Fact]
    public async Task EliminarDefinitivo_ConDocumentos_LanzaAppValidationExceptionYNoBorra()
    {
        var profesional = ProfesionalActivo();
        profesional.Documentos.Add(new Documento
        {
            Id = Guid.NewGuid(),
            ProfesionalId = profesional.Id,
            TipoDocumentoId = Guid.NewGuid(),
            UrlArchivo = "x",
            NombreOriginal = "x.pdf",
            ContentType = "application/pdf",
            TamanioBytes = 1,
            FechaCarga = DateTime.UtcNow,
            CargadoPorId = Guid.NewGuid()
        });
        _repo.GetByIdAsync(profesional.Id, Arg.Any<CancellationToken>()).Returns(profesional);

        var act = () => CrearServicio().EliminarDefinitivoAsync(profesional.Id, UsuarioId, NombreUsuario, null);

        await act.Should().ThrowAsync<AppValidationException>();

        await _repo.DidNotReceive().DeleteAsync(Arg.Any<Profesional>(), Arg.Any<CancellationToken>());
        await _auditRepo.DidNotReceive().AddAsync(Arg.Any<AuditLog>());
    }

    [Fact]
    public async Task EliminarDefinitivo_ProfesionalNoExistente_LanzaNotFoundException()
    {
        var id = Guid.NewGuid();
        _repo.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns((Profesional?)null);

        var act = () => CrearServicio().EliminarDefinitivoAsync(id, UsuarioId, NombreUsuario, null);

        await act.Should().ThrowAsync<NotFoundException>();
    }
}
