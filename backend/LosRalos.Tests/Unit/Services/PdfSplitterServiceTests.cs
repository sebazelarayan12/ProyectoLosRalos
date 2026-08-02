using FluentAssertions;
using LosRalos.Infrastructure.Services;
using PdfSharpCore.Pdf;

namespace LosRalos.Tests.Unit.Services;

public class PdfSplitterServiceTests
{
    private static MemoryStream CrearPdfDePaginas(int cantidad)
    {
        var documento = new PdfDocument();
        for (var i = 0; i < cantidad; i++)
            documento.AddPage();

        var stream = new MemoryStream();
        documento.Save(stream, false);
        stream.Position = 0;
        return stream;
    }

    [Fact]
    public void ContarPaginas_PdfDeCincoPaginas_Retorna5()
    {
        using var pdf = CrearPdfDePaginas(5);
        var servicio = new PdfSplitterService();

        var resultado = servicio.ContarPaginas(pdf);

        resultado.Should().Be(5);
    }

    [Fact]
    public void ExtraerRango_PaginasDosATres_RetornaPdfDeDosPaginas()
    {
        using var pdf = CrearPdfDePaginas(5);
        var servicio = new PdfSplitterService();

        using var extraido = servicio.ExtraerRango(pdf, 2, 3);
        var paginasExtraidas = servicio.ContarPaginas(extraido);

        paginasExtraidas.Should().Be(2);
    }

    [Fact]
    public void ExtraerRango_UnaSolaPagina_RetornaPdfDeUnaPagina()
    {
        using var pdf = CrearPdfDePaginas(3);
        var servicio = new PdfSplitterService();

        using var extraido = servicio.ExtraerRango(pdf, 1, 1);
        var paginasExtraidas = servicio.ContarPaginas(extraido);

        paginasExtraidas.Should().Be(1);
    }
}
