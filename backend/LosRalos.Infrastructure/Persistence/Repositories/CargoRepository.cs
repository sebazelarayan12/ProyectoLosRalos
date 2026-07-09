using LosRalos.Application.Entities;
using LosRalos.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace LosRalos.Infrastructure.Persistence.Repositories;

public class CargoRepository(AppDbContext db) : ICargoRepository
{
    public async Task<Cargo> GetOrCreateAsync(string nombre, CancellationToken ct)
    {
        var nombreNormalizado = nombre.Trim().ToUpperInvariant();

        var existente = await db.Cargos
            .FirstOrDefaultAsync(c => c.Nombre.ToLower() == nombreNormalizado.ToLower(), ct)
            .ConfigureAwait(false);

        if (existente is not null)
            return existente;

        var nuevo = new Cargo
        {
            Id = Guid.NewGuid(),
            Nombre = nombreNormalizado,
            FechaCreacion = DateTime.UtcNow
        };

        db.Cargos.Add(nuevo);
        await db.SaveChangesAsync(ct).ConfigureAwait(false);

        return nuevo;
    }

    public async Task<List<Cargo>> ListAllAsync(CancellationToken ct)
        => await db.Cargos
            .AsNoTracking()
            .OrderBy(c => c.Nombre)
            .ToListAsync(ct)
            .ConfigureAwait(false);
}
