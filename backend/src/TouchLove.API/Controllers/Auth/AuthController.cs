using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TouchLove.Application.Features.Auth;
using TouchLove.Shared;

namespace TouchLove.API.Controllers.Auth;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<string>>> Register([FromBody] RegisterRequest req, CancellationToken ct)
        => Ok(await _authService.RegisterAsync(req, ct));

    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> Login([FromBody] LoginRequest req, CancellationToken ct)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var result = await _authService.LoginAsync(req, ip, ct);

        if (result.Success && result.Data != null)
        {
            // Set Refresh Token in HttpOnly Cookie
            Response.Cookies.Append("refreshToken", result.Data.RefreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = false, // true in production
                SameSite = SameSiteMode.Strict,
                Expires = DateTimeOffset.UtcNow.AddDays(result.Data.ExpiresAt > DateTime.UtcNow.AddDays(15) ? 30 : 7)
            });

            // Don't expose raw refresh token in body
            return Ok(ApiResponse<LoginResponse>.Ok(result.Data with { RefreshToken = string.Empty }));
        }

        return Ok(result);
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<ApiResponse<RefreshResponse>>> Refresh(CancellationToken ct)
    {
        var rawToken = Request.Cookies["refreshToken"];
        if (string.IsNullOrEmpty(rawToken))
            return Ok(ApiResponse<RefreshResponse>.Fail("No refresh token provided."));

        var result = await _authService.RefreshTokenAsync(rawToken, ct);

        if (result.Success && result.Data != null)
        {
            Response.Cookies.Append("refreshToken", result.Data.RefreshToken, new CookieOptions
            {
                HttpOnly = true, Secure = false, SameSite = SameSiteMode.Strict,
                Expires = DateTimeOffset.UtcNow.AddDays(7)
            });
            return Ok(ApiResponse<RefreshResponse>.Ok(result.Data with { RefreshToken = string.Empty }));
        }

        return Ok(result);
    }

    [HttpPost("logout")]
    public async Task<ActionResult<ApiResponse<string>>> Logout(CancellationToken ct)
    {
        var rawToken = Request.Cookies["refreshToken"];
        Response.Cookies.Delete("refreshToken");
        return Ok(await _authService.LogoutAsync(rawToken ?? string.Empty, ct));
    }

    [HttpPost("forgot-password")]
    public async Task<ActionResult<ApiResponse<string>>> ForgotPassword([FromBody] ForgotPasswordRequest req, CancellationToken ct)
        => Ok(await _authService.ForgotPasswordAsync(req.Email, ct));

    [HttpPost("reset-password")]
    public async Task<ActionResult<ApiResponse<string>>> ResetPassword([FromBody] ResetPasswordRequest req, CancellationToken ct)
        => Ok(await _authService.ResetPasswordAsync(req.Token, req.NewPassword, ct));

    [HttpGet("verify-email")]
    public async Task<ActionResult<ApiResponse<string>>> VerifyEmail([FromQuery] string token, CancellationToken ct)
        => Ok(await _authService.VerifyEmailAsync(token, ct));
}

public record ForgotPasswordRequest(string Email);
public record ResetPasswordRequest(string Token, string NewPassword);
