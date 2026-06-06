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
                
                long bytesToFree = memory.FileSizeBytes;
                if (!string.IsNullOrEmpty(memory.AdditionalMediaJson))
                {
                    try
                    {
                        var mediaItems = System.Text.Json.JsonSerializer.Deserialize<List<TouchLove.Domain.Entities.MemoryMediaItem>>(memory.AdditionalMediaJson);
                        if (mediaItems != null)
                        {
                            bytesToFree = 0;
                            foreach (var item in mediaItems)
                            {
                                bytesToFree += item.FileSizeBytes;
                                if (item.StoragePath != memory.StoragePath)
                                    await _storage.DeleteAsync(item.StoragePath);
                            }
                        }
                    }
                    catch { }
                }

                var couple = await _db.Couples.FindAsync([memory.CoupleId]);
                if (couple != null)
                {
                    couple.UsedStorageBytes -= bytesToFree;
                    if (couple.UsedStorageBytes < 0) couple.UsedStorageBytes = 0;
                }

                _db.Memories.Remove(memory);
                _logger.LogInformation("Hard deleted memory {Id} and freed {Bytes} bytes", memory.Id, bytesToFree);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete memory {Id}", memory.Id);
            }
        }

        await _db.SaveChangesAsync();
    }
}
