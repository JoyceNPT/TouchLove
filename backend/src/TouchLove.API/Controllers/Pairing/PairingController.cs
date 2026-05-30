using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using TouchLove.API.Hubs;
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
    private readonly IHubContext<CoupleHub> _hubContext;

    public PairingController(
        KeychainService keychainService,
        IEmailService emailService,
        IHubContext<CoupleHub> hubContext)
    {
        _keychainService = keychainService;
        _emailService = emailService;
        _hubContext = hubContext;
    }

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost("invite")]
    public async Task<ActionResult<ApiResponse<string>>> CreateInvite(CancellationToken ct)
        => Ok(await _keychainService.CreateInviteAsync(UserId, ct));

    [HttpPost("accept")]
    public async Task<ActionResult<ApiResponse<PairingRequestDto>>> RequestPairing([FromBody] AcceptPairingRequest req, CancellationToken ct)
    {
        var result = await _keychainService.RequestPairingAsync(req.InviteCode, UserId, ct);

        if (result.Success && result.Data?.InitiatorUserId is Guid initiatorUserId && !string.IsNullOrEmpty(result.Data.RequesterDisplayName))
        {
            await _hubContext.Clients.User(initiatorUserId.ToString())
                .SendAsync("ReceivePairingRequest", result.Data.RequesterDisplayName, ct);
        }

        return Ok(result);
    }

    [HttpPost("confirm")]
    public async Task<ActionResult<ApiResponse<CoupleDto>>> ConfirmPairing(CancellationToken ct)
    {
        var acceptorUserId = await _keychainService.GetAcceptorUserIdForPendingInvitationAsync(UserId, ct);
        var result = await _keychainService.ConfirmPairingAsync(UserId, _emailService, ct);

        if (result.Success && result.Data != null)
        {
            if (acceptorUserId.HasValue)
            {
                await _hubContext.Clients.User(acceptorUserId.Value.ToString())
                    .SendAsync("ReceivePairingConfirmed", result.Data.Id.ToString(), ct);
            }

            await _hubContext.Clients.User(UserId.ToString())
                .SendAsync("ReceivePairingConfirmed", result.Data.Id.ToString(), ct);
        }

        return Ok(result);
    }

    [HttpPost("reject")]
    public async Task<ActionResult<ApiResponse<string>>> RejectPairing(CancellationToken ct)
        => Ok(await _keychainService.RejectPairingAsync(UserId, ct));
}

public record AcceptPairingRequest(string InviteCode);
