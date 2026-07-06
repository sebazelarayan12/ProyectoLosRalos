using LosRalos.Application.Entities;
using LosRalos.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace LosRalos.Infrastructure.Persistence.Repositories;

public class TipoDocumentoRepository(AppDbContext db) : ITipoDocumentoRepository
{
    public async Task<TipoDocumento> GetOrCreateAsync(string nombre, CancellationToken ct)
    {
        var nombreNormalizado = nombre.Trim().ToUpperInvariant();

        var existente = await db.TiposDocumento
            .FirstOrDefaultAsync(t => t.Nombre.ToLower() == nombreNormalizado.ToLower(), ct)
            .ConfigureAwait(false);

        if (existente is not null)
            return existente;

        var nuevo = new TipoDocumento
        {
            Id = Guid.NewGuid(),
            Nombre = nombreNormalizado,
            FechaCreacion = DateTime.UtcNow
        };

        db.TiposDocumento.Add(nuevo);
        await db.SaveChangesAsync(ct).ConfigureAwait(false);

        return nuevo;
    }

    public async Task<List<TipoDocumento>> ListAllAsync(CancellationToken ct)
        => await db.TiposDocumento
            .AsNoTracking()
            .OrderBy(t => t.Nombre)
            .ToListAsync(ct)
            .ConfigureAwait(false);
}
