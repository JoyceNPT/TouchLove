using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TouchLove.Application.Features.Keychain;
using TouchLove.Shared;

namespace TouchLove.API.Controllers.Keychains;

[ApiController]
[Route("api/keychains")]
[Authorize]
public class KeychainsController : ControllerBase
{
    private readonly KeychainService _keychainService;

    public KeychainsController(KeychainService keychainService)
    {
        _keychainService = keychainService;
    }

    [HttpPost("{keyId}/activate")]
    public async Task<ActionResult<ApiResponse<string>>> Activate(string keyId, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        return Ok(await _keychainService.ActivateAsync(keyId, userId, ct));
    }
}
