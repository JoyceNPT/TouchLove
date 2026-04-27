using Microsoft.EntityFrameworkCore;
using TouchLove.Application.Interfaces;
using TouchLove.Domain.Entities;
using TouchLove.Domain.Enums;
using TouchLove.Shared;

namespace TouchLove.Application.Features.Admin;

public class AdminStoreService
{
    private readonly IApplicationDbContext _db;

    public AdminStoreService(IApplicationDbContext db)
    {
        _db = db;
    }

    // SUPPLIERS
    public async Task<ApiResponse<List<SupplierDto>>> GetSuppliersAsync(CancellationToken ct = default)
    {
        var data = await _db.Suppliers
            .Select(s => new SupplierDto(s.Id, s.Name, s.Phone, s.Email, s.Address))
            .ToListAsync(ct);
        return ApiResponse<List<SupplierDto>>.Ok(data);
    }

    public async Task<ApiResponse<Guid>> CreateSupplierAsync(SupplierDto req, CancellationToken ct = default)
    {
        var s = new Supplier { Name = req.Name, Phone = req.Phone, Email = req.Email, Address = req.Address };
        _db.Suppliers.Add(s);
        await _db.SaveChangesAsync(ct);
        return ApiResponse<Guid>.Ok(s.Id);
    }

    // PRODUCTS
    public async Task<ApiResponse<List<AdminProductDto>>> GetProductsAsync(CancellationToken ct = default)
    {
        var data = await _db.Products
            .Include(p => p.Supplier)
            .IgnoreQueryFilters() // Show deleted for admin if needed, or just normal
            .Where(p => !p.IsDeleted)
            .Select(p => new AdminProductDto(p.Id, p.Name, p.Slug, p.Price, p.StockQuantity, p.Supplier != null ? p.Supplier.Name : "N/A", p.IsActive))
            .ToListAsync(ct);
        return ApiResponse<List<AdminProductDto>>.Ok(data);
    }

    public async Task<ApiResponse<Guid>> CreateProductAsync(CreateProductRequest req, CancellationToken ct = default)
    {
        var slug = req.Name.ToLower().Replace(" ", "-"); // Basic slug gen
        var p = new Product
        {
            Name = req.Name,
            Slug = slug,
            Description = req.Description,
            Price = req.Price,
            StockQuantity = req.StockQuantity,
            SupplierId = req.SupplierId,
            ImageUrls = req.ImageUrls,
            IsActive = true
        };
        _db.Products.Add(p);
        await _db.SaveChangesAsync(ct);
        return ApiResponse<Guid>.Ok(p.Id);
    }

    public async Task<ApiResponse<string>> UpdateProductAsync(Guid id, CreateProductRequest req, CancellationToken ct = default)
    {
        var p = await _db.Products.FindAsync(new object[] { id }, ct);
        if (p == null) return ApiResponse<string>.Fail("Sản phẩm không tồn tại.");

        p.Name = req.Name;
        p.Description = req.Description;
        p.Price = req.Price;
        p.StockQuantity = req.StockQuantity;
        p.SupplierId = req.SupplierId;
        p.ImageUrls = req.ImageUrls;

        await _db.SaveChangesAsync(ct);
        return ApiResponse<string>.Ok("Cập nhật sản phẩm thành công.");
    }

    public async Task<ApiResponse<string>> DeleteProductAsync(Guid id, CancellationToken ct = default)
    {
        var p = await _db.Products
            .Include(p => p.OrderItems)
            .FirstOrDefaultAsync(x => x.Id == id, ct);

        if (p == null) return ApiResponse<string>.Fail("Sản phẩm không tồn tại.");

        // Business Logic: If product has active orders, cannot hard delete.
        // We use soft delete as requested.
        bool hasActiveOrders = await _db.OrderItems
            .AnyAsync(oi => oi.ProductId == id && oi.Order!.Status != OrderStatus.Completed && oi.Order.Status != OrderStatus.Cancelled, ct);

        if (hasActiveOrders)
        {
            return ApiResponse<string>.Fail("Không thể xóa sản phẩm đang có đơn hàng đang xử lý.");
        }

        p.IsDeleted = true;
        await _db.SaveChangesAsync(ct);
        return ApiResponse<string>.Ok("Đã xóa sản phẩm thành công (Soft Delete).");
    }

    // ORDERS
    public async Task<ApiResponse<List<AdminOrderDto>>> GetOrdersAsync(OrderStatus? status = null, CancellationToken ct = default)
    {
        var query = _db.Orders.AsQueryable();
        
        if (status.HasValue)
        {
            query = query.Where(o => o.Status == status.Value);
        }

        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new AdminOrderDto(o.Id, o.OrderNumber, o.Customer != null ? o.Customer.DisplayName : "Ẩn danh", o.TotalAmount, o.Status, o.PaymentStatus, o.CreatedAt))
            .ToListAsync(ct);

        return ApiResponse<List<AdminOrderDto>>.Ok(orders);
    }

    public async Task<ApiResponse<string>> UpdateOrderStatusAsync(Guid orderId, OrderStatus status, CancellationToken ct = default)
    {
        var order = await _db.Orders.FindAsync(new object[] { orderId }, ct);
        if (order == null) return ApiResponse<string>.Fail("Đơn hàng không tồn tại.");

        order.Status = status;
        await _db.SaveChangesAsync(ct);
        return ApiResponse<string>.Ok("Cập nhật trạng thái đơn hàng thành công.");
    }
}

public record CreateProductRequest(string Name, string? Description, decimal Price, int StockQuantity, Guid? SupplierId, string? ImageUrls);
public record SupplierDto(Guid Id, string Name, string? Phone, string? Email, string? Address);
public record AdminProductDto(Guid Id, string Name, string Slug, decimal Price, int StockQuantity, string SupplierName, bool IsActive);
public record AdminOrderDto(Guid Id, string OrderNumber, string CustomerName, decimal TotalAmount, OrderStatus Status, PaymentStatus PaymentStatus, DateTime CreatedAt);
