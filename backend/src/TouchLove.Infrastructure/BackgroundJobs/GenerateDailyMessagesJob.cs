using Hangfire;
using Microsoft.Extensions.Logging;
using TouchLove.Application.Features.Message;

namespace TouchLove.Infrastructure.BackgroundJobs;

public class GenerateDailyMessagesJob
{
    private readonly MessageService _messageService;
    private readonly ILogger<GenerateDailyMessagesJob> _logger;

    public GenerateDailyMessagesJob(MessageService messageService, ILogger<GenerateDailyMessagesJob> logger)
    {
        _messageService = messageService;
        _logger = logger;
    }

    [AutomaticRetry(Attempts = 3, DelaysInSeconds = [60, 300, 900])]
    public async Task ExecuteAsync()
    {
        _logger.LogInformation("GenerateDailyMessagesJob started at {Time}", DateTime.UtcNow);
        try
        {
            await _messageService.GenerateForAllActiveCouplesAsync();
            _logger.LogInformation("GenerateDailyMessagesJob completed successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GenerateDailyMessagesJob failed.");
            throw; // Hangfire will retry
        }
    }
}
