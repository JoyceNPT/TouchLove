using System.ComponentModel.DataAnnotations.Schema;
using TouchLove.Domain.Common;

namespace TouchLove.Domain.Entities;

public class VoucherRedemption : BaseEntity
{
    public Guid VoucherId { get; set; }
    public Voucher? Voucher { get; set; }

    public Guid UserId { get; set; }
    public User? User { get; set; }

    public Guid OrderId { get; set; }
    public Order? Order { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal DiscountApplied { get; set; }

    public DateTime RedeemedAt { get; set; } = DateTime.UtcNow;
}
