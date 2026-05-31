using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TouchLove.Application.Features.Voucher;
using TouchLove.Shared;

namespace TouchLove.API.Controllers.Voucher;

[Route("api/admin/vouchers")]
[ApiController]
[Authorize(Roles = "Admin")]
public class VoucherAdminController : ControllerBase
{
    private readonly IVoucherAdminService _adminService;

    public VoucherAdminController(IVoucherAdminService adminService)
    {
        _adminService = adminService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<VoucherDto>>>> GetAll(CancellationToken ct)
    {
        var res = await _adminService.GetAllAsync(ct);
        return Ok(res);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<VoucherDto>>> Create([FromBody] CreateVoucherRequest req, CancellationToken ct)
    {
        var res = await _adminService.CreateAsync(req, ct);
        return res.Success ? Ok(res) : BadRequest(res);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<VoucherDto>>> Update(Guid id, [FromBody] UpdateVoucherRequest req, CancellationToken ct)
    {
        var res = await _adminService.UpdateAsync(id, req, ct);
        return res.Success ? Ok(res) : BadRequest(res);
    }

    [HttpPatch("{id}/toggle-active")]
    public async Task<ActionResult<ApiResponse<bool>>> ToggleActive(Guid id, CancellationToken ct)
    {
        var res = await _adminService.ToggleActiveAsync(id, ct);
        return res.Success ? Ok(res) : BadRequest(res);
    }

    [HttpGet("{id}/redemptions")]
    public async Task<ActionResult<ApiResponse<List<VoucherRedemptionDto>>>> GetRedemptions(Guid id, CancellationToken ct)
    {
        var res = await _adminService.GetRedemptionsAsync(id, ct);
        return Ok(res);
    }
}
