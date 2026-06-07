using TouchLove.Shared;
using TouchLove.Domain.Entities;

namespace TouchLove.Application.Features.CartService;

public interface ICartService
{
    Task<ApiResponse<CartDto>> GetCartAsync(Guid userId, CancellationToken ct = default);
    Task<ApiResponse<CartDto>> SyncCartAsync(Guid userId, List<SyncCartItemDto> items, CancellationToken ct = default);
}

public record CartDto(Guid Id, List<CartItemDto> Items);
public record CartItemDto(Guid ProductId, int Quantity, string ProductName, string ProductImage, decimal Price, int StockQuantity);
public record SyncCartItemDto(Guid ProductId, int Quantity);
