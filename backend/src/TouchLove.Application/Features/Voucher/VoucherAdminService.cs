using Microsoft.EntityFrameworkCore;
using TouchLove.Application.Interfaces;
using TouchLove.Domain.Entities;
using TouchLove.Shared;

namespace TouchLove.Application.Features.Voucher;

public class VoucherAdminService : IVoucherAdminService
{
    private readonly IApplicationDbContext _db;

    public VoucherAdminService(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<VoucherDto>> CreateAsync(CreateVoucherRequest req, CancellationToken ct = default)
    {
        var upperCode = req.Code.ToUpper();
        if (await _db.Vouchers.AnyAsync(v => v.Code == upperCode, ct))
            return ApiResponse<VoucherDto>.Fail("Mã voucher đã tồn tại.");

        var voucher = new Domain.Entities.Voucher
        {
            Code = upperCode,
            Description = req.Description,
            DiscountType = req.DiscountType,
            DiscountValue = req.DiscountValue,
            MaxDiscountCap = req.MaxDiscountCap,
            MinOrderValue = req.MinOrderValue,
            UsageLimitTotal = req.UsageLimitTotal,
            UsageLimitPerUser = req.UsageLimitPerUser,
            StartAt = req.StartAt,
            EndAt = req.EndAt,
            IsActive = req.IsActive
        };

        _db.Vouchers.Add(voucher);
        await _db.SaveChangesAsync(ct);

        var dto = MapToDto(voucher);
        return ApiResponse<VoucherDto>.Ok(dto);
    }

    public async Task<ApiResponse<VoucherDto>> UpdateAsync(Guid id, UpdateVoucherRequest req, CancellationToken ct = default)
    {
        var voucher = await _db.Vouchers.FindAsync(new object[] { id }, ct);
        if (voucher == null)
            return ApiResponse<VoucherDto>.Fail("Voucher không tồn tại.");

        voucher.Description = req.Description;
        voucher.DiscountType = req.DiscountType;
        voucher.DiscountValue = req.DiscountValue;
        voucher.MaxDiscountCap = req.MaxDiscountCap;
        voucher.MinOrderValue = req.MinOrderValue;
        voucher.UsageLimitTotal = req.UsageLimitTotal;
        voucher.UsageLimitPerUser = req.UsageLimitPerUser;
        voucher.StartAt = req.StartAt;
        voucher.EndAt = req.EndAt;
        voucher.IsActive = req.IsActive;

        await _db.SaveChangesAsync(ct);

        return ApiResponse<VoucherDto>.Ok(MapToDto(voucher));
    }

    public async Task<ApiResponse<bool>> ToggleActiveAsync(Guid id, CancellationToken ct = default)
    {
        var voucher = await _db.Vouchers.FindAsync(new object[] { id }, ct);
        if (voucher == null)
            return ApiResponse<bool>.Fail("Voucher không tồn tại.");

        voucher.IsActive = !voucher.IsActive;
        await _db.SaveChangesAsync(ct);

        return ApiResponse<bool>.Ok(true);
    }

    public async Task<ApiResponse<List<VoucherDto>>> GetAllAsync(CancellationToken ct = default)
    {
        var vouchers = await _db.Vouchers
            .AsNoTracking()
            .OrderByDescending(v => v.CreatedAt)
            .ToListAsync(ct);

        var dtos = vouchers.Select(MapToDto).ToList();
        return ApiResponse<List<VoucherDto>>.Ok(dtos);
    }

    public async Task<ApiResponse<List<VoucherRedemptionDto>>> GetRedemptionsAsync(Guid voucherId, CancellationToken ct = default)
    {
        var redemptions = await _db.VoucherRedemptions
            .AsNoTracking()
            .Where(r => r.VoucherId == voucherId)
            .OrderByDescending(r => r.RedeemedAt)
            .ToListAsync(ct);

        var dtos = redemptions.Select(r => new VoucherRedemptionDto(
            r.Id, r.VoucherId, r.UserId, r.OrderId, r.DiscountApplied, r.RedeemedAt)).ToList();

        return ApiResponse<List<VoucherRedemptionDto>>.Ok(dtos);
    }

    private VoucherDto MapToDto(Domain.Entities.Voucher v)
    {
        return new VoucherDto(
            v.Id, v.Code, v.Description, v.DiscountType, v.DiscountValue,
            v.MaxDiscountCap, v.MinOrderValue, v.UsageLimitTotal, v.UsageLimitPerUser,
            v.StartAt, v.EndAt, v.IsActive);
    }
}
