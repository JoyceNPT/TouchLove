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
        var loginResult = await _authService.LoginByNfcAsync(keyId, ct);

        var frontendUrl = _config["Frontend:Url"] ?? "http://localhost:3000";

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

        // We also need to provide the access token to the frontend. 
        // We'll pass it as a temp query param so the frontend can store it in zustand.
        var accessToken = loginResult.Data.AccessToken;

        var keychain = await _db.Keychains
            .Include(k => k.Couple)
            .FirstOrDefaultAsync(k => k.KeyId == keyId, ct);

        // Log the scan
        _db.NfcScanLogs.Add(new NfcScanLog
        {
            KeychainId = keychain!.Id,
            CoupleId = keychain.CoupleId,
            ScannedAt = DateTime.UtcNow,
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            UserAgent = Request.Headers.UserAgent.ToString()
        });

        await _db.SaveChangesAsync(ct);

        var redirectTarget = keychain.CoupleId == null ? "/profile" : $"/c/{keychain.Couple!.CoupleSlug}";
        
        return Redirect($"{frontendUrl}{redirectTarget}?token={accessToken}");
    }
}
