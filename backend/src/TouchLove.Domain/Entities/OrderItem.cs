using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TouchLove.Domain.Common;

namespace TouchLove.Domain.Entities;

public class OrderItem : BaseEntity
{
    
    public Guid OrderId { get; set; }
    public Order? Order { get; set; }
    
    public Guid ProductId { get; set; }
    public Product? Product { get; set; }
    
    [MaxLength(200)]
    public string ProductName { get; set; } = string.Empty; // Snapshot name at purchase time
    
    public int Quantity { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal UnitPrice { get; set; } // SalePriceSnapshot
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal CostPrice { get; set; } // CostPriceSnapshot
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalPrice => UnitPrice * Quantity;
}
