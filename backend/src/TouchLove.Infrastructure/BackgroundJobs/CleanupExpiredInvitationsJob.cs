using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TouchLove.Application.Interfaces;

namespace TouchLove.Infrastructure.BackgroundJobs;

public class CleanupExpiredInvitationsJob
{
    private readonly IApplicationDbContext _db;
    private readonly ILogger<CleanupExpiredInvitationsJob> _logger;

    public CleanupExpiredInvitationsJob(IApplicationDbContext db, ILogger<CleanupExpiredInvitationsJob> logger)
    {
        _db = db;
        _logger = logger;
    }

    [AutomaticRetry(Attempts = 1)]
    public async Task ExecuteAsync()
    {
        var expired = await _db.PairingInvitations
            .Where(i => !i.IsUsed && i.ExpiresAt < DateTime.UtcNow)
            .ToListAsync();

        _db.PairingInvitations.RemoveRange(expired);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Cleaned up {Count} expired pairing invitations", expired.Count);
    }
}
