using System.Text;
using System.Text.Json;
using LosRalos.Application.Entities;
using LosRalos.Application.Entities.Enums;
using LosRalos.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace LosRalos.Infrastructure.Persistence.Repositories;

public class ProfesionalRepository(AppDbContext db) : IProfesionalRepository
{
    // Cursor encodes (Apellido, FechaCreacion) para orden por Apellido, o (Dni) para orden por Dni
    // (Dni es unico, no necesita tiebreak). El largo del Dni (7 u 8 digitos) entra en la comparacion
    // para que el orden numerico no se confunda con orden lexicografico (ver OrdenNumericoDni abajo).
    private record CursorData(string? Apellido, DateTime? FechaCreacion, string? Dni);

    private static string EncodeCursor(Profesional last, OrdenarPor ordenarPor)
    {
        var data = ordenarPor is OrdenarPor.DniAsc or OrdenarPor.DniDesc
            ? new CursorData(null, null, last.Dni)
            : new CursorData(last.Apellido, last.FechaCreacion, null);
        var json = JsonSerializer.Serialize(data);
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(json));
    }

    private static CursorData? DecodeCursor(string? cursor)
    {
        if (cursor is null) return null;
        try
        {
            var json = Encoding.UTF8.GetString(Convert.FromBase64String(cursor));
            return JsonSerializer.Deserialize<CursorData>(json);
        }
        catch { return null; }
    }

    public async Task<(List<Profesional> Items, string? NextCursor)> SearchAsync(
        string? busqueda, TipoLegajo? tipo, Guid? areaOperativaId, TipoEfector? tipoEfector,
        EstadoProfesionalFiltro? estado, OrdenarPor ordenarPor,
        string? cursor, int porPagina, CancellationToken ct)
    {
        IQueryable<Profesional> q = (estado ?? EstadoProfesionalFiltro.Activos) switch
        {
            EstadoProfesionalFiltro.Inactivos => db.Profesionales.Where(p => !p.Activo),
            EstadoProfesionalFiltro.Todos => db.Profesionales,
            _ => db.Profesionales.Where(p => p.Activo)
        };

        if (!string.IsNullOrWhiteSpace(busqueda))
            q = q.Where(p =>
                EF.Functions.ILike(p.Apellido, $"%{busqueda}%") ||
                (p.NroExpediente != null && EF.Functions.ILike(p.NroExpediente, $"%{busqueda}%")) ||
                EF.Functions.ILike(p.Dni, $"%{busqueda}%") ||
                (p.Cuil != null && EF.Functions.ILike(p.Cuil, $"%{busqueda}%")));

        if (tipo.HasValue)
            q = q.Where(p => p.Tipo == tipo.Value);

        if (areaOperativaId.HasValue)
            q = q.Where(p => p.AreaOperativaId == areaOperativaId.Value);

        if (tipoEfector.HasValue)
            q = q.Where(p => p.TipoEfector == tipoEfector.Value);

        var cursorData = DecodeCursor(cursor);

        if (ordenarPor is OrdenarPor.DniAsc or OrdenarPor.DniDesc)
        {
            if (cursorData?.Dni is { } cDni)
            {
                q = ordenarPor == OrdenarPor.DniAsc
                    ? q.Where(p => p.Dni.Length > cDni.Length || (p.Dni.Length == cDni.Length && string.Compare(p.Dni, cDni) > 0))
                    : q.Where(p => p.Dni.Length < cDni.Length || (p.Dni.Length == cDni.Length && string.Compare(p.Dni, cDni) < 0));
            }

            q = ordenarPor == OrdenarPor.DniAsc
                ? q.OrderBy(p => p.Dni.Length).ThenBy(p => p.Dni)
                : q.OrderByDescending(p => p.Dni.Length).ThenByDescending(p => p.Dni);
        }
        else
        {
            if (cursorData is { Apellido: { } ca, FechaCreacion: { } cf })
            {
                q = ordenarPor == OrdenarPor.ApellidoAsc
                    ? q.Where(p => string.Compare(p.Apellido, ca) > 0 || (p.Apellido == ca && p.FechaCreacion > cf))
                    : q.Where(p => string.Compare(p.Apellido, ca) < 0 || (p.Apellido == ca && p.FechaCreacion > cf));
            }

            q = ordenarPor == OrdenarPor.ApellidoAsc
                ? q.OrderBy(p => p.Apellido).ThenBy(p => p.FechaCreacion)
                : q.OrderByDescending(p => p.Apellido).ThenBy(p => p.FechaCreacion);
        }

        var items = await q
            .Include(p => p.Cargo)
            .Take(porPagina + 1)
            .AsNoTracking()
            .ToListAsync(ct)
            .ConfigureAwait(false);

        if (items.Count <= porPagina)
            return (items, null);

        var page = items.Take(porPagina).ToList();
        return (page, EncodeCursor(page[^1], ordenarPor));
    }

    public async Task<Profesional?> GetByIdAsync(Guid id, CancellationToken ct)
        => await db.Profesionales
            .AsNoTracking()
            .Include(p => p.Cargo)
            .Include(p => p.AreaOperativa)
            .Include(p => p.Documentos.Where(d => d.EliminadoEn == null))
            .ThenInclude(d => d.TipoDocumento)
            .FirstOrDefaultAsync(p => p.Id == id, ct)
            .ConfigureAwait(false);

    public async Task<bool> ExistsDniAsync(string dni, Guid? excludeId, CancellationToken ct)
    {
        var q = db.Profesionales.Where(p => p.Dni == dni);
        if (excludeId.HasValue)
            q = q.Where(p => p.Id != excludeId.Value);
        return await q.AnyAsync(ct).ConfigureAwait(false);
    }

    public async Task<bool> ExistsCuilAsync(string? cuil, Guid? excludeId, CancellationToken ct)
    {
        var q = db.Profesionales.Where(p => p.Cuil == cuil);
        if (excludeId.HasValue)
            q = q.Where(p => p.Id != excludeId.Value);
        return await q.AnyAsync(ct).ConfigureAwait(false);
    }

    public async Task AddAsync(Profesional profesional, CancellationToken ct)
    {
        db.Profesionales.Add(profesional);
        await db.SaveChangesAsync(ct).ConfigureAwait(false);
    }

    public async Task UpdateAsync(Profesional profesional, CancellationToken ct)
    {
        db.Profesionales.Update(profesional);
        await db.SaveChangesAsync(ct).ConfigureAwait(false);
    }

    public async Task DeleteAsync(Profesional profesional, CancellationToken ct)
    {
        db.Profesionales.Remove(profesional);
        await db.SaveChangesAsync(ct).ConfigureAwait(false);
    }
}
