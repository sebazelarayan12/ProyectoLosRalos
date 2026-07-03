using System.Text;
using System.Text.Json;
using LosRalos.Application.Entities;
using LosRalos.Application.Entities.Enums;
using LosRalos.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace LosRalos.Infrastructure.Persistence.Repositories;

public class UsuarioRepository(AppDbContext db) : IUsuarioRepository
{
    // Cursor encodes (Nombre, FechaCreacion) — mismo patron que ProfesionalRepository
    private record CursorData(string Nombre, DateTime FechaCreacion);

    private static string EncodeCursor(Usuario last)
    {
        var json = JsonSerializer.Serialize(new CursorData(last.Nombre, last.FechaCreacion));
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

    public Task<Usuario?> GetByEmailAsync(string email, CancellationToken ct = default)
        => db.Usuarios
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == email, ct);

    public Task<Usuario?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => db.Usuarios
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id, ct);

    public Task<bool> ExistsActiveAsync(Guid id, CancellationToken ct = default)
        => db.Usuarios
            .AnyAsync(u => u.Id == id && u.Activo, ct);

    public async Task UpdateUltimoAccesoAsync(Guid id, DateTime timestamp, CancellationToken ct = default)
        => await db.Usuarios
            .Where(u => u.Id == id)
            .ExecuteUpdateAsync(s => s.SetProperty(u => u.UltimoAcceso, timestamp), ct)
            .ConfigureAwait(false);

    public async Task<(List<Usuario> Items, string? NextCursor)> SearchAsync(
        string? cursor, int porPagina, CancellationToken ct)
    {
        IQueryable<Usuario> q = db.Usuarios;

        var cursorData = DecodeCursor(cursor);
        if (cursorData is not null)
        {
            var cn = cursorData.Nombre;
            var cf = cursorData.FechaCreacion;
            q = q.Where(u =>
                string.Compare(u.Nombre, cn) > 0 ||
                (u.Nombre == cn && u.FechaCreacion > cf));
        }

        var items = await q
            .OrderBy(u => u.Nombre)
            .ThenBy(u => u.FechaCreacion)
            .Take(porPagina + 1)
            .AsNoTracking()
            .ToListAsync(ct)
            .ConfigureAwait(false);

        if (items.Count <= porPagina)
            return (items, null);

        var page = items.Take(porPagina).ToList();
        return (page, EncodeCursor(page[^1]));
    }

    public async Task<bool> ExistsEmailAsync(string email, Guid? excludeId, CancellationToken ct)
    {
        var q = db.Usuarios.Where(u => u.Email == email);
        if (excludeId.HasValue)
            q = q.Where(u => u.Id != excludeId.Value);
        return await q.AnyAsync(ct).ConfigureAwait(false);
    }

    public Task<int> CountActiveAdminsAsync(CancellationToken ct)
        => db.Usuarios.CountAsync(u => u.Rol == RolUsuario.Admin && u.Activo, ct);

    public async Task AddAsync(Usuario usuario, CancellationToken ct)
    {
        db.Usuarios.Add(usuario);
        await db.SaveChangesAsync(ct).ConfigureAwait(false);
    }

    public async Task UpdateAsync(Usuario usuario, CancellationToken ct)
    {
        db.Usuarios.Update(usuario);
        await db.SaveChangesAsync(ct).ConfigureAwait(false);
    }
}
