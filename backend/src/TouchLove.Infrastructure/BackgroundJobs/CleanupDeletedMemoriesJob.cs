using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TouchLove.Application.Interfaces;

namespace TouchLove.Infrastructure.BackgroundJobs;

public class CleanupDeletedMemoriesJob
{
    private readonly IApplicationDbContext _db;
    private readonly IFileStorageService _storage;
    private readonly ILogger<CleanupDeletedMemoriesJob> _logger;

    public CleanupDeletedMemoriesJob(IApplicationDbContext db, IFileStorageService storage, ILogger<CleanupDeletedMemoriesJob> logger)
    {
        _db = db;
        _storage = storage;
        _logger = logger;
    }

    [AutomaticRetry(Attempts = 2)]
    public async Task ExecuteAsync()
    {
        var now = DateTime.UtcNow;
        var toDelete = await _db.Memories
            .IgnoreQueryFilters()
            .Where(m => m.IsDeleted && m.DeleteScheduledAt.HasValue && m.DeleteScheduledAt < now)
            .ToListAsync();

        foreach (var memory in toDelete)
        {
            try
            {
                await _storage.DeleteAsync(memory.StoragePath);
                _db.Memories.Remove(memory);
                _logger.LogInformation("Hard deleted memory {Id} at {Path}", memory.Id, memory.StoragePath);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete memory {Id}", memory.Id);
            }
        }

        await _db.SaveChangesAsync();
    }
}
