using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TouchLove.Application.Features.Keychain;
using TouchLove.Application.Interfaces;
using TouchLove.Shared;

namespace TouchLove.API.Controllers.Keychains;

[ApiController]
[Route("api")]
public class KeychainsController : ControllerBase
{
    private readonly KeychainService _keychainService;
    private readonly IEmailService _emailService;

    public KeychainsController(KeychainService keychainService, IEmailService emailService)
    {
        _keychainService = keychainService;
        _emailService = emailService;
    }

    private Guid UserId => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
        ?? Guid.Empty.ToString());

    [Authorize]
    [HttpPost("keychains/{keyId}/activate")]
    public async Task<IActionResult> Activate(string keyId, CancellationToken ct)
        => Ok(await _keychainService.ActivateAsync(keyId, UserId, ct));

    [Authorize]
    [HttpPost("pairing/invite")]
    public async Task<IActionResult> CreateInvite(CancellationToken ct)
        => Ok(await _keychainService.CreateInviteAsync(UserId, ct));

    [Authorize]
    [HttpPost("pairing/accept")]
    public async Task<IActionResult> AcceptPairing([FromBody] AcceptPairingRequest req, CancellationToken ct)
        => Ok(await _keychainService.AcceptPairingAsync(req.InviteCode, UserId, _emailService, ct));

    [Authorize]
    [HttpPost("memories/{memoryId:guid}/bookmark")]
    public async Task<IActionResult> ToggleBookmark(Guid memoryId) => NotFound(); // handled in message service
}

public record AcceptPairingRequest(string InviteCode);
