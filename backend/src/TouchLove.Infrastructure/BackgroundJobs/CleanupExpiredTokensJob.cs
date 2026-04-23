using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TouchLove.Application.Interfaces;

namespace TouchLove.Infrastructure.BackgroundJobs;

public class CleanupExpiredTokensJob
{
    private readonly IApplicationDbContext _db;
    private readonly ILogger<CleanupExpiredTokensJob> _logger;

    public CleanupExpiredTokensJob(IApplicationDbContext db, ILogger<CleanupExpiredTokensJob> logger)
    {
        _db = db;
        _logger = logger;
    }

    [AutomaticRetry(Attempts = 2)]
    public async Task ExecuteAsync()
    {
        var now = DateTime.UtcNow;
        _logger.LogInformation("CleanupExpiredTokensJob started at {Time}", now);

        // Hard delete expired password reset tokens
        var expiredPwReset = await _db.PasswordResetTokens.Where(t => t.ExpiresAt < now).ToListAsync();
        _db.PasswordResetTokens.RemoveRange(expiredPwReset);

        // Hard delete expired email verification tokens
        var expiredEmailVerify = await _db.EmailVerificationTokens.Where(t => t.ExpiresAt < now).ToListAsync();
        _db.EmailVerificationTokens.RemoveRange(expiredEmailVerify);

        // Hard delete old revoked refresh tokens (expired and revoked for > 7 days)
        var cutoff = now.AddDays(-7);
        var oldRefreshTokens = await _db.RefreshTokens
            .Where(t => t.ExpiresAt < now && (t.IsRevoked || t.ExpiresAt < cutoff))
            .ToListAsync();
        _db.RefreshTokens.RemoveRange(oldRefreshTokens);

        await _db.SaveChangesAsync();
        _logger.LogInformation("Cleaned up {PwReset} password tokens, {EmailVerify} email tokens, {Refresh} refresh tokens",
            expiredPwReset.Count, expiredEmailVerify.Count, oldRefreshTokens.Count);
    }
}
