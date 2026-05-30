using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TouchLove.Application.Features.Auth;
using TouchLove.Application.Interfaces;
using TouchLove.Domain.Entities;

namespace TouchLove.API.Controllers.NFC;

[ApiController]
[Route("nfc")]
public class NfcController : ControllerBase
{
    private readonly IApplicationDbContext _db;
    private readonly IConfiguration _config;
    private readonly AuthService _authService;

    public NfcController(IApplicationDbContext db, IConfiguration config, AuthService authService)
    {
        _db = db;
        _config = config;
        _authService = authService;
    }

    [HttpGet("{keyId}")]
    public async Task<IActionResult> RedirectNfc(string keyId, CancellationToken ct)
    {
        var keychain = await _db.Keychains
            .Include(k => k.Couple)
            .Include(k => k.User)
            .FirstOrDefaultAsync(k => k.KeyId == keyId, ct);

        var frontendUrl = _config["Frontend:Url"] ?? "http://localhost:3000";

        if (keychain == null)
        {
            return Redirect($"{frontendUrl}/?error=invalid_nfc");
        }

        // If the keychain is brand new and not activated yet, redirect to setup PIN
        if (keychain.UserId == null)
        {
            return Redirect($"{frontendUrl}/nfc-setup-pin/{keyId}");
        }

        // If the user has configured an NfcPassword, they must unlock it first
        if (keychain.User != null && !string.IsNullOrEmpty(keychain.User.NfcPassword))
        {
            return Redirect($"{frontendUrl}/nfc-unlock/{keyId}");
        }

        var loginResult = await _authService.LoginByNfcAsync(keyId, ct);

        if (!loginResult.Success || loginResult.Data == null)
        {
            return Redirect($"{frontendUrl}/?error=invalid_nfc");
        }

        // Set Auth Cookies for the user
        Response.Cookies.Append("refreshToken", loginResult.Data.RefreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = false, // true in production
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.UtcNow.AddDays(30)
        });

        var accessToken = loginResult.Data.AccessToken;

        // Log the scan
        _db.NfcScanLogs.Add(new NfcScanLog
        {
            KeychainId = keychain.Id,
            CoupleId = keychain.CoupleId,
            ScannedAt = DateTime.UtcNow,
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            UserAgent = Request.Headers.UserAgent.ToString()
        });

        await _db.SaveChangesAsync(ct);

        // Always land on personal NFC profile first; user navigates to couple space from there.
        return Redirect($"{frontendUrl}/nfc-profile?token={accessToken}");
    }
}
