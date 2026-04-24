using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TouchLove.Application.Interfaces;
using TouchLove.Domain.Entities;

namespace TouchLove.API.Controllers.NFC;

[ApiController]
[Route("nfc")]
public class NfcController : ControllerBase
{
    private readonly IApplicationDbContext _db;
    private readonly IConfiguration _config;

    public NfcController(IApplicationDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    [HttpGet("{keyId}")]
    public async Task<IActionResult> RedirectNfc(string keyId, CancellationToken ct)
    {
        var keychain = await _db.Keychains
            .Include(k => k.Couple)
            .FirstOrDefaultAsync(k => k.KeyId == keyId, ct);

        var frontendUrl = _config["Frontend:Url"] ?? "http://localhost:3000";

        if (keychain == null)
        {
            return Redirect($"{frontendUrl}/?error=key_not_found");
        }

        // Log the scan (Fire and forget or async)
        _db.NfcScanLogs.Add(new NfcScanLog
        {
            KeychainId = keychain.Id,
            ScannedAt = DateTime.UtcNow,
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            UserAgent = Request.Headers.UserAgent.ToString()
        });

        // 1. Not activated yet
        if (keychain.UserId == null)
        {
            return Redirect($"{frontendUrl}/activate/{keyId}");
        }

        // 2. Activated but not paired
        if (keychain.CoupleId == null)
        {
            return Redirect($"{frontendUrl}/pair/{keyId}");
        }

        // 3. Paired - Redirect to couple page
        if (keychain.Couple != null)
        {
            keychain.Couple.NfcScanCount++;
            await _db.SaveChangesAsync(ct);
            return Redirect($"{frontendUrl}/c/{keychain.Couple.CoupleSlug}");
        }

        await _db.SaveChangesAsync(ct);
        return Redirect($"{frontendUrl}/");
    }
}
