using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TouchLove.Application.Features.Album;
using TouchLove.Shared;

namespace TouchLove.API.Controllers.Memories;

[Authorize]
[ApiController]
[Route("api/memories")]
public class MemoriesController : ControllerBase
{
    private readonly AlbumService _albumService;

    public MemoriesController(AlbumService albumService)
    {
        _albumService = albumService;
    }

    [HttpGet("{coupleSlug}")]
    public async Task<IActionResult> GetMemories(string coupleSlug, [FromQuery] int page = 1, [FromQuery] int size = 20, CancellationToken ct = default)
    {
        var result = await _albumService.GetMemoriesAsync(coupleSlug, page, size, ct);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("{coupleId}")]
    public async Task<IActionResult> UploadMemory(Guid coupleId, [FromForm] IFormFile file, [FromForm] string? caption, CancellationToken ct = default)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _albumService.UploadMemoryAsync(coupleId, userId, file, caption, ct);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("{memoryId}")]
    public async Task<IActionResult> DeleteMemory(Guid memoryId, CancellationToken ct = default)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _albumService.DeleteMemoryAsync(memoryId, userId, ct);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPatch("{memoryId}")]
    public async Task<IActionResult> UpdateMemory(Guid memoryId, [FromBody] UpdateMemoryRequest request, CancellationToken ct = default)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _albumService.UpdateMemoryAsync(memoryId, userId, request.Caption, request.SortOrder, ct);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}

public record UpdateMemoryRequest(string? Caption, int? SortOrder);
