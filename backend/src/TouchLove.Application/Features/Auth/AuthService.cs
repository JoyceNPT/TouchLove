using System.Security.Cryptography;
using System.Text;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using TouchLove.Application.Interfaces;
using TouchLove.Domain.Entities;
using TouchLove.Shared;

namespace TouchLove.Application.Features.Auth;

public class AuthService
{
    private readonly UserManager<User> _userManager;
    private readonly IApplicationDbContext _db;
    private readonly IEmailService _email;
    private readonly ICaptchaService _captcha;
    private readonly ICacheService _cache;
    private readonly IConfiguration _config;

    public AuthService(
        UserManager<User> userManager,
        IApplicationDbContext db,
        IEmailService email,
        ICaptchaService captcha,
        ICacheService cache,
        IConfiguration config)
    {
        _userManager = userManager;
        _db = db;
        _email = email;
        _captcha = captcha;
        _cache = cache;
        _config = config;
    }

    // ──────────────────────────────────────────────────────────────────
    // REGISTER
    // ──────────────────────────────────────────────────────────────────
    public async Task<ApiResponse<string>> RegisterAsync(RegisterRequest req, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return ApiResponse<string>.Fail("Email và mật khẩu không được để trống.");

        if (!await _captcha.VerifyAsync(req.CaptchaToken, ct))
            return ApiResponse<string>.Fail("Xác thực CAPTCHA không thành công. Vui lòng thử lại.");

        var existing = await _userManager.FindByEmailAsync(req.Email);
        if (existing != null)
        {
            if (existing.IsEmailVerified)
                return ApiResponse<string>.Fail("Email này đã được đăng ký và xác thực. Vui lòng đăng nhập.");
            
            // Re-send verification for unverified users
            var oldTokens = await _db.EmailVerificationTokens
                .Where(t => t.UserId == existing.Id && !t.IsUsed)
                .ToListAsync(ct);
            foreach(var t in oldTokens) t.IsUsed = true;
            
            var rawToken = GenerateSecureToken();
            _db.EmailVerificationTokens.Add(new EmailVerificationToken
            {
                UserId = existing.Id,
                TokenHash = HashSha256(rawToken),
                ExpiresAt = DateTime.UtcNow.AddHours(Constants.Auth.EmailVerificationHours)
            });
            await _db.SaveChangesAsync(ct);

            var link = $"{_config["Frontend:Url"]}/verify-email?token={rawToken}";
            await _email.SendEmailVerificationAsync(req.Email, link, ct);
            
            return ApiResponse<string>.Ok("Tài khoản đã tồn tại nhưng chưa xác thực. Một mã xác thực mới đã được gửi đến email của bạn.");
        }

        var user = new User
        {
            UserName = req.Email,
            Email = req.Email,
            DisplayName = req.DisplayName.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, req.Password);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            return ApiResponse<string>.Fail("Đăng ký không thành công.", errors);
        }

        await _userManager.AddToRoleAsync(user, Constants.Roles.User);
        _db.UserSettings.Add(new UserSetting { UserId = user.Id });

        var verifyRaw = GenerateSecureToken();
        _db.EmailVerificationTokens.Add(new EmailVerificationToken
        {
            UserId = user.Id,
            TokenHash = HashSha256(verifyRaw),
            ExpiresAt = DateTime.UtcNow.AddHours(Constants.Auth.EmailVerificationHours)
        });

        await _db.SaveChangesAsync(ct);

        var verifyLink = $"{_config["Frontend:Url"]}/verify-email?token={verifyRaw}";
        await _email.SendEmailVerificationAsync(req.Email, verifyLink, ct);

