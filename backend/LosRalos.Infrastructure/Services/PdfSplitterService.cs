using LosRalos.Application.Interfaces;
using PdfSharpCore.Pdf;
using PdfSharpCore.Pdf.IO;

namespace LosRalos.Infrastructure.Services;

public class PdfSplitterService : IPdfSplitterService
{
    public int ContarPaginas(Stream pdf)
    {
        pdf.Position = 0;
        using var documento = PdfReader.Open(pdf, PdfDocumentOpenMode.InformationOnly);
        return documento.PageCount;
    }

    public Stream ExtraerRango(Stream pdf, int paginaInicio, int paginaFin)
    {
        pdf.Position = 0;
        using var origen = PdfReader.Open(pdf, PdfDocumentOpenMode.Import);
        using var destino = new PdfDocument();

        for (var i = paginaInicio; i <= paginaFin; i++)
            destino.AddPage(origen.Pages[i - 1]);

        var resultado = new MemoryStream();
        destino.Save(resultado, false);
        resultado.Position = 0;
        return resultado;
    }
}
