using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using TouchLove.API.Hubs;
using TouchLove.Application.Features.Couple;
using TouchLove.Application.Features.Album;
using TouchLove.Application.Features.Message;
using TouchLove.Shared;

namespace TouchLove.API.Controllers.Couples;

[ApiController]
[Route("api/couples")]
public class CouplesController : ControllerBase
{
    private readonly CoupleService _coupleService;
    private readonly AlbumService _albumService;
    private readonly MessageService _messageService;
    private readonly MilestoneService _milestoneService;
    private readonly IHubContext<CoupleHub> _hubContext;

    public CouplesController(
        CoupleService coupleService, 
        AlbumService albumService, 
        MessageService messageService,
        MilestoneService milestoneService,
        IHubContext<CoupleHub> hubContext)
    {
        _coupleService = coupleService;
        _albumService = albumService;
        _messageService = messageService;
        _milestoneService = milestoneService;
        _hubContext = hubContext;
    }

    private Guid UserId => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
        ?? Guid.Empty.ToString());

    // ─── PUBLIC ───────────────────────────────────────────────────────
    [HttpGet("{slug}")]
    public async Task<IActionResult> GetCouplePage(string slug, CancellationToken ct)
        => Ok(await _coupleService.GetCouplePageAsync(slug, ct));

    [HttpGet("{slug}/message/today")]
    public async Task<IActionResult> GetTodayMessage(string slug, CancellationToken ct)
        => Ok(await _messageService.GetTodayMessageAsync(slug, ct));

    [HttpGet("{slug}/memories")]
    public async Task<IActionResult> GetMemories(string slug, [FromQuery] int page = 1, [FromQuery] int size = 20, CancellationToken ct = default)
        => Ok(await _albumService.GetMemoriesAsync(slug, page, size, ct));

    // ─── AUTHENTICATED ────────────────────────────────────────────────
    [Authorize]
    [HttpPut("{coupleId:guid}")]
    public async Task<IActionResult> UpdateCouple(Guid coupleId, [FromBody] UpdateCoupleRequest req, CancellationToken ct)
        => Ok(await _coupleService.UpdateCoupleAsync(coupleId, UserId, req, ct));

    [Authorize]
    [HttpPut("{coupleId:guid}/avatar")]
    public async Task<IActionResult> UpdateAvatar(Guid coupleId, IFormFile file, CancellationToken ct)
        => Ok(await _coupleService.UpdateAvatarAsync(coupleId, UserId, file, ct));

    [Authorize]
    [HttpPost("{coupleId:guid}/memories")]
    public async Task<IActionResult> UploadMemory(Guid coupleId, IFormFile file, [FromForm] string? caption, CancellationToken ct)
        => Ok(await _albumService.UploadMemoryAsync(coupleId, UserId, file, caption, ct));

    [Authorize]
    [HttpPost("{coupleId:guid}/unpair/request")]
    public async Task<IActionResult> RequestUnpair(Guid coupleId, CancellationToken ct)
        => Ok(await _coupleService.RequestUnpairAsync(coupleId, UserId, ct));

    [Authorize]
    [HttpPost("{coupleId:guid}/unpair/confirm")]
    public async Task<IActionResult> ConfirmUnpair(Guid coupleId, CancellationToken ct)
        => Ok(await _coupleService.ConfirmUnpairAsync(coupleId, UserId, ct));

    [Authorize]
    [HttpPost("{coupleId:guid}/nudge")]
    public async Task<IActionResult> SendNudge(Guid coupleId)
    {
        var userName = User.FindFirst("DisplayName")?.Value ?? User.FindFirst(ClaimTypes.Name)?.Value ?? "Ai đó";
        await _hubContext.Clients.Group(coupleId.ToString()).SendAsync("ReceiveNudge", userName);
        return Ok(ApiResponse<string>.Ok("Đã gửi yêu thương!"));
    }

    [Authorize]
    [HttpGet("{coupleId:guid}/messages")]
    public async Task<IActionResult> GetMessages(Guid coupleId, [FromQuery] int days = 30, CancellationToken ct = default)
        => Ok(await _messageService.GetHistoryAsync(coupleId, UserId, days, ct));

    [HttpGet("{slug}/milestones")]
    public async Task<IActionResult> GetMilestones(string slug, CancellationToken ct)
    {
        var coupleRes = await _coupleService.GetCouplePageAsync(slug, ct);
        if (!coupleRes.Success || coupleRes.Data == null) return NotFound();
        
        var startDate = coupleRes.Data.StartDate.ToDateTime(TimeOnly.MinValue);
        var milestones = _milestoneService.GetUpcomingMilestones(startDate);
        return Ok(ApiResponse<List<MilestoneInfo>>.Ok(milestones));
    }
}
