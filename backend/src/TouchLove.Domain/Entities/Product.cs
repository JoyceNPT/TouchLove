using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TouchLove.Domain.Common;

namespace TouchLove.Domain.Entities;

public class Product : BaseEntity
{
    
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    
    [Required, MaxLength(200)]
    public string Slug { get; set; } = string.Empty;
    
    public string? Description { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal Price { get; set; }
    
    public int StockQuantity { get; set; }
    
    public string? ImageUrls { get; set; } // JSON array of strings
    
    public Guid? SupplierId { get; set; }
    public Supplier? Supplier { get; set; }
    
    public bool IsActive { get; set; } = true;
    
    // Navigation
    public ICollection<OrderItem> OrderItems { get; set; } = [];
}
