using Microsoft.EntityFrameworkCore;
using TouchLove.Application.Interfaces;
using TouchLove.Domain.Entities;
using TouchLove.Shared;

namespace TouchLove.Application.Features.Policy;

public class PolicyService : IPolicyService
{
    private readonly IApplicationDbContext _db;

    public PolicyService(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<AppPolicyDto>> GetPolicyAsync(string code, string language, CancellationToken ct = default)
    {
        var upperCode = code.ToUpper();
        var policy = await _db.AppPolicies
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Code == upperCode && p.Language == language, ct);

        if (policy == null)
            return ApiResponse<AppPolicyDto>.Ok(new AppPolicyDto(upperCode, language, ""));

        return ApiResponse<AppPolicyDto>.Ok(new AppPolicyDto(policy.Code, policy.Language, policy.Content));
    }

    public async Task<ApiResponse<AppPolicyDto>> UpdatePolicyAsync(string code, string language, string content, CancellationToken ct = default)
    {
        var upperCode = code.ToUpper();
        var policy = await _db.AppPolicies
            .FirstOrDefaultAsync(p => p.Code == upperCode && p.Language == language, ct);

        if (policy == null)
        {
            policy = new AppPolicy
            {
                Code = upperCode,
                Language = language,
                Content = content
            };
            _db.AppPolicies.Add(policy);
        }
        else
        {
            policy.Content = content;
        }

        await _db.SaveChangesAsync(ct);
        return ApiResponse<AppPolicyDto>.Ok(new AppPolicyDto(policy.Code, policy.Language, policy.Content));
    }
}
