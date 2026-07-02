using FluentAssertions;
using LosRalos.Application.Exceptions;
using LosRalos.Application.Settings;
using LosRalos.Infrastructure.Services;
using Microsoft.Extensions.Options;

namespace LosRalos.Tests.Unit.Services;

public class FileStorageServiceTests : IDisposable
{
    private readonly string _basePath = Path.Combine(Path.GetTempPath(), "losralos-tests-" + Guid.NewGuid());

    private FileStorageService CrearServicio(long maxBytes = 10 * 1024 * 1024)
    {
        Directory.CreateDirectory(_basePath);
        var settings = Options.Create(new StorageSettings { BasePath = _basePath, MaxFileSizeBytes = maxBytes });
        return new FileStorageService(settings);
    }

    private static readonly byte[] JpegBytes = [0xFF, 0xD8, 0xFF, 0x00, 0x01, 0x02];
    private static readonly byte[] PngBytes = [0x89, 0x50, 0x4E, 0x47, 0x00, 0x01];
    private static readonly byte[] PdfBytes = [0x25, 0x50, 0x44, 0x46, 0x00, 0x01];
    private static readonly byte[] TextBytes = "no soy un archivo valido"u8.ToArray();

    [Fact]
    public async Task GuardarAsync_JpegValido_GuardaYRetornaContentTypeCorrecto()
    {
        using var stream = new MemoryStream(JpegBytes);
        var result = await CrearServicio().GuardarAsync(Guid.NewGuid(), stream, "foto.jpg", CancellationToken.None);

        result.ContentType.Should().Be("image/jpeg");
        result.TamanioBytes.Should().Be(JpegBytes.Length);
        File.Exists(Path.Combine(_basePath, result.UrlArchivo)).Should().BeTrue();
    }

    [Fact]
    public async Task GuardarAsync_PngValido_GuardaYRetornaContentTypeCorrecto()
    {
        using var stream = new MemoryStream(PngBytes);
        var result = await CrearServicio().GuardarAsync(Guid.NewGuid(), stream, "foto.png", CancellationToken.None);

        result.ContentType.Should().Be("image/png");
    }

    [Fact]
    public async Task GuardarAsync_PdfValido_GuardaYRetornaContentTypeCorrecto()
    {
        using var stream = new MemoryStream(PdfBytes);
        var result = await CrearServicio().GuardarAsync(Guid.NewGuid(), stream, "doc.pdf", CancellationToken.None);

        result.ContentType.Should().Be("application/pdf");
    }

    [Fact]
    public async Task GuardarAsync_MimeNoPermitido_LanzaAppValidationException()
    {
        using var stream = new MemoryStream(TextBytes);
        var act = () => CrearServicio().GuardarAsync(Guid.NewGuid(), stream, "archivo.txt", CancellationToken.None);

        await act.Should().ThrowAsync<AppValidationException>();
    }

    [Fact]
    public async Task GuardarAsync_SuperaTamanioMaximo_LanzaAppValidationException()
    {
        var data = new byte[] { 0xFF, 0xD8, 0xFF }.Concat(new byte[1000]).ToArray();
        using var stream = new MemoryStream(data);
        var act = () => CrearServicio(maxBytes: 10).GuardarAsync(Guid.NewGuid(), stream, "foto.jpg", CancellationToken.None);

        await act.Should().ThrowAsync<AppValidationException>();
    }

    [Fact]
    public async Task GuardarAsync_NombreConCaracteresNoImprimibles_SanitizaNombre()
    {
        using var stream = new MemoryStream(JpegBytes);
        var nombreConControl = "foto" + (char)7 + "malicioso.jpg";
        var result = await CrearServicio().GuardarAsync(Guid.NewGuid(), stream, nombreConControl, CancellationToken.None);

        result.NombreOriginalSanitizado.Should().Be("fotomalicioso.jpg");
    }

    [Fact]
    public async Task GuardarAsync_NombreMuyLargo_TruncaA255Caracteres()
    {
        using var stream = new MemoryStream(JpegBytes);
        var nombreLargo = new string('a', 300) + ".jpg";
        var result = await CrearServicio().GuardarAsync(Guid.NewGuid(), stream, nombreLargo, CancellationToken.None);

        result.NombreOriginalSanitizado.Length.Should().BeLessThanOrEqualTo(255);
    }

    [Fact]
    public async Task GuardarAsync_NombreConPathTraversal_NuncaSeUsaEnPathFisico()
    {
        using var stream = new MemoryStream(JpegBytes);
        var result = await CrearServicio().GuardarAsync(Guid.NewGuid(), stream, "../../../etc/passwd.jpg", CancellationToken.None);

        result.UrlArchivo.Should().NotContain("..");
        Path.GetFullPath(Path.Combine(_basePath, result.UrlArchivo))
            .Should().StartWith(Path.GetFullPath(_basePath));
    }

    [Fact]
    public async Task AbrirAsync_ArchivoGuardado_PermiteLeerContenido()
    {
        var servicio = CrearServicio();
        using var stream = new MemoryStream(PdfBytes);
        var saved = await servicio.GuardarAsync(Guid.NewGuid(), stream, "doc.pdf", CancellationToken.None);

        await using var read = await servicio.AbrirAsync(saved.UrlArchivo, CancellationToken.None);
        using var output = new MemoryStream();
        await read.CopyToAsync(output);

        output.ToArray().Should().Equal(PdfBytes);
    }

    [Fact]
    public async Task AbrirAsync_PathTraversalEnUrlArchivo_LanzaAppValidationException()
    {
        var servicio = CrearServicio();
        var act = () => servicio.AbrirAsync("../../../../etc/passwd", CancellationToken.None);

        await act.Should().ThrowAsync<AppValidationException>();
    }

    [Fact]
    public async Task Eliminar_ArchivoExistente_BorraDelDisco()
    {
        var servicio = CrearServicio();
        using var stream = new MemoryStream(PdfBytes);
        var saved = await servicio.GuardarAsync(Guid.NewGuid(), stream, "doc.pdf", CancellationToken.None);

        servicio.Eliminar(saved.UrlArchivo);

        File.Exists(Path.Combine(_basePath, saved.UrlArchivo)).Should().BeFalse();
    }

    public void Dispose()
    {
        if (Directory.Exists(_basePath))
            Directory.Delete(_basePath, recursive: true);
    }
}
