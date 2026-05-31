using TouchLove.Shared;

namespace TouchLove.Application.Features.Voucher;

public interface IVoucherAdminService
{
    Task<ApiResponse<VoucherDto>> CreateAsync(CreateVoucherRequest req, CancellationToken ct = default);
    Task<ApiResponse<VoucherDto>> UpdateAsync(Guid id, UpdateVoucherRequest req, CancellationToken ct = default);
    Task<ApiResponse<bool>> ToggleActiveAsync(Guid id, CancellationToken ct = default);
    Task<ApiResponse<List<VoucherDto>>> GetAllAsync(CancellationToken ct = default);
    Task<ApiResponse<List<VoucherRedemptionDto>>> GetRedemptionsAsync(Guid voucherId, CancellationToken ct = default);
}
