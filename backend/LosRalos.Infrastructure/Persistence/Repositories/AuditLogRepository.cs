using System.Text;
using System.Text.Json;
using LosRalos.Application.Entities;
using LosRalos.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace LosRalos.Infrastructure.Persistence.Repositories;

public class AuditLogRepository(AppDbContext db) : IAuditLogRepository
{
    public async Task AddAsync(AuditLog entry, CancellationToken ct = default)
    {
        db.AuditLogs.Add(entry);
        await db.SaveChangesAsync(ct).ConfigureAwait(false);
    }

    // Cursor encoda Timestamp — volumen de audit en este proyecto es bajo (100-500 usuarios),
    // colision exacta de Timestamp entre dos entradas es improbable. Mismo tradeoff aceptado
    // que TipoDocumento.GetOrCreateAsync para este MVP.
    private record CursorData(DateTime Timestamp);

    private static string EncodeCursor(AuditLog last)
    {
        var json = JsonSerializer.Serialize(new CursorData(last.Timestamp));
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

    public async Task<(List<AuditLog> Items, string? NextCursor)> SearchAsync(
        Guid? usuarioId, Guid? profesionalId, DateTime? desde, DateTime? hasta,
        string? cursor, int porPagina, CancellationToken ct)
    {
        IQueryable<AuditLog> q = db.AuditLogs;

        if (usuarioId.HasValue)
            q = q.Where(a => a.UsuarioId == usuarioId.Value);

        if (profesionalId.HasValue)
            q = q.Where(a => a.ProfesionalId == profesionalId.Value);

        if (desde.HasValue)
        {
            var desdeUtc = DateTime.SpecifyKind(desde.Value.Date, DateTimeKind.Utc);
            q = q.Where(a => a.Timestamp >= desdeUtc);
        }

        if (hasta.HasValue)
        {
            // hasta llega como fecha sin hora (mismo formato que <input type="date">) — se
            // interpreta como el dia completo, no como medianoche exacta.
            var hastaUtcExclusivo = DateTime.SpecifyKind(hasta.Value.Date.AddDays(1), DateTimeKind.Utc);
            q = q.Where(a => a.Timestamp < hastaUtcExclusivo);
        }

        var cursorData = DecodeCursor(cursor);
        if (cursorData is not null)
            q = q.Where(a => a.Timestamp < cursorData.Timestamp);

        var items = await q
            .OrderByDescending(a => a.Timestamp)
            .Take(porPagina + 1)
            .AsNoTracking()
            .ToListAsync(ct)
            .ConfigureAwait(false);

        if (items.Count <= porPagina)
            return (items, null);

        var page = items.Take(porPagina).ToList();
        return (page, EncodeCursor(page[^1]));
    }
}
