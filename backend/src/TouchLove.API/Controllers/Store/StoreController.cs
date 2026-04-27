using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TouchLove.Application.Features.Store;
using TouchLove.Shared;

namespace TouchLove.API.Controllers.Store;

[ApiController]
[Route("api/store")]
public class StoreController : ControllerBase
{
    private readonly StoreService _storeService;

    public StoreController(StoreService storeService)
    {
        _storeService = storeService;
    }

    [HttpGet("products")]
    public async Task<IActionResult> GetProducts(CancellationToken ct)
        => Ok(await _storeService.GetProductsAsync(ct));

    [HttpGet("products/{slug}")]
    public async Task<IActionResult> GetProduct(string slug, CancellationToken ct)
        => Ok(await _storeService.GetProductBySlugAsync(slug, ct));

    [Authorize]
    [HttpGet("my-orders")]
    public async Task<IActionResult> GetMyOrders(CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        return Ok(await _storeService.GetMyOrdersAsync(userId, ct));
    }

    [Authorize]
    [HttpPost("orders/{id:guid}/cancel")]
    public async Task<IActionResult> CancelOrder(Guid id, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        return Ok(await _storeService.CancelOrderAsync(userId, id, ct));
    }

    [Authorize]
    [HttpPost("orders")]
    public async Task<IActionResult> PlaceOrder([FromBody] PlaceOrderRequest req, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        return Ok(await _storeService.PlaceOrderAsync(userId, req, ct));
    }
}
