using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TouchLove.Application.Features.Admin;
using TouchLove.Domain.Enums;
using TouchLove.Shared;

namespace TouchLove.API.Controllers.Admin;

[Authorize(Roles = Constants.Roles.Admin)]
[ApiController]
[Route("api/admin/store")]
public class AdminStoreController : ControllerBase
{
    private readonly AdminStoreService _adminStoreService;

    public AdminStoreController(AdminStoreService adminStoreService)
    {
        _adminStoreService = adminStoreService;
    }

    [HttpGet("suppliers")]
    public async Task<IActionResult> GetSuppliers(CancellationToken ct)
        => Ok(await _adminStoreService.GetSuppliersAsync(ct));

    [HttpPost("suppliers")]
    public async Task<IActionResult> CreateSupplier([FromBody] SupplierDto req, CancellationToken ct)
        => Ok(await _adminStoreService.CreateSupplierAsync(req, ct));

    [HttpGet("products")]
    public async Task<IActionResult> GetProducts(CancellationToken ct)
        => Ok(await _adminStoreService.GetProductsAsync(ct));

    [HttpPost("products")]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductRequest req, CancellationToken ct)
        => Ok(await _adminStoreService.CreateProductAsync(req, ct));

    [HttpPut("products/{id:guid}")]
    public async Task<IActionResult> UpdateProduct(Guid id, [FromBody] CreateProductRequest req, CancellationToken ct)
        => Ok(await _adminStoreService.UpdateProductAsync(id, req, ct));

    [HttpDelete("products/{id:guid}")]
    public async Task<IActionResult> DeleteProduct(Guid id, CancellationToken ct)
        => Ok(await _adminStoreService.DeleteProductAsync(id, ct));

    [HttpGet("orders")]
    public async Task<IActionResult> GetOrders([FromQuery] OrderStatus? status, CancellationToken ct)
        => Ok(await _adminStoreService.GetOrdersAsync(status, ct));

    [HttpPatch("orders/{id:guid}/status")]
    public async Task<IActionResult> UpdateOrderStatus(Guid id, [FromBody] OrderStatus status, CancellationToken ct)
        => Ok(await _adminStoreService.UpdateOrderStatusAsync(id, status, ct));
}
