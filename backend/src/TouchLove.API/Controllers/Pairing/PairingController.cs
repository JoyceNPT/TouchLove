using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TouchLove.Application.Features.Keychain;
using TouchLove.Application.Interfaces;
using TouchLove.Shared;

namespace TouchLove.API.Controllers.Pairing;

[ApiController]
[Route("api/pairing")]
[Authorize]
public class PairingController : ControllerBase
{
    private readonly KeychainService _keychainService;
    private readonly IEmailService _emailService;

    public PairingController(KeychainService keychainService, IEmailService emailService)
    {
        _keychainService = keychainService;
        _emailService = emailService;
    }

    [HttpPost("invite")]
    public async Task<ActionResult<ApiResponse<string>>> CreateInvite(CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        return Ok(await _keychainService.CreateInviteAsync(userId, ct));
    }

    [HttpPost("accept")]
    public async Task<ActionResult<ApiResponse<CoupleDto>>> AcceptPairing([FromBody] AcceptPairingRequest req, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        return Ok(await _keychainService.AcceptPairingAsync(req.InviteCode, userId, _emailService, ct));
    }
}

public record AcceptPairingRequest(string InviteCode);
