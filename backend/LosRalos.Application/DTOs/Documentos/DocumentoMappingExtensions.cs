using LosRalos.Application.Entities;

namespace LosRalos.Application.DTOs.Documentos;

public static class DocumentoMappingExtensions
{
    public static DocumentoResponse ToResponse(this Documento d) => new()
    {
        Id = d.Id,
        ProfesionalId = d.ProfesionalId,
        TipoDocumento = new TipoDocumentoResponse
        {
            Id = d.TipoDocumento!.Id,
            Nombre = d.TipoDocumento.Nombre
        },
        NombreOriginal = d.NombreOriginal,
        ContentType = d.ContentType,
        TamanioBytes = d.TamanioBytes,
        FechaCarga = d.FechaCarga
    };

    public static TipoDocumentoResponse ToResponse(this TipoDocumento t) => new()
    {
        Id = t.Id,
        Nombre = t.Nombre
    };
}
