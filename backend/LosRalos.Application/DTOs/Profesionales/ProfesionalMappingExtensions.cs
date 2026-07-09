using LosRalos.Application.Entities;

namespace LosRalos.Application.DTOs.Profesionales;

public static class ProfesionalMappingExtensions
{
    private static string Mayusculas(string s) => s.Trim().ToUpperInvariant();

    [return: System.Diagnostics.CodeAnalysis.NotNullIfNotNull(nameof(s))]
    private static string? MayusculasOpcional(string? s) => s is null ? null : Mayusculas(s);


    public static ProfesionalDetalleResponse ToDetalleResponse(this Profesional p) => new()
    {
        Id = p.Id,
        Apellido = p.Apellido,
        Nombre = p.Nombre,
        Dni = p.Dni,
        Cuil = p.Cuil,
        FechaNacimiento = p.FechaNacimiento,
        Sexo = p.Sexo.ToString(),
        EstadoCivil = p.EstadoCivil?.ToString(),
        Domicilio = p.Domicilio,
        Barrio = p.Barrio,
        Localidad = p.Localidad,
        Provincia = p.Provincia,
        CodigoPostal = p.CodigoPostal,
        Telefono = p.Telefono,
        Email = p.Email,
        Matricula = p.Matricula,
        Cargo = p.Cargo?.Nombre ?? string.Empty,
        AreaOperativa = p.AreaOperativa?.Nombre ?? string.Empty,
        TipoEfector = p.TipoEfector.ToString(),
        Nivel = p.Nivel?.ToString(),
        Planta = p.Planta?.ToString(),
        NroExpediente = p.NroExpediente,
        Tipo = p.Tipo?.ToString(),
        Activo = p.Activo,
        FechaCreacion = p.FechaCreacion,
        FechaActualizacion = p.FechaActualizacion,
        Documentos = p.Documentos.Select(d => new DocumentoResumenResponse
        {
            Id = d.Id,
            TipoDocumento = d.TipoDocumento?.Nombre ?? string.Empty,
            NombreOriginal = d.NombreOriginal,
            ContentType = d.ContentType,
            TamanioBytes = d.TamanioBytes,
            FechaCarga = d.FechaCarga
        }).ToList()
    };

    public static ProfesionalResumenResponse ToResumenResponse(this Profesional p) => new()
    {
        Id = p.Id,
        Apellido = p.Apellido,
        Nombre = p.Nombre,
        Dni = p.Dni,
        Cuil = p.Cuil,
        Matricula = p.Matricula,
        Cargo = p.Cargo?.Nombre ?? string.Empty,
        NroExpediente = p.NroExpediente,
        Tipo = p.Tipo?.ToString()
    };

    public static Profesional ToEntity(this ProfesionalRequest req, Cargo cargo, AreaOperativa areaOperativa) => new()
    {
        Id = Guid.NewGuid(),
        Apellido = Mayusculas(req.Apellido),
        Nombre = Mayusculas(req.Nombre),
        Dni = req.Dni,
        Cuil = req.Cuil,
        FechaNacimiento = req.FechaNacimiento,
        Sexo = req.Sexo,
        EstadoCivil = req.EstadoCivil,
        Domicilio = MayusculasOpcional(req.Domicilio),
        Barrio = MayusculasOpcional(req.Barrio),
        Localidad = Mayusculas(req.Localidad),
        Provincia = Mayusculas(req.Provincia),
        CodigoPostal = req.CodigoPostal,
        Telefono = req.Telefono,
        Email = req.Email,
        Matricula = MayusculasOpcional(req.Matricula),
        Cargo = cargo,
        CargoId = cargo.Id,
        AreaOperativa = areaOperativa,
        AreaOperativaId = areaOperativa.Id,
        TipoEfector = req.TipoEfector,
        Nivel = req.Nivel,
        Planta = req.Planta,
        NroExpediente = MayusculasOpcional(req.NroExpediente),
        Tipo = req.Tipo,
        Activo = true,
        FechaCreacion = DateTime.UtcNow,
        FechaActualizacion = DateTime.UtcNow
    };

