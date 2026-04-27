using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TouchLove.Domain.Common;
using TouchLove.Domain.Enums;

namespace TouchLove.Domain.Entities;

public class Order : BaseEntity
{
    
    [Required, MaxLength(50)]
    public string OrderNumber { get; set; } = string.Empty;
    
    public Guid CustomerId { get; set; }
    public User? Customer { get; set; }
    
    [Required, MaxLength(200)]
    public string ShippingFullName { get; set; } = string.Empty;
    
    [Required, MaxLength(50)]
    public string ShippingPhone { get; set; } = string.Empty;
    
    [Required, MaxLength(500)]
    public string ShippingAddress { get; set; } = string.Empty;
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; }
    
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Unpaid;
    
    [MaxLength(100)]
    public string? PaymentMethod { get; set; }
    
    [MaxLength(200)]
    public string? TransactionId { get; set; }
    
    public string? Notes { get; set; }
    
    // Navigation
    public ICollection<OrderItem> Items { get; set; } = [];
}
