using TouchLove.Domain.Enums;

namespace TouchLove.Application.Features.Voucher;

public record VoucherDto(
    Guid Id,
    string Code,
    string Description,
    DiscountType DiscountType,
    decimal DiscountValue,
    decimal? MaxDiscountCap,
    decimal MinOrderValue,
    int? UsageLimitTotal,
    int UsageLimitPerUser,
    DateTime StartAt,
    DateTime? EndAt,
    bool IsActive
);

public record CreateVoucherRequest(
    string Code,
    string Description,
    DiscountType DiscountType,
    decimal DiscountValue,
    decimal? MaxDiscountCap,
    decimal MinOrderValue,
    int? UsageLimitTotal,
    int UsageLimitPerUser,
    DateTime StartAt,
    DateTime? EndAt,
    bool IsActive
);

public record UpdateVoucherRequest(
    string Description,
    DiscountType DiscountType,
    decimal DiscountValue,
    decimal? MaxDiscountCap,
    decimal MinOrderValue,
    int? UsageLimitTotal,
    int UsageLimitPerUser,
    DateTime StartAt,
    DateTime? EndAt,
    bool IsActive
);

public record VoucherValidationResult(
    bool IsValid,
    string Message,
    decimal DiscountAmount,
    Guid? VoucherId
);

public record VoucherRedemptionDto(
    Guid Id,
    Guid VoucherId,
    Guid UserId,
    Guid OrderId,
    decimal DiscountApplied,
    DateTime RedeemedAt
);
