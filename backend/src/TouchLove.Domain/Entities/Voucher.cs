using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TouchLove.Domain.Common;
using TouchLove.Domain.Enums;

namespace TouchLove.Domain.Entities;

public class Voucher : BaseEntity
{
    [Required, MaxLength(50)]
    public string Code { get; set; } = string.Empty; // Uppercase, unique

    [Required, MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    public DiscountType DiscountType { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal DiscountValue { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? MaxDiscountCap { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal MinOrderValue { get; set; } = 0;

    public int? UsageLimitTotal { get; set; }
    
    public int UsageLimitPerUser { get; set; } = 1;

    public DateTime StartAt { get; set; }
    
    public DateTime? EndAt { get; set; }

    public bool IsActive { get; set; } = true;

    // Navigation
    public ICollection<VoucherRedemption> Redemptions { get; set; } = [];
}
