using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TouchLove.Application.Interfaces;

namespace TouchLove.Infrastructure.BackgroundJobs;

public class SendAnniversaryEmailsJob
{
    private readonly IApplicationDbContext _db;
    private readonly IEmailService _email;
    private readonly ILogger<SendAnniversaryEmailsJob> _logger;

    public SendAnniversaryEmailsJob(IApplicationDbContext db, IEmailService email, ILogger<SendAnniversaryEmailsJob> logger)
    {
        _db = db;
        _email = email;
        _logger = logger;
    }

    [AutomaticRetry(Attempts = 2)]
    public async Task ExecuteAsync()
    {
        var tomorrow = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1));
        var activeCouples = await _db.Couples
            .Include(c => c.KeychainA).ThenInclude(k => k!.User).ThenInclude(u => u!.Setting)
            .Include(c => c.KeychainB).ThenInclude(k => k!.User).ThenInclude(u => u!.Setting)
            .Where(c => c.IsActive)
            .ToListAsync();

        foreach (var couple in activeCouples)
        {
            var days = tomorrow.DayNumber - couple.StartDate.DayNumber;
            // Monthly (first year) or annual (subsequent years)
            bool isMonthly = days < 365 && days % 30 == 0;
            bool isAnnual = days >= 365 && days % 365 == 0;

            if (!isMonthly && !isAnnual) continue;

            var partnerA = couple.KeychainA?.User;
            var partnerB = couple.KeychainB?.User;

            if (partnerA?.Setting?.AnnivNotifEnabled == true && !string.IsNullOrEmpty(partnerA.Email))
                await _email.SendAnniversaryReminderAsync(partnerA.Email, couple.CoupleName ?? "các bạn", days);

            if (partnerB?.Setting?.AnnivNotifEnabled == true && !string.IsNullOrEmpty(partnerB.Email))
                await _email.SendAnniversaryReminderAsync(partnerB.Email, couple.CoupleName ?? "các bạn", days);
        }
    }
}
