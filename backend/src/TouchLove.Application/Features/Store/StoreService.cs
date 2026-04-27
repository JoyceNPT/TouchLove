using Microsoft.EntityFrameworkCore;
using TouchLove.Application.Interfaces;
using TouchLove.Domain.Entities;
using TouchLove.Domain.Enums;
using TouchLove.Shared;

namespace TouchLove.Application.Features.Store;

public class StoreService
{
    private readonly IApplicationDbContext _db;

    public StoreService(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<List<ProductDto>>> GetProductsAsync(CancellationToken ct = default)
    {
        var products = await _db.Products
            .Where(p => p.IsActive)
            .Select(p => new ProductDto(p.Id, p.Name, p.Slug, p.Description, p.Price, p.StockQuantity, p.ImageUrls))
            .ToListAsync(ct);
            
        return ApiResponse<List<ProductDto>>.Ok(products);
    }

    public async Task<ApiResponse<ProductDto>> GetProductBySlugAsync(string slug, CancellationToken ct = default)
    {
        var p = await _db.Products
            .FirstOrDefaultAsync(p => p.Slug == slug && p.IsActive, ct);
            
        if (p == null) return ApiResponse<ProductDto>.Fail("Sản phẩm không tồn tại.");
        
        return ApiResponse<ProductDto>.Ok(new ProductDto(p.Id, p.Name, p.Slug, p.Description, p.Price, p.StockQuantity, p.ImageUrls));
    }

    public async Task<ApiResponse<List<OrderDto>>> GetMyOrdersAsync(Guid userId, CancellationToken ct = default)
    {
        var orders = await _db.Orders
            .Where(o => o.CustomerId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new OrderDto(o.Id, o.OrderNumber, o.TotalAmount, o.Status, o.PaymentStatus, o.CreatedAt))
            .ToListAsync(ct);

        return ApiResponse<List<OrderDto>>.Ok(orders);
    }

    public async Task<ApiResponse<string>> CancelOrderAsync(Guid userId, Guid orderId, CancellationToken ct = default)
    {
        var order = await _db.Orders.FirstOrDefaultAsync(o => o.Id == orderId && o.CustomerId == userId, ct);
        if (order == null) return ApiResponse<string>.Fail("Đơn hàng không tồn tại.");

        if (order.Status != OrderStatus.Pending && order.Status != OrderStatus.Confirmed)
            return ApiResponse<string>.Fail("Không thể hủy đơn hàng ở trạng thái hiện tại.");

        if (order.PaymentStatus == PaymentStatus.Paid)
        {
            order.Status = OrderStatus.WaitingForRefund;
        }
        else
        {
            order.Status = OrderStatus.Cancelled;
        }

        // Return stock
        var items = await _db.OrderItems.Where(oi => oi.OrderId == orderId).ToListAsync(ct);
        foreach (var item in items)
        {
            var product = await _db.Products.FindAsync(new object[] { item.ProductId }, ct);
            if (product != null) product.StockQuantity += item.Quantity;
        }

        await _db.SaveChangesAsync(ct);
        return ApiResponse<string>.Ok("Hủy đơn hàng thành công.");
    }

    public async Task<ApiResponse<OrderDto>> PlaceOrderAsync(Guid userId, PlaceOrderRequest req, CancellationToken ct = default)
    {
        // Admin check (Simplified: usually handled by policy or explicit check)
        // For now, let's assume we don't want admins to buy.
        
        if (req.Items == null || !req.Items.Any())
            return ApiResponse<OrderDto>.Fail("Giỏ hàng trống.");

        // Validate stock and calculate total
        decimal totalAmount = 0;
        var orderItems = new List<OrderItem>();
        
        foreach (var item in req.Items)
        {
            var product = await _db.Products.FindAsync(new object[] { item.ProductId }, ct);
            if (product == null || !product.IsActive)
                return ApiResponse<OrderDto>.Fail($"Sản phẩm {item.ProductId} không khả dụng.");

            if (product.StockQuantity < item.Quantity)
                return ApiResponse<OrderDto>.Fail($"Sản phẩm {product.Name} không đủ hàng (còn lại {product.StockQuantity}).");

            // Subtract stock
            product.StockQuantity -= item.Quantity;
            
            var orderItem = new OrderItem
            {
                ProductId = product.Id,
                Quantity = item.Quantity,
                UnitPrice = product.Price
            };
            orderItems.Add(orderItem);
            totalAmount += orderItem.TotalPrice;
        }

        var orderNumber = $"TL-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..8].ToUpper()}";
        var order = new Order
        {
            OrderNumber = orderNumber,
            CustomerId = userId,
            ShippingFullName = req.ShippingFullName,
            ShippingPhone = req.ShippingPhone,
            ShippingAddress = req.ShippingAddress,
            TotalAmount = totalAmount,
            PaymentMethod = req.PaymentMethod,
            Notes = req.Notes,
            Items = orderItems
        };

        _db.Orders.Add(order);
        await _db.SaveChangesAsync(ct);

        return ApiResponse<OrderDto>.Ok(new OrderDto(order.Id, order.OrderNumber, order.TotalAmount, order.Status, order.PaymentStatus, order.CreatedAt));
    }
}

public record ProductDto(Guid Id, string Name, string Slug, string? Description, decimal Price, int StockQuantity, string? ImageUrls);
public record PlaceOrderRequest(string ShippingFullName, string ShippingPhone, string ShippingAddress, string PaymentMethod, string? Notes, List<CartItemRequest> Items);
public record CartItemRequest(Guid ProductId, int Quantity);
public record OrderDto(Guid Id, string OrderNumber, decimal TotalAmount, OrderStatus Status, PaymentStatus PaymentStatus, DateTime CreatedAt);
