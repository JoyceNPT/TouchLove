using MailKit.Net.Smtp;
using MimeKit;
using Microsoft.Extensions.Configuration;
using TouchLove.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace TouchLove.Infrastructure.Services;

public class MailKitEmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<MailKitEmailService> _logger;

    public MailKitEmailService(IConfiguration config, ILogger<MailKitEmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    private async Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct)
    {
        try
        {
            var message = new MimeMessage();
            message.From.Add(MailboxAddress.Parse(_config["Email:From"] ?? "noreply@touchlove.local"));
            message.To.Add(MailboxAddress.Parse(to));
            message.Subject = subject;
            message.Body = new TextPart("html") { Text = htmlBody };

            using var client = new SmtpClient();
            await client.ConnectAsync(
                _config["Email:Host"] ?? "localhost",
                int.Parse(_config["Email:Port"] ?? "1025"),
                MailKit.Security.SecureSocketOptions.None,
                ct);
            await client.SendAsync(message, ct);
            await client.DisconnectAsync(true, ct);

            _logger.LogInformation("Email sent to {To}: {Subject}", to, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {To}: {Subject}", to, subject);
        }
    }

    public Task SendEmailVerificationAsync(string email, string verifyLink, CancellationToken ct = default)
        => SendAsync(email, "Xác thực tài khoản TouchLove", $"""
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#e91e8c">💕 TouchLove</h2>
            <p>Chào mừng bạn đến với TouchLove! Hãy xác thực email của bạn.</p>
            <a href="{verifyLink}" style="background:#e91e8c;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">
            Xác thực Email
            </a>
            <p style="color:#666;font-size:12px;margin-top:16px">Link có hiệu lực trong 24 giờ.</p>
            </div>
            """, ct);

    public Task SendPasswordResetAsync(string email, string resetLink, CancellationToken ct = default)
        => SendAsync(email, "Đặt lại mật khẩu TouchLove", $"""
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#e91e8c">💕 TouchLove</h2>
            <p>Bạn đã yêu cầu đặt lại mật khẩu.</p>
            <a href="{resetLink}" style="background:#e91e8c;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">
            Đặt lại mật khẩu
            </a>
            <p style="color:#666;font-size:12px;margin-top:16px">Link có hiệu lực trong 15 phút. Nếu không phải bạn, hãy bỏ qua email này.</p>
            </div>
            """, ct);

    public Task SendPairingSuccessAsync(string email, string partnerDisplayName, string coupleSlug, CancellationToken ct = default)
        => SendAsync(email, "Đã kết đôi thành công! 💕", $"""
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#e91e8c">💕 TouchLove</h2>
            <p>Chúc mừng! Bạn đã kết đôi thành công với <strong>{partnerDisplayName}</strong>!</p>
            <a href="/c/{coupleSlug}" style="background:#e91e8c;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">
            Xem trang của cặp đôi
            </a>
            </div>
            """, ct);

    public Task SendAnniversaryReminderAsync(string email, string coupleName, int days, CancellationToken ct = default)
        => SendAsync(email, $"Kỷ niệm {days} ngày yêu nhau sắp đến! 🎉", $"""
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#e91e8c">💕 TouchLove</h2>
            <p>Ngày mai là kỷ niệm <strong>{days} ngày</strong> yêu nhau của <strong>{coupleName}</strong>!</p>
            <p>Đừng quên chuẩn bị một điều gì đó đặc biệt nhé 💝</p>
            </div>
            """, ct);
}
