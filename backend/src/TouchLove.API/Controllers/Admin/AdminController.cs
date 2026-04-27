using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TouchLove.Application.Features.Admin;
using TouchLove.Shared;

namespace TouchLove.API.Controllers.Admin;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly AdminService _adminService;

    public AdminController(AdminService adminService)
    {
        _adminService = adminService;
    }

    private Guid UserId => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
        ?? Guid.Empty.ToString());

    // ─── Stats ─────────────────────────────────────────────────────────
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats(CancellationToken ct) => Ok(await _adminService.GetStatsAsync(ct));

    // ─── Users ─────────────────────────────────────────────────────────
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers([FromQuery] string? search, [FromQuery] string? status,
        [FromQuery] int page = 1, [FromQuery] int size = 20, CancellationToken ct = default)
        => Ok(await _adminService.GetUsersAsync(search, status, page, size, ct));

    [HttpPost("users/{userId:guid}/block")]
    public async Task<IActionResult> BlockUser(Guid userId, CancellationToken ct) => Ok(await _adminService.BlockUserAsync(userId, ct));

    [HttpPost("users/{userId:guid}/unblock")]
    public async Task<IActionResult> UnblockUser(Guid userId, CancellationToken ct) => Ok(await _adminService.UnblockUserAsync(userId, ct));

    // ─── Keychains ─────────────────────────────────────────────────────
    [HttpGet("keychains")]
    public async Task<IActionResult> GetKeychains([FromQuery] string? search, [FromQuery] string? status,
        [FromQuery] int page = 1, [FromQuery] int size = 20, CancellationToken ct = default)
        => Ok(await _adminService.GetKeychainsAsync(search, status, page, size, ct));

    [HttpPost("keychains/bulk")]
    public async Task<IActionResult> BulkCreate([FromBody] BulkCreateRequest req, CancellationToken ct)
        => Ok(await _adminService.BulkCreateKeychainsAsync(req.Count, ct));

    [HttpPost("keychains/{keyId}/revoke")]
    public async Task<IActionResult> Revoke(string keyId, CancellationToken ct) => Ok(await _adminService.RevokeKeychainAsync(keyId, ct));

    [HttpPost("keychains/{keyId}/reactivate")]
    public async Task<IActionResult> Reactivate(string keyId, CancellationToken ct) => Ok(await _adminService.ReactivateKeychainAsync(keyId, ct));

    // ─── Templates ─────────────────────────────────────────────────────
    [HttpGet("templates")]
    public async Task<IActionResult> GetTemplates([FromQuery] string? status, [FromQuery] string? language,
        [FromQuery] string? category, [FromQuery] int page = 1, [FromQuery] int size = 20, CancellationToken ct = default)
        => Ok(await _adminService.GetTemplatesAsync(status, language, category, page, size, ct));

    [HttpPost("templates")]
    public async Task<IActionResult> CreateTemplate([FromBody] CreateTemplateRequest req, CancellationToken ct)
        => Ok(await _adminService.CreateTemplateAsync(UserId, req.Content, req.Language, req.Category, ct));

    [HttpPost("templates/{templateId:guid}/publish")]
    public async Task<IActionResult> PublishTemplate(Guid templateId, CancellationToken ct)
        => Ok(await _adminService.PublishTemplateAsync(templateId, ct));

    [HttpPost("templates/{templateId:guid}/archive")]
    public async Task<IActionResult> ArchiveTemplate(Guid templateId, CancellationToken ct)
        => Ok(await _adminService.ArchiveTemplateAsync(templateId, ct));
}

public record BulkCreateRequest(int Count);
public record CreateTemplateRequest(string Content, string Language, string? Category);
