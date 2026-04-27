using System.ComponentModel.DataAnnotations.Schema;
using TouchLove.Domain.Common;

namespace TouchLove.Domain.Entities;

public class OrderItem : BaseEntity
{
    
    public Guid OrderId { get; set; }
    public Order? Order { get; set; }
    
    public Guid ProductId { get; set; }
    public Product? Product { get; set; }
    
    public int Quantity { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal UnitPrice { get; set; } // Price at the time of purchase
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalPrice => UnitPrice * Quantity;
}
