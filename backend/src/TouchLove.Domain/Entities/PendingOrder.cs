using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TouchLove.Domain.Common;

namespace TouchLove.Domain.Entities;

public class PendingOrder : BaseEntity
{
    [Required, MaxLength(50)]
    public string OrderNumber { get; set; } = string.Empty;

    public Guid CustomerId { get; set; }
    public User? Customer { get; set; }

    [Required]
    public string PayloadJson { get; set; } = string.Empty; // Store checkout data

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; }

    [Required, MaxLength(100)]
    public string TransactionId { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }
}
