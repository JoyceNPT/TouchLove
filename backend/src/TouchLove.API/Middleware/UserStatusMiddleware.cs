using Microsoft.AspNetCore.Identity;
using System.Security.Claims;
using TouchLove.Domain.Entities;

namespace TouchLove.API.Middleware;

public class UserStatusMiddleware
{
    private readonly RequestDelegate _next;

    public UserStatusMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, UserManager<User> userManager)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrEmpty(userId))
            {
                var user = await userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    await context.Response.WriteAsJsonAsync(new { success = false, message = "Tài khoản không tồn tại." });
                    return;
                }

                var path = context.Request.Path.Value?.ToLowerInvariant() ?? "";
                bool isNfcRoute = path.StartsWith("/api/nfc") || 
                                  path.StartsWith("/api/keychains") || 
                                  path.StartsWith("/api/couples") || 
                                  path.StartsWith("/api/memories");

                bool isAuthRoute = path.StartsWith("/api/auth");

                if (isNfcRoute)
                {
                    if (!user.IsNfcActive)
                    {
                        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        await context.Response.WriteAsJsonAsync(new { success = false, message = "Không gian NFC của bạn đã bị khóa." });
                        return;
                    }
                }
                else if (!isAuthRoute)
                {
                    if (!user.IsSalesActive)
                    {
                        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        await context.Response.WriteAsJsonAsync(new { success = false, message = "Tài khoản mua hàng của bạn đã bị khóa." });
                        return;
                    }
                }
            }
        }

        await _next(context);
    }
}

public static class UserStatusMiddlewareExtensions
{
    public static IApplicationBuilder UseUserStatusCheck(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<UserStatusMiddleware>();
    }
}