    public static List<string> ApplyPatch(this Profesional p, PatchProfesionalRequest req, Cargo? cargo, AreaOperativa? areaOperativa)
    {
        var changed = new List<string>();

        if (req.Apellido is not null && Mayusculas(req.Apellido) != p.Apellido)
        { p.Apellido = Mayusculas(req.Apellido); changed.Add(nameof(Profesional.Apellido)); }

        if (req.Nombre is not null && Mayusculas(req.Nombre) != p.Nombre)
        { p.Nombre = Mayusculas(req.Nombre); changed.Add(nameof(Profesional.Nombre)); }

        if (req.Dni is not null && req.Dni != p.Dni)
        { p.Dni = req.Dni; changed.Add(nameof(Profesional.Dni)); }

        if (req.Cuil is not null && req.Cuil != p.Cuil)
        { p.Cuil = req.Cuil; changed.Add(nameof(Profesional.Cuil)); }

        if (req.FechaNacimiento.HasValue && req.FechaNacimiento.Value != p.FechaNacimiento)
        { p.FechaNacimiento = req.FechaNacimiento.Value; changed.Add(nameof(Profesional.FechaNacimiento)); }

        if (req.Sexo.HasValue && req.Sexo.Value != p.Sexo)
        { p.Sexo = req.Sexo.Value; changed.Add(nameof(Profesional.Sexo)); }

        if (req.EstadoCivil.HasValue && req.EstadoCivil.Value != p.EstadoCivil)
        { p.EstadoCivil = req.EstadoCivil.Value; changed.Add(nameof(Profesional.EstadoCivil)); }

        if (req.Domicilio is not null && Mayusculas(req.Domicilio) != p.Domicilio)
        { p.Domicilio = Mayusculas(req.Domicilio); changed.Add(nameof(Profesional.Domicilio)); }

        if (req.Barrio is not null && Mayusculas(req.Barrio) != p.Barrio)
        { p.Barrio = Mayusculas(req.Barrio); changed.Add(nameof(Profesional.Barrio)); }

        if (req.Localidad is not null && Mayusculas(req.Localidad) != p.Localidad)
        { p.Localidad = Mayusculas(req.Localidad); changed.Add(nameof(Profesional.Localidad)); }

        if (req.Provincia is not null && Mayusculas(req.Provincia) != p.Provincia)
        { p.Provincia = Mayusculas(req.Provincia); changed.Add(nameof(Profesional.Provincia)); }

        if (req.CodigoPostal is not null && req.CodigoPostal != p.CodigoPostal)
        { p.CodigoPostal = req.CodigoPostal; changed.Add(nameof(Profesional.CodigoPostal)); }

        if (req.Telefono is not null && req.Telefono != p.Telefono)
        { p.Telefono = req.Telefono; changed.Add(nameof(Profesional.Telefono)); }

        if (req.Email is not null && req.Email != p.Email)
        { p.Email = req.Email; changed.Add(nameof(Profesional.Email)); }

        if (req.Matricula is not null && Mayusculas(req.Matricula) != p.Matricula)
        { p.Matricula = Mayusculas(req.Matricula); changed.Add(nameof(Profesional.Matricula)); }

        if (cargo is not null && cargo.Id != p.CargoId)
        { p.Cargo = cargo; p.CargoId = cargo.Id; changed.Add(nameof(Profesional.Cargo)); }

        if (areaOperativa is not null && areaOperativa.Id != p.AreaOperativaId)
        { p.AreaOperativa = areaOperativa; p.AreaOperativaId = areaOperativa.Id; changed.Add(nameof(Profesional.AreaOperativa)); }

        if (req.TipoEfector.HasValue && req.TipoEfector.Value != p.TipoEfector)
        { p.TipoEfector = req.TipoEfector.Value; changed.Add(nameof(Profesional.TipoEfector)); }

        if (req.Nivel.HasValue && req.Nivel.Value != p.Nivel)
        { p.Nivel = req.Nivel.Value; changed.Add(nameof(Profesional.Nivel)); }

        if (req.Planta.HasValue && req.Planta.Value != p.Planta)
        { p.Planta = req.Planta.Value; changed.Add(nameof(Profesional.Planta)); }

        if (req.NroExpediente is not null && Mayusculas(req.NroExpediente) != p.NroExpediente)
        { p.NroExpediente = Mayusculas(req.NroExpediente); changed.Add(nameof(Profesional.NroExpediente)); }

        if (req.Tipo.HasValue && req.Tipo.Value != p.Tipo)
        { p.Tipo = req.Tipo.Value; changed.Add(nameof(Profesional.Tipo)); }

        return changed;
    }

    public static CargoResponse ToResponse(this Cargo c) => new()
    {
        Id = c.Id,
        Nombre = c.Nombre
    };

    public static AreaOperativaResponse ToResponse(this AreaOperativa a) => new()
    {
        Id = a.Id,
        Nombre = a.Nombre
    };
}
