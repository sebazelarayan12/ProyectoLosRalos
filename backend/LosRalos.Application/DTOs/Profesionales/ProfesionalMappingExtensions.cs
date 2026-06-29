using LosRalos.Application.Entities;

namespace LosRalos.Application.DTOs.Profesionales;

public static class ProfesionalMappingExtensions
{
    public static ProfesionalDetalleResponse ToDetalleResponse(this Profesional p) => new()
    {
        Id = p.Id,
        Apellido = p.Apellido,
        Nombre = p.Nombre,
        Dni = p.Dni,
        Cuil = p.Cuil,
        FechaNacimiento = p.FechaNacimiento,
        Sexo = p.Sexo.ToString(),
        EstadoCivil = p.EstadoCivil.ToString(),
        Domicilio = p.Domicilio,
        Barrio = p.Barrio,
        Localidad = p.Localidad,
        Provincia = p.Provincia,
        CodigoPostal = p.CodigoPostal,
        Telefono = p.Telefono,
        Email = p.Email,
        Funcion = p.Funcion,
        Servicio = p.Servicio,
        Nivel = p.Nivel.ToString(),
        Planta = p.Planta.ToString(),
        NroExpediente = p.NroExpediente,
        Tipo = p.Tipo.ToString(),
        Activo = p.Activo,
        FechaCreacion = p.FechaCreacion,
        FechaActualizacion = p.FechaActualizacion
    };

    public static ProfesionalResumenResponse ToResumenResponse(this Profesional p) => new()
    {
        Id = p.Id,
        Apellido = p.Apellido,
        Nombre = p.Nombre,
        Funcion = p.Funcion,
        Servicio = p.Servicio,
        NroExpediente = p.NroExpediente,
        Tipo = p.Tipo.ToString()
    };

    public static Profesional ToEntity(this ProfesionalRequest req) => new()
    {
        Id = Guid.NewGuid(),
        Apellido = req.Apellido,
        Nombre = req.Nombre,
        Dni = req.Dni,
        Cuil = req.Cuil,
        FechaNacimiento = req.FechaNacimiento,
        Sexo = req.Sexo,
        EstadoCivil = req.EstadoCivil,
        Domicilio = req.Domicilio,
        Barrio = req.Barrio,
        Localidad = req.Localidad,
        Provincia = req.Provincia,
        CodigoPostal = req.CodigoPostal,
        Telefono = req.Telefono,
        Email = req.Email,
        Funcion = req.Funcion,
        Servicio = req.Servicio,
        Nivel = req.Nivel,
        Planta = req.Planta,
        NroExpediente = req.NroExpediente,
        Tipo = req.Tipo,
        Activo = true,
        FechaCreacion = DateTime.UtcNow,
        FechaActualizacion = DateTime.UtcNow
    };

    public static List<string> ApplyPatch(this Profesional p, PatchProfesionalRequest req)
    {
        var changed = new List<string>();

        if (req.Apellido is not null && req.Apellido != p.Apellido)
        { p.Apellido = req.Apellido; changed.Add(nameof(Profesional.Apellido)); }

        if (req.Nombre is not null && req.Nombre != p.Nombre)
        { p.Nombre = req.Nombre; changed.Add(nameof(Profesional.Nombre)); }

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

        if (req.Domicilio is not null && req.Domicilio != p.Domicilio)
        { p.Domicilio = req.Domicilio; changed.Add(nameof(Profesional.Domicilio)); }

        if (req.Barrio is not null && req.Barrio != p.Barrio)
        { p.Barrio = req.Barrio; changed.Add(nameof(Profesional.Barrio)); }

        if (req.Localidad is not null && req.Localidad != p.Localidad)
        { p.Localidad = req.Localidad; changed.Add(nameof(Profesional.Localidad)); }

        if (req.Provincia is not null && req.Provincia != p.Provincia)
        { p.Provincia = req.Provincia; changed.Add(nameof(Profesional.Provincia)); }

        if (req.CodigoPostal is not null && req.CodigoPostal != p.CodigoPostal)
        { p.CodigoPostal = req.CodigoPostal; changed.Add(nameof(Profesional.CodigoPostal)); }

        if (req.Telefono is not null && req.Telefono != p.Telefono)
        { p.Telefono = req.Telefono; changed.Add(nameof(Profesional.Telefono)); }

        if (req.Email is not null && req.Email != p.Email)
        { p.Email = req.Email; changed.Add(nameof(Profesional.Email)); }

        if (req.Funcion is not null && req.Funcion != p.Funcion)
        { p.Funcion = req.Funcion; changed.Add(nameof(Profesional.Funcion)); }

        if (req.Servicio is not null && req.Servicio != p.Servicio)
        { p.Servicio = req.Servicio; changed.Add(nameof(Profesional.Servicio)); }

        if (req.Nivel.HasValue && req.Nivel.Value != p.Nivel)
        { p.Nivel = req.Nivel.Value; changed.Add(nameof(Profesional.Nivel)); }

        if (req.Planta.HasValue && req.Planta.Value != p.Planta)
        { p.Planta = req.Planta.Value; changed.Add(nameof(Profesional.Planta)); }

        if (req.NroExpediente is not null && req.NroExpediente != p.NroExpediente)
        { p.NroExpediente = req.NroExpediente; changed.Add(nameof(Profesional.NroExpediente)); }

        if (req.Tipo.HasValue && req.Tipo.Value != p.Tipo)
        { p.Tipo = req.Tipo.Value; changed.Add(nameof(Profesional.Tipo)); }

        return changed;
    }
}
