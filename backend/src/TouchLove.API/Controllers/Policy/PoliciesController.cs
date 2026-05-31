using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TouchLove.Application.Features.Policy;
using TouchLove.Shared;

namespace TouchLove.API.Controllers.Policy;

[ApiController]
[Route("api/policies")]
public class PoliciesController : ControllerBase
{
    private readonly IPolicyService _policyService;

    public PoliciesController(IPolicyService policyService)
    {
        _policyService = policyService;
    }

    [HttpGet("{code}/{language}")]
    public async Task<ActionResult<ApiResponse<AppPolicyDto>>> GetPolicy(string code, string language, CancellationToken ct)
    {
        var res = await _policyService.GetPolicyAsync(code, language, ct);
        return Ok(res);
    }
}

[Authorize(Roles = Constants.Roles.Admin)]
[ApiController]
[Route("api/admin/policies")]
public class AdminPoliciesController : ControllerBase
{
    private readonly IPolicyService _policyService;

    public AdminPoliciesController(IPolicyService policyService)
    {
        _policyService = policyService;
    }

    [HttpPut("{code}/{language}")]
    public async Task<ActionResult<ApiResponse<AppPolicyDto>>> UpdatePolicy(string code, string language, [FromBody] UpdatePolicyRequest req, CancellationToken ct)
    {
        var res = await _policyService.UpdatePolicyAsync(code, language, req.Content, ct);
        return Ok(res);
    }
}
