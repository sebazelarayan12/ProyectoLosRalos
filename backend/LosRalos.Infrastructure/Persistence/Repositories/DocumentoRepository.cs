using LosRalos.Application.Entities;
using LosRalos.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace LosRalos.Infrastructure.Persistence.Repositories;

public class DocumentoRepository(AppDbContext db) : IDocumentoRepository
{
    public async Task<Documento?> GetByIdAsync(Guid id, CancellationToken ct)
        => await db.Documentos
            .Include(d => d.TipoDocumento)
            .FirstOrDefaultAsync(d => d.Id == id && d.EliminadoEn == null, ct)
            .ConfigureAwait(false);

    public async Task AddAsync(Documento documento, CancellationToken ct)
    {
        db.Documentos.Add(documento);
        await db.SaveChangesAsync(ct).ConfigureAwait(false);
    }

    public async Task UpdateAsync(Documento documento, CancellationToken ct)
    {
        db.Documentos.Update(documento);
        await db.SaveChangesAsync(ct).ConfigureAwait(false);
    }

    public async Task<List<Documento>> ListByProfesionalIdAsync(Guid profesionalId, CancellationToken ct)
        => await db.Documentos
            .Include(d => d.TipoDocumento)
            .Where(d => d.ProfesionalId == profesionalId && d.EliminadoEn == null)
            .AsNoTracking()
            .ToListAsync(ct)
            .ConfigureAwait(false);
}
