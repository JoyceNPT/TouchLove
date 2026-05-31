using TouchLove.Shared;

namespace TouchLove.Application.Features.Policy;

public interface IPolicyService
{
    Task<ApiResponse<AppPolicyDto>> GetPolicyAsync(string code, string language, CancellationToken ct = default);
    Task<ApiResponse<AppPolicyDto>> UpdatePolicyAsync(string code, string language, string content, CancellationToken ct = default);
}

public record AppPolicyDto(string Code, string Language, string Content);
public record UpdatePolicyRequest(string Content);
