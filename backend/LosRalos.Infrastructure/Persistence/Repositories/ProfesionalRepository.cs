using System.Text;
using System.Text.Json;
using LosRalos.Application.Entities;
using LosRalos.Application.Entities.Enums;
using LosRalos.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace LosRalos.Infrastructure.Persistence.Repositories;

public class ProfesionalRepository(AppDbContext db) : IProfesionalRepository
{
    // Cursor encodes (Apellido, FechaCreacion) — DateTime translates to SQL, string.Compare also supported
    private record CursorData(string Apellido, DateTime FechaCreacion);

    private static string EncodeCursor(Profesional last)
    {
        var json = JsonSerializer.Serialize(new CursorData(last.Apellido, last.FechaCreacion));
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
        string? busqueda, TipoLegajo? tipo, Planta? planta, EstadoProfesionalFiltro? estado,
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
                (p.NroExpediente != null && EF.Functions.ILike(p.NroExpediente, $"%{busqueda}%")));

        if (tipo.HasValue)
            q = q.Where(p => p.Tipo == tipo.Value);

        if (planta.HasValue)
            q = q.Where(p => p.Planta == planta.Value);

        var cursorData = DecodeCursor(cursor);
        if (cursorData is not null)
        {
            var ca = cursorData.Apellido;
            var cf = cursorData.FechaCreacion;
            q = q.Where(p =>
                string.Compare(p.Apellido, ca) > 0 ||
                (p.Apellido == ca && p.FechaCreacion > cf));
        }

        var items = await q
            .OrderBy(p => p.Apellido)
            .ThenBy(p => p.FechaCreacion)
            .Take(porPagina + 1)
            .AsNoTracking()
            .ToListAsync(ct)
            .ConfigureAwait(false);

        if (items.Count <= porPagina)
            return (items, null);

        var page = items.Take(porPagina).ToList();
        return (page, EncodeCursor(page[^1]));
    }

    public async Task<Profesional?> GetByIdAsync(Guid id, CancellationToken ct)
        => await db.Profesionales
            .AsNoTracking()
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

    public async Task<bool> ExistsCuilAsync(string cuil, Guid? excludeId, CancellationToken ct)
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
