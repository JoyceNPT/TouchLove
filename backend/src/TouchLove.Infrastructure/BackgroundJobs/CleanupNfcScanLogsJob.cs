using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TouchLove.Application.Interfaces;

namespace TouchLove.Infrastructure.BackgroundJobs;

public class CleanupNfcScanLogsJob
{
    private readonly IApplicationDbContext _db;
    private readonly ILogger<CleanupNfcScanLogsJob> _logger;

    public CleanupNfcScanLogsJob(IApplicationDbContext db, ILogger<CleanupNfcScanLogsJob> logger)
    {
        _db = db;
        _logger = logger;
    }

    [AutomaticRetry(Attempts = 1)]
    public async Task ExecuteAsync()
    {
        var cutoff = DateTime.UtcNow.AddYears(-1);
        var old = await _db.NfcScanLogs.Where(l => l.ScannedAt < cutoff).ToListAsync();
        _db.NfcScanLogs.RemoveRange(old);
        await _db.SaveChangesAsync();
        _logger.LogInformation("Cleaned up {Count} old NFC scan logs", old.Count);
    }
}
