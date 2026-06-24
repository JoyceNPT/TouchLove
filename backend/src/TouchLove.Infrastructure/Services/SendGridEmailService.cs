using SendGrid;
using SendGrid.Helpers.Mail;
using Microsoft.Extensions.Configuration;
using TouchLove.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace TouchLove.Infrastructure.Services;

public class SendGridEmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<SendGridEmailService> _logger;

    public SendGridEmailService(IConfiguration config, ILogger<SendGridEmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    private async Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct)
    {
        var apiKey = _config["SendGrid:ApiKey"];
        if (string.IsNullOrEmpty(apiKey))
        {
            _logger.LogWarning("SendGrid ApiKey is missing. Email not sent.");
            return;
        }

        try
        {
            var client = new SendGridClient(apiKey);
            var from = new EmailAddress(_config["Email:From"] ?? "noreply@touchlove.local", "TouchLove");
            var toAddress = new EmailAddress(to);
            var msg = MailHelper.CreateSingleEmail(from, toAddress, subject, string.Empty, htmlBody);
            
            var response = await client.SendEmailAsync(msg, ct);
            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("SendGrid email sent to {To}: {Subject}", to, subject);
            }
            else
            {
                var body = await response.Body.ReadAsStringAsync(ct);
                _logger.LogError("SendGrid failed to send email to {To}: {StatusCode} - {Body}", to, response.StatusCode, body);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception while sending SendGrid email to {To}: {Subject}", to, subject);
        }
    }

    public Task SendEmailVerificationAsync(string email, string verifyLink, CancellationToken ct = default)
        => SendAsync(email, "Xác thực tài khoản TouchLove", $"""
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
                <h2>Chào mừng đến với TouchLove!</h2>
                <p>Vui lòng click vào link bên dưới để xác thực tài khoản của bạn:</p>
                <a href="{verifyLink}" style="display:inline-block;padding:10px 20px;background:#ff4b82;color:white;text-decoration:none;border-radius:5px">Xác thực ngay</a>
            </div>
            """, ct);

    public Task SendPasswordResetAsync(string email, string resetLink, CancellationToken ct = default)
        => SendAsync(email, "Khôi phục mật khẩu TouchLove", $"""
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
                <h2>Khôi phục mật khẩu</h2>
                <p>Bạn đã yêu cầu khôi phục mật khẩu. Click vào link dưới đây để đặt lại mật khẩu:</p>
                <a href="{resetLink}" style="display:inline-block;padding:10px 20px;background:#ff4b82;color:white;text-decoration:none;border-radius:5px">Đổi mật khẩu</a>
                <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
            </div>
            """, ct);

    public Task SendPairingSuccessAsync(string email, string partnerDisplayName, Guid coupleId, CancellationToken ct = default)
        => SendAsync(email, "Ghép đôi thành công!", $"""
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
                <h2>Chúc mừng!</h2>
                <p>Bạn và <strong>{partnerDisplayName}</strong> đã ghép đôi thành công trên TouchLove.</p>
                <p>Hãy cùng nhau lưu giữ những kỷ niệm đẹp nhé!</p>
            </div>
            """, ct);

    public Task SendAnniversaryReminderAsync(string email, string coupleName, int days, CancellationToken ct = default)
        => SendAsync(email, $"Kỷ niệm {days} ngày yêu nhau - {coupleName}", $"""
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;text-align:center;">
                <h2 style="color:#ff4b82">Chúc mừng kỷ niệm! 🎉</h2>
                <p>Hôm nay đánh dấu <strong>{days} ngày</strong> hai bạn bên nhau.</p>
                <p>Cảm ơn bạn đã đồng hành cùng TouchLove. Chúc hai bạn luôn hạnh phúc!</p>
            </div>
            """, ct);

    public Task SendPersonalReminderAsync(string email, string title, DateOnly date, CancellationToken ct = default)
        => SendAsync(email, $"Nhắc nhở sự kiện: {title}", $"""
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
                <h2>Sắp đến sự kiện quan trọng!</h2>
                <p>Đừng quên sự kiện: <strong>{title}</strong> vào ngày {date:dd/MM/yyyy}.</p>
                <p>Hãy chuẩn bị thật tốt nhé!</p>
            </div>
            """, ct);
}
