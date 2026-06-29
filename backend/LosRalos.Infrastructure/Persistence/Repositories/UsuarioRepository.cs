using LosRalos.Application.Entities;
using LosRalos.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace LosRalos.Infrastructure.Persistence.Repositories;

public class UsuarioRepository(AppDbContext db) : IUsuarioRepository
{
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
}
