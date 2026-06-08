using Microsoft.AspNetCore.Mvc;
using PayOS;
using PayOS.Models.Webhooks;
using TouchLove.Application.Features.Store;
using TouchLove.Shared;

namespace TouchLove.API.Controllers.Store;

[ApiController]
[Route("api/store/payos/webhook")]
public class PayOSWebhookController : ControllerBase
{
    private readonly StoreService _storeService;
    private readonly PayOSClient _payOS;

    public PayOSWebhookController(StoreService storeService, PayOSClient payOS)
    {
        _storeService = storeService;
        _payOS = payOS;
    }

    [HttpPost]
    public async Task<IActionResult> ReceiveWebhook([FromBody] Webhook payload, CancellationToken ct)
    {
        try
        {
            // Verify webhook payload signature using PayOS SDK
            WebhookData data = await _payOS.Webhooks.VerifyAsync(payload);

            if (payload.Code == "00" && payload.Success)
            {
                // Payment was successful
                string transactionId = data.OrderCode.ToString();
                var result = await _storeService.ConfirmPendingOrderAsync(transactionId, ct);
                if (result.Success)
                {
                    return Ok(new { success = true });
                }
            }

            return Ok(new { success = true }); // Return 200 OK to acknowledge receipt even if order not found
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }
}
