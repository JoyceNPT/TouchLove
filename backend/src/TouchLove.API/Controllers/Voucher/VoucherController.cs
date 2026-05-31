using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TouchLove.Application.Features.Voucher;
using TouchLove.Shared;

namespace TouchLove.API.Controllers.Voucher;

[Route("api/vouchers")]
[ApiController]
[Authorize]
public class VoucherController : ControllerBase
{
    private readonly IVoucherService _voucherService;

    public VoucherController(IVoucherService voucherService)
    {
        _voucherService = voucherService;
    }

    [HttpGet("validate")]
    public async Task<ActionResult<ApiResponse<VoucherValidationResult>>> Validate(
        [FromQuery] string code, 
        [FromQuery] decimal orderValue, 
        CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _voucherService.ValidateAsync(code, orderValue, userId, ct);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("{code}")]
    public async Task<ActionResult<ApiResponse<VoucherDto>>> GetByCode(string code, CancellationToken ct)
    {
        var res = await _voucherService.GetByCodeAsync(code, ct);
        return res.Success ? Ok(res) : NotFound(res);
    }
}
