using Microsoft.AspNetCore.Mvc;
using TouchLove.Application.Features.Couple;
using TouchLove.Shared;

namespace TouchLove.API.Controllers.NFC;

[ApiController]
public class NfcController : ControllerBase
{
    private readonly CoupleService _coupleService;
    private readonly IConfiguration _config;

    public NfcController(CoupleService coupleService, IConfiguration config)
    {
        _coupleService = coupleService;
        _config = config;
    }

    [HttpGet("/nfc/{keyId}")]
    public async Task<IActionResult> Redirect(string keyId, CancellationToken ct)
    {
        var ua = Request.Headers.UserAgent.ToString();
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var frontendUrl = _config["Frontend:Url"] ?? "http://localhost:3000";

        var result = await _coupleService.HandleNfcScanAsync(keyId, ua, ip, ct);

        return result.Type switch
        {
            NfcRedirectType.Activate => Redirect($"{frontendUrl}/activate/{result.Payload}"),
            NfcRedirectType.Pair => Redirect($"{frontendUrl}/pair/{result.Payload}"),
            NfcRedirectType.CouplePage => Redirect($"{frontendUrl}/c/{result.Payload}"),
            NfcRedirectType.Revoked => Content("""
                <html><body style="font-family:sans-serif;text-align:center;padding:40px">
                <h2>💔 Keychain không hợp lệ</h2>
                <p>Keychain này đã bị thu hồi. Vui lòng liên hệ hỗ trợ.</p>
                </body></html>
                """, "text/html"),
            _ => NotFound(ApiResponse<string>.Fail("Keychain not found."))
        };
    }
}
