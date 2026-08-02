namespace LosRalos.Application.Interfaces;

public interface IPdfSplitterService
{
    int ContarPaginas(Stream pdf);

    Stream ExtraerRango(Stream pdf, int paginaInicio, int paginaFin);
}
