using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading;
using System.Threading.Tasks;
using TouchLove.Application.Features.Revenue;
using TouchLove.Shared;

namespace TouchLove.API.Controllers.Admin;

[Authorize(Roles = Constants.Roles.Admin)]
[ApiController]
[Route("api/admin/revenue")]
public class RevenueAdminController : ControllerBase
{
    private readonly IRevenueService _revenueService;
    private readonly ExcelExportService _excelService;

    public RevenueAdminController(IRevenueService revenueService, ExcelExportService excelService)
    {
        _revenueService = revenueService;
        _excelService = excelService;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, CancellationToken ct)
    {
        var req = new RevenueFilterRequest(startDate, endDate);
        var res = await _revenueService.GetFullRevenueReportAsync(req, ct);
        if (!res.Success) return BadRequest(res);
        return Ok(ApiResponse<RevenueReportSummary>.Ok(res.Data!.Summary));
    }

    [HttpGet("report")]
    public async Task<IActionResult> GetFullReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, CancellationToken ct)
    {
        var req = new RevenueFilterRequest(startDate, endDate);
        var res = await _revenueService.GetFullRevenueReportAsync(req, ct);
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }

    [HttpGet("export")]
    public async Task<IActionResult> ExportExcel([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, CancellationToken ct)
    {
        var req = new RevenueFilterRequest(startDate, endDate);
        var res = await _revenueService.GetFullRevenueReportAsync(req, ct);
        if (!res.Success) return BadRequest(res);

        var excelBytes = _excelService.GenerateRevenueExcel(res.Data!);
        string fileName = $"RevenueReport_{DateTime.UtcNow:yyyyMMddHHmmss}.xlsx";
        
        return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }
}
