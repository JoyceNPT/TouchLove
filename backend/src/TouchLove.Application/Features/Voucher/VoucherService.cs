using Microsoft.EntityFrameworkCore;
using TouchLove.Application.Interfaces;
using TouchLove.Domain.Entities;
using TouchLove.Domain.Enums;
using TouchLove.Shared;

namespace TouchLove.Application.Features.Voucher;

public class VoucherService : IVoucherService
{
    private readonly IApplicationDbContext _db;

    public VoucherService(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<VoucherValidationResult>> ValidateAsync(string code, decimal orderValue, Guid userId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(code))
            return ApiResponse<VoucherValidationResult>.Fail("Mã voucher không được để trống.");

        var upperCode = code.ToUpper();
        var voucher = await _db.Vouchers
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.Code == upperCode, ct);

        var result = await ValidateVoucherInternalAsync(voucher, orderValue, userId, ct);
        return result.IsValid 
            ? ApiResponse<VoucherValidationResult>.Ok(result) 
            : ApiResponse<VoucherValidationResult>.Fail(result.Message);
    }

    public async Task<ApiResponse<VoucherValidationResult>> RedeemAsync(string code, decimal orderValue, Guid userId, Guid orderId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(code))
            return ApiResponse<VoucherValidationResult>.Fail("Mã voucher không được để trống.");

        var upperCode = code.ToUpper();

        await using var transaction = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            // Pessimistic lock for PostgreSQL if needed, or simply re-read with tracking
            var voucher = await _db.Vouchers
                .FirstOrDefaultAsync(v => v.Code == upperCode, ct);

            var validationResult = await ValidateVoucherInternalAsync(voucher, orderValue, userId, ct);
            if (!validationResult.IsValid)
            {
                await transaction.RollbackAsync(ct);
                return ApiResponse<VoucherValidationResult>.Fail(validationResult.Message);
            }

            var redemption = new VoucherRedemption
            {
                VoucherId = voucher!.Id,
                UserId = userId,
                OrderId = orderId,
                DiscountApplied = validationResult.DiscountAmount,
                RedeemedAt = DateTime.UtcNow
            };

            _db.VoucherRedemptions.Add(redemption);
            await _db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);

            return ApiResponse<VoucherValidationResult>.Ok(validationResult);
        }
        catch (Exception)
        {
            await transaction.RollbackAsync(ct);
            return ApiResponse<VoucherValidationResult>.Fail("Có lỗi xảy ra khi áp dụng voucher.");
        }
    }

    public async Task<ApiResponse<VoucherDto>> GetByCodeAsync(string code, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(code))
            return ApiResponse<VoucherDto>.Fail("Mã voucher không được để trống.");

        var upperCode = code.ToUpper();
        var v = await _db.Vouchers
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.Code == upperCode, ct);

        if (v == null)
            return ApiResponse<VoucherDto>.Fail("Voucher không tồn tại.");

        var dto = new VoucherDto(
            v.Id, v.Code, v.Description, v.DiscountType, v.DiscountValue,
            v.MaxDiscountCap, v.MinOrderValue, v.UsageLimitTotal, v.UsageLimitPerUser,
            v.StartAt, v.EndAt, v.IsActive);

        return ApiResponse<VoucherDto>.Ok(dto);
    }

    private async Task<VoucherValidationResult> ValidateVoucherInternalAsync(Domain.Entities.Voucher? voucher, decimal orderValue, Guid userId, CancellationToken ct)
    {
        if (voucher == null)
            return new VoucherValidationResult(false, "Voucher không tồn tại.", 0, null);

        if (!voucher.IsActive)
            return new VoucherValidationResult(false, "Voucher đã bị khóa hoặc không hoạt động.", 0, voucher.Id);

        var now = DateTime.UtcNow;
        if (now < voucher.StartAt)
            return new VoucherValidationResult(false, "Voucher chưa tới thời gian áp dụng.", 0, voucher.Id);

        if (voucher.EndAt.HasValue && now > voucher.EndAt.Value)
            return new VoucherValidationResult(false, "Voucher đã hết hạn sử dụng.", 0, voucher.Id);

        if (orderValue < voucher.MinOrderValue)
            return new VoucherValidationResult(false, $"Đơn hàng tối thiểu để áp dụng là {voucher.MinOrderValue:N0}.", 0, voucher.Id);

        if (voucher.UsageLimitTotal.HasValue)
            {
                var totalUsage = await _db.VoucherRedemptions.CountAsync(r => r.VoucherId == voucher.Id, ct);
                if (totalUsage >= voucher.UsageLimitTotal.Value)
                    return new VoucherValidationResult(false, "Voucher đã hết số lượt sử dụng.", 0, voucher.Id);
            }

            var userUsage = await _db.VoucherRedemptions.CountAsync(r => r.VoucherId == voucher.Id && r.UserId == userId, ct);
            if (userUsage >= voucher.UsageLimitPerUser)
                return new VoucherValidationResult(false, "Bạn đã hết lượt sử dụng voucher này.", 0, voucher.Id);

        decimal discountAmount = 0;
        if (voucher.DiscountType == DiscountType.Fixed)
        {
            discountAmount = voucher.DiscountValue;
        }
        else if (voucher.DiscountType == DiscountType.Percentage)
        {
            discountAmount = orderValue * voucher.DiscountValue / 100m;
        }

        if (voucher.MaxDiscountCap.HasValue && discountAmount > voucher.MaxDiscountCap.Value)
        {
            discountAmount = voucher.MaxDiscountCap.Value;
        }

        if (discountAmount > orderValue)
        {
            discountAmount = orderValue;
        }

        return new VoucherValidationResult(true, "Voucher hợp lệ.", discountAmount, voucher.Id);
    }
}
