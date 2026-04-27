using System.ComponentModel.DataAnnotations;
using TouchLove.Domain.Common;

namespace TouchLove.Domain.Entities;

public class Supplier : BaseEntity
{
    
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(50)]
    public string? Phone { get; set; }
    
    [MaxLength(200)]
    public string? Email { get; set; }
    
    [MaxLength(500)]
    public string? Address { get; set; }
    
    // Navigation
    public ICollection<Product> Products { get; set; } = [];
}