        return ApiResponse<string>.Ok("Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.");
    }

    // ──────────────────────────────────────────────────────────────────
    // LOGIN
    // ──────────────────────────────────────────────────────────────────
    public async Task<ApiResponse<LoginResponse>> LoginAsync(LoginRequest req, string ipAddress, CancellationToken ct = default)
    {
        if (!await _captcha.VerifyAsync(req.CaptchaToken, ct))
            return ApiResponse<LoginResponse>.Fail("CAPTCHA validation failed.");

        // Rate limit: 5 attempts per IP+Email in 15 minutes
        var lockoutKey = $"lockout:{ipAddress}:{req.Email.ToLower()}";
        var attemptKey = $"attempts:{ipAddress}:{req.Email.ToLower()}";
        if (await _cache.ExistsAsync(lockoutKey, ct))
            return ApiResponse<LoginResponse>.Fail("Too many login attempts. Please try again in 15 minutes.");

        var user = await _userManager.FindByEmailAsync(req.Email);
        if (user == null || !await _userManager.CheckPasswordAsync(user, req.Password))
        {
            await _cache.IncrementAsync(attemptKey, TimeSpan.FromMinutes(Constants.Auth.LockoutMinutes), ct);
            var count = await _cache.GetCounterAsync(attemptKey, ct);
            if (count >= Constants.Auth.MaxLoginAttempts)
                await _cache.SetAsync(lockoutKey, true, TimeSpan.FromMinutes(Constants.Auth.LockoutMinutes), ct);

            return ApiResponse<LoginResponse>.Fail("Invalid email or password.");
        }

        if (!user.IsActive)
            return ApiResponse<LoginResponse>.Fail("Your account has been suspended. Please contact support.");

        // Clear failed attempts
        await _cache.RemoveAsync(attemptKey, ct);
        await _cache.RemoveAsync(lockoutKey, ct);

        var roles = await _userManager.GetRolesAsync(user);
        var accessToken = GenerateJwtToken(user, roles);
        var (rawRefreshToken, refreshTokenEntity) = GenerateRefreshToken(user.Id, req.RememberMe);

        _db.RefreshTokens.Add(refreshTokenEntity);
        await _db.SaveChangesAsync(ct);

        return ApiResponse<LoginResponse>.Ok(new LoginResponse(
            AccessToken: accessToken,
            RefreshToken: rawRefreshToken,
            User: new UserDto(user.Id, user.DisplayName, user.Email!, user.AvatarUrl, roles.First(), user.IsActive),
            ExpiresAt: DateTime.UtcNow.AddMinutes(Constants.Auth.AccessTokenMinutes)
        ));
    }

    // ──────────────────────────────────────────────────────────────────
    // REFRESH TOKEN
    // ──────────────────────────────────────────────────────────────────
    public async Task<ApiResponse<RefreshResponse>> RefreshTokenAsync(string rawToken, CancellationToken ct = default)
    {
        var hash = HashSha256(rawToken);
        var token = await _db.RefreshTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == hash, ct);

        if (token == null)
            return ApiResponse<RefreshResponse>.Fail("Invalid refresh token.");

        if (token.IsRevoked)
        {
            // Reuse attack detected — revoke entire chain
            await RevokeTokenChainAsync(token.Id, ct);
            return ApiResponse<RefreshResponse>.Fail("Security alert: token reuse detected. Please login again.");
        }

        if (token.ExpiresAt < DateTime.UtcNow)
            return ApiResponse<RefreshResponse>.Fail("Refresh token expired. Please login again.");

        var user = token.User!;
        if (!user.IsActive)
            return ApiResponse<RefreshResponse>.Fail("Account suspended.");

        // Rotation: revoke old, issue new
        token.IsRevoked = true;
        token.RevokedAt = DateTime.UtcNow;

        var roles = await _userManager.GetRolesAsync(user);
        var newAccessToken = GenerateJwtToken(user, roles);
        var (rawNew, newRefreshToken) = GenerateRefreshToken(user.Id, false);
        newRefreshToken.ReplacedByTokenId = token.Id;
        token.ReplacedByTokenId = newRefreshToken.Id;

        _db.RefreshTokens.Add(newRefreshToken);
        await _db.SaveChangesAsync(ct);

        return ApiResponse<RefreshResponse>.Ok(new RefreshResponse(newAccessToken, rawNew,
            DateTime.UtcNow.AddMinutes(Constants.Auth.AccessTokenMinutes)));
    }

    // ──────────────────────────────────────────────────────────────────
    // FORGOT PASSWORD
    // ──────────────────────────────────────────────────────────────────
    public async Task<ApiResponse<string>> ForgotPasswordAsync(string email, CancellationToken ct = default)
    {
        // Rate limit: 3 req/hour per email
        var rateKey = $"forgot-pw:{email.ToLower()}";
        var count = await _cache.GetCounterAsync(rateKey, ct);
        if (count >= Constants.Auth.ForgotPasswordRateLimit)
            return ApiResponse<string>.Ok("If this email exists, a reset link has been sent."); // silent limit

        var user = await _userManager.FindByEmailAsync(email);
        if (user != null && user.IsActive)
        {
            var rawToken = GenerateSecureToken();
            var hash = HashSha256(rawToken);
            _db.PasswordResetTokens.Add(new PasswordResetToken
            {
                UserId = user.Id,
                TokenHash = hash,
                ExpiresAt = DateTime.UtcNow.AddMinutes(Constants.Auth.PasswordResetMinutes)
            });
            await _db.SaveChangesAsync(ct);

            var resetLink = $"{_config["Frontend:Url"]}/reset-password?token={rawToken}";
            await _email.SendPasswordResetAsync(email, resetLink, ct);
        }

        await _cache.IncrementAsync(rateKey, TimeSpan.FromHours(1), ct);

        // Always 200 OK regardless — anti user enumeration
        return ApiResponse<string>.Ok("If this email exists, a reset link has been sent.");
    }

    // ──────────────────────────────────────────────────────────────────
    // RESET PASSWORD
    // ──────────────────────────────────────────────────────────────────
    public async Task<ApiResponse<string>> ResetPasswordAsync(string rawToken, string newPassword, CancellationToken ct = default)
    {
        var hash = HashSha256(rawToken);
        var token = await _db.PasswordResetTokens
            .FirstOrDefaultAsync(t => t.TokenHash == hash && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow, ct);

        if (token == null)
            return ApiResponse<string>.Fail("Invalid or expired reset token.");

        var user = await _userManager.FindByIdAsync(token.UserId.ToString());
        if (user == null) return ApiResponse<string>.Fail("User not found.");

        var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, resetToken, newPassword);
        if (!result.Succeeded)
            return ApiResponse<string>.Fail("Password reset failed.", result.Errors.Select(e => e.Description).ToList());

        // Mark token used
        token.IsUsed = true;

        // Revoke ALL refresh tokens for this user
        var allTokens = await _db.RefreshTokens.Where(t => t.UserId == user.Id && !t.IsRevoked).ToListAsync(ct);
        foreach (var rt in allTokens)
        {
            rt.IsRevoked = true;
            rt.RevokedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(ct);

        return ApiResponse<string>.Ok("Password reset successfully. Please login with your new password.");
    }

    // ──────────────────────────────────────────────────────────────────
    // VERIFY EMAIL
    // ──────────────────────────────────────────────────────────────────
    public async Task<ApiResponse<string>> VerifyEmailAsync(string rawToken, CancellationToken ct = default)
    {
        var hash = HashSha256(rawToken);
        var token = await _db.EmailVerificationTokens
            .FirstOrDefaultAsync(t => t.TokenHash == hash && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow, ct);

        if (token == null)
            return ApiResponse<string>.Fail("Invalid or expired verification token.");

        var user = await _userManager.FindByIdAsync(token.UserId.ToString());
        if (user == null) return ApiResponse<string>.Fail("User not found.");

        user.IsEmailVerified = true;
        token.IsUsed = true;

        await _db.SaveChangesAsync(ct);
        return ApiResponse<string>.Ok("Email verified successfully.");
    }

    // ──────────────────────────────────────────────────────────────────
    // LOGOUT
    // ──────────────────────────────────────────────────────────────────
    public async Task<ApiResponse<UserDto>> GetUserProfileAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null) return ApiResponse<UserDto>.Fail("User not found.");
        
        if (!user.IsActive) return ApiResponse<UserDto>.Fail("Account suspended.");

        var roles = await _userManager.GetRolesAsync(user);
        return ApiResponse<UserDto>.Ok(new UserDto(user.Id, user.DisplayName, user.Email!, user.AvatarUrl, roles.First(), user.IsActive));
    }

    public async Task<ApiResponse<string>> LogoutAsync(string rawToken, CancellationToken ct = default)
    {
        if (!string.IsNullOrEmpty(rawToken))
        {
            var hash = HashSha256(rawToken);
            var token = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct);
            if (token != null)
            {
                token.IsRevoked = true;
                token.RevokedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync(ct);
            }
        }
        return ApiResponse<string>.Ok("Logged out successfully.");
    }

    public async Task<ApiResponse<string>> ChangePasswordAsync(Guid userId, ChangePasswordRequest req, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null) return ApiResponse<string>.Fail("Người dùng không tồn tại.");

        var result = await _userManager.ChangePasswordAsync(user, req.CurrentPassword, req.NewPassword);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            return ApiResponse<string>.Fail("Đổi mật khẩu không thành công.", errors);
        }

        // Revoke all refresh tokens for security
        var tokens = await _db.RefreshTokens.Where(t => t.UserId == userId && !t.IsRevoked).ToListAsync(ct);
        foreach (var t in tokens)
        {
            t.IsRevoked = true;
            t.RevokedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync(ct);

        return ApiResponse<string>.Ok("Đổi mật khẩu thành công. Vui lòng đăng nhập lại với mật khẩu mới.");
    }

    // ──────────────────────────────────────────────────────────────────
    // HELPERS
    // ──────────────────────────────────────────────────────────────────
    public static string HashSha256(string input)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(bytes).ToLower();
    }

    private static string GenerateSecureToken()
    {
        var bytes = new byte[32];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToBase64String(bytes).Replace("+", "-").Replace("/", "_").Replace("=", "");
    }

    private (string raw, RefreshToken entity) GenerateRefreshToken(Guid userId, bool rememberMe)
    {
        var raw = GenerateSecureToken();
        var days = rememberMe ? Constants.Auth.RefreshTokenDaysRememberMe : Constants.Auth.RefreshTokenDaysDefault;
        return (raw, new RefreshToken
        {
            UserId = userId,
            TokenHash = HashSha256(raw),
            ExpiresAt = DateTime.UtcNow.AddDays(days)
        });
    }

    // ──────────────────────────────────────────────────────────────────
    // NFC AUTO-LOGIN
    // ──────────────────────────────────────────────────────────────────
    public async Task<ApiResponse<LoginResponse>> LoginByNfcAsync(string keyId, CancellationToken ct = default)
    {
        var keychain = await _db.Keychains
            .Include(k => k.User)
            .FirstOrDefaultAsync(k => k.KeyId == keyId, ct);

        if (keychain == null)
            return ApiResponse<LoginResponse>.Fail("Chip NFC không hợp lệ.");

        User user;
        if (keychain.UserId == null)
        {
            // Create a shadow user for this NFC ID
            user = new User
                {
                    UserName = $"nfc_{keyId}",
                    Email = $"{keyId}@touchlove.local", // Placeholder email
                    DisplayName = "Người dùng mới",
                    IsActive = true,
                    IsEmailVerified = true // Auto-verify for NFC users
                };

            var result = await _userManager.CreateAsync(user, Guid.NewGuid().ToString() + "Nfc123!");
            if (!result.Succeeded)
                return ApiResponse<LoginResponse>.Fail("Không thể khởi tạo tài khoản NFC.");

            await _userManager.AddToRoleAsync(user, Constants.Roles.User);
            _db.UserSettings.Add(new UserSetting { UserId = user.Id });

            keychain.UserId = user.Id;
            keychain.Status = Domain.Enums.KeychainStatus.Activated;
            keychain.ActivatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
        }
        else
        {
            user = keychain.User!;
        }

        var roles = await _userManager.GetRolesAsync(user);
        var accessToken = GenerateJwtToken(user, roles);
        var (rawRefreshToken, refreshTokenEntity) = GenerateRefreshToken(user.Id, true);

        _db.RefreshTokens.Add(refreshTokenEntity);
        await _db.SaveChangesAsync(ct);

        return ApiResponse<LoginResponse>.Ok(new LoginResponse(
            AccessToken: accessToken,
            RefreshToken: rawRefreshToken,
            User: new UserDto(user.Id, user.DisplayName, user.Email!, user.AvatarUrl, roles.First(), user.IsActive),
            ExpiresAt: DateTime.UtcNow.AddMinutes(Constants.Auth.AccessTokenMinutes)
        ));
    }

    private string GenerateJwtToken(User user, IList<string> roles)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email!),
            new("displayName", user.DisplayName),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(Constants.Auth.AccessTokenMinutes),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task RevokeTokenChainAsync(Guid tokenId, CancellationToken ct)
    {
        // Walk the chain via ReplacedByTokenId and revoke all
        var visited = new HashSet<Guid>();
        var queue = new Queue<Guid>();
        queue.Enqueue(tokenId);

        while (queue.Count > 0)
        {
            var current = queue.Dequeue();
            if (!visited.Add(current)) continue;

            var tokens = await _db.RefreshTokens
                .Where(t => t.Id == current || t.ReplacedByTokenId == current)
                .ToListAsync(ct);

            foreach (var t in tokens)
            {
                if (!t.IsRevoked)
                {
                    t.IsRevoked = true;
                    t.RevokedAt = DateTime.UtcNow;
                }
                if (t.ReplacedByTokenId.HasValue)
                    queue.Enqueue(t.ReplacedByTokenId.Value);
            }
        }

        await _db.SaveChangesAsync(ct);
    }
}

// ── DTOs ────────────────────────────────────────────────────────────
public record RegisterRequest(string Email, string Password, string DisplayName, string CaptchaToken);
public record LoginRequest(string Email, string Password, bool RememberMe, string CaptchaToken);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
public record LoginResponse(string AccessToken, string RefreshToken, UserDto User, DateTime ExpiresAt);
public record RefreshResponse(string AccessToken, string RefreshToken, DateTime ExpiresAt);
public record UserDto(Guid Id, string DisplayName, string Email, string? AvatarUrl, string Role, bool IsActive);
