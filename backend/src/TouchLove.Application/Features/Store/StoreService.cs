using Microsoft.EntityFrameworkCore;
using TouchLove.Application.Interfaces;
using TouchLove.Domain.Entities;
using TouchLove.Domain.Enums;
using System.Text.Json;
using TouchLove.Shared;
using PayOS;
using PayOS.Models.V2.PaymentRequests;
using Microsoft.Extensions.Configuration;

namespace TouchLove.Application.Features.Store;

public class StoreService
{
    private readonly IApplicationDbContext _db;
    private readonly ICacheService _cache;
    private readonly TouchLove.Application.Features.Voucher.IVoucherService _voucherService;
    private readonly PayOSClient _payOS;
    private readonly IConfiguration _config;

    public StoreService(IApplicationDbContext db, ICacheService cache, TouchLove.Application.Features.Voucher.IVoucherService voucherService, PayOSClient payOS, IConfiguration config)
    {
        _db = db;
        _cache = cache;
        _voucherService = voucherService;
        _payOS = payOS;
        _config = config;
    }

    public async Task<ApiResponse<List<ProductDto>>> GetProductsAsync(CancellationToken ct = default)
    {
        var cacheKey = "store:products";
        var cached = await _cache.GetAsync<List<ProductDto>>(cacheKey, ct);
        if (cached != null) return ApiResponse<List<ProductDto>>.Ok(cached);

        var products = await _db.Products
            .Where(p => p.IsActive)
            .Select(p => new ProductDto(p.Id, p.Name, p.Slug, p.Description, p.Price, p.StockQuantity, p.ImageUrls))
            .ToListAsync(ct);
            
        await _cache.SetAsync(cacheKey, products, TimeSpan.FromMinutes(10), ct);
            
        return ApiResponse<List<ProductDto>>.Ok(products);
    }

    public async Task<ApiResponse<ProductDto>> GetProductBySlugAsync(string slug, CancellationToken ct = default)
    {
        var cacheKey = $"store:product:{slug}";
        var cached = await _cache.GetAsync<ProductDto>(cacheKey, ct);
        if (cached != null) return ApiResponse<ProductDto>.Ok(cached);

        var p = await _db.Products
            .FirstOrDefaultAsync(p => p.Slug == slug && p.IsActive, ct);
            
        if (p == null) return ApiResponse<ProductDto>.Fail("Sản phẩm không tồn tại.");
        
        var dto = new ProductDto(p.Id, p.Name, p.Slug, p.Description, p.Price, p.StockQuantity, p.ImageUrls);
        await _cache.SetAsync(cacheKey, dto, TimeSpan.FromMinutes(10), ct);
        
        return ApiResponse<ProductDto>.Ok(dto);
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
            if (product != null)
            {
                product.StockQuantity += item.Quantity;
                await _cache.RemoveAsync($"store:product:{product.Slug}", ct);
            }
        }

        await _db.SaveChangesAsync(ct);
        await _cache.RemoveAsync("store:products", ct);
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

