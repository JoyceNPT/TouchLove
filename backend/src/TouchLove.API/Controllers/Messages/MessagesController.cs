using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TouchLove.Application.Features.Message;
using TouchLove.Shared;

namespace TouchLove.API.Controllers.Messages;

[ApiController]
[Route("api/messages")]
[Authorize]
public class MessagesController : ControllerBase
{
    private readonly MessageService _messageService;

    public MessagesController(MessageService messageService)
    {
        _messageService = messageService;
    }

    private Guid UserId => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
        ?? Guid.Empty.ToString());

    [HttpPost("{messageId:guid}/bookmark")]
    public async Task<IActionResult> ToggleBookmark(Guid messageId, CancellationToken ct)
        => Ok(await _messageService.ToggleBookmarkAsync(messageId, UserId, ct));
}
