namespace TouchLove.Application.Interfaces;

public interface IEmailService
{
    Task SendEmailVerificationAsync(string email, string verifyLink, CancellationToken ct = default);
    Task SendPasswordResetAsync(string email, string resetLink, CancellationToken ct = default);
    Task SendPairingSuccessAsync(string email, string partnerDisplayName, Guid coupleId, CancellationToken ct = default);
    Task SendAnniversaryReminderAsync(string email, string coupleName, int days, CancellationToken ct = default);
    Task SendPersonalReminderAsync(string email, string title, DateOnly date, CancellationToken ct = default);
}