            var orderItem = new OrderItem
            {
                ProductId = product.Id,
                Quantity = item.Quantity,
                UnitPrice = product.Price
            };
            orderItems.Add(orderItem);
            totalAmount += orderItem.TotalPrice;
        }

        if (!string.IsNullOrWhiteSpace(req.VoucherCode))
        {
            var valRes = await _voucherService.ValidateAsync(req.VoucherCode, totalAmount, userId, ct);
            if (!valRes.Success || !valRes.Data!.IsValid)
                return ApiResponse<OrderDto>.Fail(valRes.Message ?? valRes.Data?.Message ?? "Voucher không hợp lệ.");
            
            totalAmount -= valRes.Data.DiscountAmount;
            if (totalAmount < 0) totalAmount = 0;
        }

        var orderNumber = $"TL-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..8].ToUpper()}";

        if (req.PaymentMethod?.ToUpper() == "QR")
        {
            var payload = JsonSerializer.Serialize(req);
            int orderCode = int.Parse(DateTime.Now.ToString("ddHHmmss")); // max 31235959
            
            var pendingOrder = new PendingOrder
            {
                OrderNumber = orderNumber,
                CustomerId = userId,
                PayloadJson = payload,
                TotalAmount = totalAmount,
                TransactionId = orderCode.ToString(),
                ExpiresAt = DateTime.UtcNow.AddMinutes(15)
            };
            _db.PendingOrders.Add(pendingOrder);
            await _db.SaveChangesAsync(ct);
            
            // Create PayOS link
            var frontendUrl = _config["Frontend:Url"] ?? "http://localhost:3000";
            var cancelUrl = $"{frontendUrl}/checkout?cancel=true&order={orderNumber}";
            var returnUrl = $"{frontendUrl}/checkout?success=true&order={orderNumber}";
            
            var items = new List<PaymentLinkItem> { 
                new PaymentLinkItem { Name = $"Don hang {orderNumber}", Quantity = 1, Price = (int)totalAmount } 
            };
            var paymentData = new CreatePaymentLinkRequest {
                OrderCode = orderCode,
                Amount = (int)totalAmount,
                Description = $"Thanh toan {orderCode}",
                Items = items,
                CancelUrl = cancelUrl,
                ReturnUrl = returnUrl
            };
            var createPayment = await _payOS.PaymentRequests.CreateAsync(paymentData);
            
            return ApiResponse<OrderDto>.Ok(new OrderDto(Guid.Empty, orderNumber, totalAmount, OrderStatus.Pending, PaymentStatus.Unpaid, DateTime.UtcNow, createPayment.CheckoutUrl));
        }

        // For COD, subtract stock and create Order directly
        foreach (var item in orderItems)
        {
            var product = await _db.Products.FindAsync(new object[] { item.ProductId }, ct);
            if (product != null)
            {
                product.StockQuantity -= item.Quantity;
                await _cache.RemoveAsync($"store:product:{product.Slug}", ct);
            }
        }
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
        await _cache.RemoveAsync("store:products", ct);

        if (!string.IsNullOrWhiteSpace(req.VoucherCode))
        {
            // Note: Since RedeemAsync has its own transaction, it's safer to call it after saving the order, 
            // but in reality we might want a distributed transaction. Here we'll just call it.
            var redeemRes = await _voucherService.RedeemAsync(req.VoucherCode, totalAmount + (await _voucherService.ValidateAsync(req.VoucherCode, totalAmount, userId, ct)).Data!.DiscountAmount, userId, order.Id, ct);
            if (!redeemRes.Success)
            {
                // In a real app we might want to cancel the order here if redeem fails.
            }
        }
        await _db.SaveChangesAsync(ct);
        await _cache.RemoveAsync("store:products", ct);

        return ApiResponse<OrderDto>.Ok(new OrderDto(order.Id, order.OrderNumber, order.TotalAmount, order.Status, order.PaymentStatus, order.CreatedAt));
    }

    public async Task<ApiResponse<string>> CancelPendingOrderAsync(string orderNumber, CancellationToken ct = default)
    {
        var pending = await _db.PendingOrders.FirstOrDefaultAsync(p => p.OrderNumber == orderNumber, ct);
        if (pending != null)
        {
            _db.PendingOrders.Remove(pending);
            await _db.SaveChangesAsync(ct);
        }
        return ApiResponse<string>.Ok("Hủy giao dịch thành công.");
    }

    public async Task<ApiResponse<string>> ConfirmPendingOrderAsync(string transactionId, CancellationToken ct = default)
    {
        var pending = await _db.PendingOrders
            .FirstOrDefaultAsync(p => p.TransactionId == transactionId, ct);

        if (pending == null)
            return ApiResponse<string>.Fail("Đơn hàng không tồn tại hoặc đã được xử lý.");

        if (pending.ExpiresAt < DateTime.UtcNow)
        {
            _db.PendingOrders.Remove(pending);
            await _db.SaveChangesAsync(ct);
            return ApiResponse<string>.Fail("Giao dịch đã hết hạn.");
        }

        var req = JsonSerializer.Deserialize<PlaceOrderRequest>(pending.PayloadJson);
        if (req == null) return ApiResponse<string>.Fail("Dữ liệu lỗi.");

        // Check stock again
        var orderItems = new List<OrderItem>();
        foreach (var item in req.Items)
        {
            var product = await _db.Products.FindAsync(new object[] { item.ProductId }, ct);
            if (product == null || product.StockQuantity < item.Quantity)
                return ApiResponse<string>.Fail($"Sản phẩm không đủ số lượng.");
                
            product.StockQuantity -= item.Quantity;
            orderItems.Add(new OrderItem
            {
                ProductId = product.Id,
                Quantity = item.Quantity,
                UnitPrice = product.Price
            });
        }

        var order = new Order
        {
            OrderNumber = pending.OrderNumber,
            CustomerId = pending.CustomerId,
            ShippingFullName = req.ShippingFullName,
            ShippingPhone = req.ShippingPhone,
            ShippingAddress = req.ShippingAddress,
            TotalAmount = pending.TotalAmount,
            PaymentMethod = req.PaymentMethod,
            Notes = req.Notes,
            Items = orderItems,
            Status = OrderStatus.Confirmed,
            PaymentStatus = PaymentStatus.Paid,
            TransactionId = pending.TransactionId
        };

        _db.Orders.Add(order);
        _db.PendingOrders.Remove(pending); // Remove pending
        await _db.SaveChangesAsync(ct);
        await _cache.RemoveAsync("store:products", ct);

        return ApiResponse<string>.Ok("Xác nhận thanh toán và tạo đơn hàng thành công.");
    }
}

public record ProductDto(Guid Id, string Name, string Slug, string? Description, decimal Price, int StockQuantity, string? ImageUrls);
public record PlaceOrderRequest(string ShippingFullName, string ShippingPhone, string ShippingAddress, string PaymentMethod, string? Notes, List<CartItemRequest> Items, string? VoucherCode = null);
public record CartItemRequest(Guid ProductId, int Quantity);
public record OrderDto(Guid Id, string OrderNumber, decimal TotalAmount, OrderStatus Status, PaymentStatus PaymentStatus, DateTime CreatedAt, string? CheckoutUrl = null);
