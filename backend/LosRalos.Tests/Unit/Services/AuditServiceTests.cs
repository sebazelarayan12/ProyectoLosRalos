using FluentAssertions;
using LosRalos.Application.Entities;
using LosRalos.Application.Entities.Enums;
using LosRalos.Application.Interfaces;
using LosRalos.Application.Services;
using NSubstitute;

namespace LosRalos.Tests.Unit.Services;

public class AuditServiceTests
{
    private readonly IAuditLogRepository _repo = Substitute.For<IAuditLogRepository>();

    private AuditService CrearServicio() => new(_repo);

    private static AuditLog Entrada() => new()
    {
        Id = Guid.NewGuid(),
        UsuarioId = Guid.NewGuid(),
        NombreUsuario = "Admin Test",
        Accion = AccionAudit.VerLegajo,
        ProfesionalId = Guid.NewGuid(),
        Timestamp = DateTime.UtcNow,
        IpOrigen = "1.2.3.4"
    };

    [Fact]
    public async Task SearchAsync_DelegaAlRepoYMapeaAResponse()
    {
        var entrada = Entrada();
        _repo.SearchAsync(null, null, null, null, null, 50, Arg.Any<CancellationToken>())
            .Returns(([entrada], (string?)null));

        var result = await CrearServicio().SearchAsync(null, null, null, null, null, 50, CancellationToken.None);

        result.Items.Should().ContainSingle();
        result.Items[0].Id.Should().Be(entrada.Id);
        result.Items[0].Accion.Should().Be("VerLegajo");
        result.HasNextPage.Should().BeFalse();
        result.PorPagina.Should().Be(50);
    }

    [Fact]
    public async Task SearchAsync_ConNextCursor_HasNextPageEnTrue()
    {
        _repo.SearchAsync(null, null, null, null, null, 50, Arg.Any<CancellationToken>())
            .Returns(([Entrada()], "cursor-siguiente"));

        var result = await CrearServicio().SearchAsync(null, null, null, null, null, 50, CancellationToken.None);

        result.HasNextPage.Should().BeTrue();
        result.Cursor.Should().Be("cursor-siguiente");
    }
}
