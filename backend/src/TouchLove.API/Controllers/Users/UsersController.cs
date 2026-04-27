using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TouchLove.Application.Features.Auth;
using TouchLove.Shared;

namespace TouchLove.API.Controllers.Users;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly AuthService _authService;

    public UsersController(AuthService authService)
    {
        _authService = authService;
    }

    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<UserDto>>> GetMe(CancellationToken ct)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

        var userId = Guid.Parse(userIdStr);
        var result = await _authService.GetUserProfileAsync(userId, ct);

        if (!result.Success) return Unauthorized(result);
        return Ok(result);
    }
}
