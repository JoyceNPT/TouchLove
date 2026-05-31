using TouchLove.Shared;

namespace TouchLove.Application.Features.Voucher;

public interface IVoucherService
{
    Task<ApiResponse<VoucherValidationResult>> ValidateAsync(string code, decimal orderValue, Guid userId, CancellationToken ct = default);
    Task<ApiResponse<VoucherValidationResult>> RedeemAsync(string code, decimal orderValue, Guid userId, Guid orderId, CancellationToken ct = default);
    Task<ApiResponse<VoucherDto>> GetByCodeAsync(string code, CancellationToken ct = default);
}
