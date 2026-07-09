using FluentAssertions;
using LosRalos.Application.DTOs.Profesionales;
using LosRalos.Application.Entities;
using LosRalos.Application.Entities.Enums;

namespace LosRalos.Tests.Unit.DTOs;

public class ProfesionalMappingExtensionsTests
{
    private static Profesional ProfesionalBase() => new()
    {
        Id = Guid.NewGuid(),
        Apellido = "GOMEZ",
        Nombre = "MARIA",
        Dni = "12.345.678",
        Cuil = "27-12345678-3",
        FechaNacimiento = new DateOnly(1985, 3, 15),
        Sexo = Sexo.Femenino,
        Cargo = new Cargo { Id = Guid.NewGuid(), Nombre = "ODONTOLOGA", FechaCreacion = DateTime.UtcNow },
        CargoId = Guid.NewGuid(),
        AreaOperativa = new AreaOperativa { Id = Guid.NewGuid(), Nombre = "LOS RALOS", FechaCreacion = DateTime.UtcNow },
        AreaOperativaId = Guid.NewGuid(),
        TipoEfector = TipoEfector.Hospital,
        Tipo = TipoLegajo.Asistencial,
        Activo = true,
        FechaCreacion = DateTime.UtcNow,
        FechaActualizacion = DateTime.UtcNow
    };

    [Fact]
    public void ToResumenResponse_IncluyeDniYCuil()
    {
        var profesional = ProfesionalBase();

        var result = profesional.ToResumenResponse();

        result.Dni.Should().Be(profesional.Dni);
        result.Cuil.Should().Be(profesional.Cuil);
    }

    [Fact]
    public void ToResumenResponse_TipoNull_NoLanza()
    {
        var profesional = ProfesionalBase();
        profesional.Tipo = null;

        var result = profesional.ToResumenResponse();

        result.Tipo.Should().BeNull();
    }
}
