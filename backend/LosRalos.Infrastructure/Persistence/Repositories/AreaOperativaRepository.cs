using LosRalos.Application.Entities;
using LosRalos.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace LosRalos.Infrastructure.Persistence.Repositories;

public class AreaOperativaRepository(AppDbContext db) : IAreaOperativaRepository
{
    public async Task<AreaOperativa> GetOrCreateAsync(string nombre, CancellationToken ct)
    {
        var nombreNormalizado = nombre.Trim().ToUpperInvariant();

        var existente = await db.AreasOperativas
            .FirstOrDefaultAsync(a => a.Nombre.ToLower() == nombreNormalizado.ToLower(), ct)
            .ConfigureAwait(false);

        if (existente is not null)
            return existente;

        var nuevo = new AreaOperativa
        {
            Id = Guid.NewGuid(),
            Nombre = nombreNormalizado,
            FechaCreacion = DateTime.UtcNow
        };

        db.AreasOperativas.Add(nuevo);
        await db.SaveChangesAsync(ct).ConfigureAwait(false);

        return nuevo;
    }

    public async Task<List<AreaOperativa>> ListAllAsync(CancellationToken ct)
        => await db.AreasOperativas
            .AsNoTracking()
            .OrderBy(a => a.Nombre)
            .ToListAsync(ct)
            .ConfigureAwait(false);
}
