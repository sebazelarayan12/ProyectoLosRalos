using LosRalos.Application.Entities;
using LosRalos.Application.Interfaces;

namespace LosRalos.Infrastructure.Persistence.Repositories;

public class AuditLogRepository(AppDbContext db) : IAuditLogRepository
{
    public async Task AddAsync(AuditLog entry, CancellationToken ct = default)
    {
        db.AuditLogs.Add(entry);
        await db.SaveChangesAsync(ct).ConfigureAwait(false);
    }
}
