using Microsoft.EntityFrameworkCore;
using TouchLove.Shared;
using TouchLove.Application.Interfaces;
using TouchLove.Domain.Entities;
using System.Text.Json;

namespace TouchLove.Application.Features.CartService;

public class CartService : ICartService
{
    private readonly IApplicationDbContext _db;

    public CartService(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<CartDto>> GetCartAsync(Guid userId, CancellationToken ct = default)
    {
        var cart = await _db.Carts
            .Include(c => c.Items)
            .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(c => c.UserId == userId, ct);

        if (cart == null)
        {
            cart = new Cart { UserId = userId };
            _db.Carts.Add(cart);
            await _db.SaveChangesAsync(ct);
        }

        var dto = new CartDto(cart.Id, cart.Items.Select(i => new CartItemDto(
            i.ProductId,
            i.Quantity,
            i.Product?.Name ?? "Unknown",
            GetFirstImageUrl(i.Product?.ImageUrls),
            i.Product?.Price ?? 0,
            i.Product?.StockQuantity ?? 0
        )).ToList());

        return ApiResponse<CartDto>.Ok(dto);
    }

    public async Task<ApiResponse<CartDto>> SyncCartAsync(Guid userId, List<SyncCartItemDto> items, CancellationToken ct = default)
    {
        var cart = await _db.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.UserId == userId, ct);

        if (cart == null)
        {
            cart = new Cart { UserId = userId };
            _db.Carts.Add(cart);
        }

        // Update cart items
        _db.CartItems.RemoveRange(cart.Items);
        cart.Items.Clear();

        foreach (var item in items)
        {
            var productExists = await _db.Products.AnyAsync(p => p.Id == item.ProductId && !p.IsDeleted, ct);
            if (productExists)
            {
                cart.Items.Add(new CartItem
                {
                    ProductId = item.ProductId,
                    Quantity = item.Quantity
                });
            }
        }

        await _db.SaveChangesAsync(ct);

        return await GetCartAsync(userId, ct);
    }

    private string GetFirstImageUrl(string? imageUrlsJson)
    {
        if (string.IsNullOrEmpty(imageUrlsJson)) return "";
        try
        {
            var urls = JsonSerializer.Deserialize<List<string>>(imageUrlsJson);
            return urls?.FirstOrDefault() ?? "";
        }
        catch
        {
            return "";
        }
    }
}
