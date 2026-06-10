using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TouchLove.Application.Features.Auth;
using TouchLove.Application.Features.Keychain;
using TouchLove.Application.Interfaces;
using TouchLove.Domain.Entities;
using TouchLove.Domain.Enums;
using TouchLove.Shared;

namespace TouchLove.API.Controllers.NFC;

[ApiController]
[Route("api/nfc")]
public class NfcProfileController : ControllerBase
{
    private readonly IApplicationDbContext _db;
    private readonly UserManager<User> _userManager;
    private readonly AuthService _authService;
    private readonly KeychainService _keychainService;
    private readonly IFileStorageService _storage;

    public NfcProfileController(
        IApplicationDbContext db,
        UserManager<User> userManager,
        AuthService authService,
        KeychainService keychainService,
        IFileStorageService storage)
    {
        _db = db;
        _userManager = userManager;
        _authService = authService;
        _keychainService = keychainService;
        _storage = storage;
    }

    // ─── 1. Get current NFC profile ─────────────────────────────
    [Authorize]
    [HttpGet("profile")]
    public async Task<ActionResult<ApiResponse<NfcProfileDto>>> GetProfile(CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            return NotFound(ApiResponse<NfcProfileDto>.Fail("Không tìm thấy người dùng."));

        var keychain = await _db.Keychains
            .Include(k => k.Couple)
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(k => k.UserId == userId && (k.Status == KeychainStatus.Activated || k.Status == KeychainStatus.Paired), ct);

        if (keychain == null)
            return Ok(ApiResponse<NfcProfileDto>.Fail("Tài khoản chưa liên kết với móc khóa NFC nào."));

        string? inviteCode = null;
        if (keychain.Status == KeychainStatus.Activated)
        {
            // Get or create invite code automatically
            var activeInvite = await _db.PairingInvitations
                .FirstOrDefaultAsync(i => i.InitiatorKeychainId == keychain.Id && !i.IsUsed && i.ExpiresAt > DateTime.UtcNow, ct);

            if (activeInvite != null)
            {
                inviteCode = activeInvite.InviteCode;
            }
            else
            {
                // Auto create invite code
                var inviteResult = await _keychainService.CreateInviteAsync(userId, ct);
                if (inviteResult.Success)
                    inviteCode = inviteResult.Data;
            }
        }

        var pairingPending = keychain.Status == KeychainStatus.Activated
            ? await _keychainService.GetPairingPendingForUserAsync(userId, ct)
            : null;

        var profile = new NfcProfileDto(
            Id: user.Id,
            DisplayName: user.DisplayName,
            Nickname: user.Nickname,
            AvatarUrl: user.AvatarUrl,
            Gender: user.Gender,
            DateOfBirth: user.DateOfBirth,
            Bio: user.Bio,
            NfcPassword: user.NfcPassword,
            IsProfilePublic: user.IsProfilePublic,
            UserType: user.UserType.ToString(),
            KeyId: keychain.KeyId,
            IsPaired: keychain.Status == KeychainStatus.Paired,
            CoupleSlug: keychain.Couple?.CoupleSlug,
            InviteCode: inviteCode,
            CoupleId: keychain.CoupleId,
            PairingPendingRole: pairingPending?.Role,
            PairingPendingPartnerName: pairingPending?.PartnerName,
            PairingPendingInvitationId: pairingPending?.InvitationId
        );

        return Ok(ApiResponse<NfcProfileDto>.Ok(profile));
    }

    // ─── 2. Update NFC profile ──────────────────────────────────
    [Authorize]
    [HttpPost("profile/update")]
    public async Task<ActionResult<ApiResponse<string>>> UpdateProfile([FromBody] UpdateNfcProfileRequest req, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            return NotFound(ApiResponse<string>.Fail("Không tìm thấy người dùng."));

        user.DisplayName = req.DisplayName;
        user.Nickname = req.Nickname;
        user.Gender = req.Gender;
        user.DateOfBirth = req.DateOfBirth;
        user.Bio = req.Bio;
        user.IsProfilePublic = req.IsProfilePublic;

        // Set or remove passcode (6 digits PIN only, or alphanumeric)
        if (!string.IsNullOrEmpty(req.NfcPassword))
        {
            if (req.NfcPassword.Length != 6 || !req.NfcPassword.All(char.IsDigit))
                return BadRequest(ApiResponse<string>.Fail("Mật khẩu quét NFC phải đúng 6 chữ số (PIN)."));
            
            user.NfcPassword = req.NfcPassword;
        }
        else
        {
            user.NfcPassword = null;
        }

        user.UpdatedAt = DateTime.UtcNow;
        var result = await _userManager.UpdateAsync(user);

        if (!result.Succeeded)
            return Ok(ApiResponse<string>.Fail("Cập nhật thông tin thất bại."));

        return Ok(ApiResponse<string>.Ok("Cập nhật thông tin cá nhân NFC thành công!"));
    }

    // ─── 2b. Upload NFC profile avatar ──────────────────────────────
    [Authorize]
    [HttpPost("profile/avatar")]
    public async Task<ActionResult<ApiResponse<string>>> UploadAvatar(IFormFile file, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            return NotFound(ApiResponse<string>.Fail("Không tìm thấy người dùng."));

        if (file == null || file.Length == 0)
            return BadRequest(ApiResponse<string>.Fail("File không hợp lệ."));

        try
        {
            var oldAvatarUrl = user.AvatarUrl;
            var uploadResult = await _storage.UploadAsync(file, $"users/{userId}/avatars", ct);
            user.AvatarUrl = uploadResult.PublicUrl;
            user.UpdatedAt = DateTime.UtcNow;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                return Ok(ApiResponse<string>.Fail("Lưu ảnh đại diện thất bại."));

            if (!string.IsNullOrEmpty(oldAvatarUrl) && oldAvatarUrl != uploadResult.PublicUrl)
            {
                await _storage.DeleteByUrlAsync(oldAvatarUrl, ct);
            }

            // Clear couple cache so the Couple Space shows the new avatar immediately
            var keychain = await _db.Keychains.FirstOrDefaultAsync(k => k.UserId == userId && k.CoupleId != null, ct);
            if (keychain != null && keychain.CoupleId.HasValue)
            {
                var cacheService = HttpContext.RequestServices.GetService<ICacheService>();
                if (cacheService != null)
                {
                    await cacheService.RemoveAsync($"couple:{keychain.CoupleId.Value}", ct);
                }
            }

            return Ok(ApiResponse<string>.Ok(uploadResult.PublicUrl));
        }
        catch (Exception ex)
        {
            return Ok(ApiResponse<string>.Fail($"Lỗi khi tải ảnh lên: {ex.Message}"));
        }
    }

    // ─── 3. Public access to NFC personal profile ───────────────
    [HttpGet("profiles/{keyId}")]
    public async Task<ActionResult<ApiResponse<PublicNfcProfileDto>>> GetPublicProfile(string keyId, CancellationToken ct)
    {
        var keychain = await _db.Keychains
            .Include(k => k.User)
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(k => k.KeyId == keyId, ct);

        if (keychain == null || keychain.User == null)
            return NotFound(ApiResponse<PublicNfcProfileDto>.Fail("Không tìm thấy thông tin NFC cá nhân này."));

        var user = keychain.User;
        if (!user.IsProfilePublic)
            return Ok(ApiResponse<PublicNfcProfileDto>.Fail("Hồ sơ này ở chế độ riêng tư."));

        int? age = null;
        if (user.DateOfBirth.HasValue)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            age = today.Year - user.DateOfBirth.Value.Year;
            if (user.DateOfBirth.Value > today.AddYears(-age.Value)) age--;
        }

        // Get invite code if unpaired
        string? inviteCode = null;
        if (keychain.Status == KeychainStatus.Activated)
        {
            var activeInvite = await _db.PairingInvitations
                .FirstOrDefaultAsync(i => i.InitiatorKeychainId == keychain.Id && !i.IsUsed && i.ExpiresAt > DateTime.UtcNow, ct);
            inviteCode = activeInvite?.InviteCode;
        }

        var publicProfile = new PublicNfcProfileDto(
            DisplayName: user.DisplayName,
            Gender: user.Gender,
            Age: age,
            Bio: user.Bio,
            KeyId: keyId,
            IsPaired: keychain.Status == KeychainStatus.Paired,
            InviteCode: inviteCode
        );

        return Ok(ApiResponse<PublicNfcProfileDto>.Ok(publicProfile));
    }

    // ─── 4. Unlock NFC passcode and retrieve token ─────────────
    [HttpPost("unlock")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> UnlockNfc([FromBody] NfcUnlockRequest req, CancellationToken ct)
    {
        var result = await _authService.LoginByNfcWithPasswordAsync(req.KeyId, req.Passcode, ct);

        if (result.Success && result.Data != null)
        {
            Response.Cookies.Append("refreshToken", result.Data.RefreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = false,
                SameSite = SameSiteMode.Strict,
                Expires = DateTimeOffset.UtcNow.AddDays(30)
            });

            return Ok(ApiResponse<LoginResponse>.Ok(result.Data with { RefreshToken = string.Empty }));
        }

        return Ok(result);
    }

    // ─── 5. Explore page public network ─────────────────────────
    [HttpGet("explore")]
    public async Task<ActionResult<ApiResponse<ExploreResultDto>>> Explore(CancellationToken ct)
    {
        // 1. Fetch keychains and active invitations separately to prevent LINQ translation errors
        var keychains = await _db.Keychains
            .Include(k => k.User)
            .IgnoreQueryFilters()
            .Where(k => k.Status == KeychainStatus.Activated && k.CoupleId == null && k.User != null && k.User.IsProfilePublic)
            .ToListAsync(ct);

        var activeInvitations = await _db.PairingInvitations
            .Where(i => !i.IsUsed && !i.IsPendingConfirmation && i.ExpiresAt > DateTime.UtcNow)
            .ToDictionaryAsync(i => i.InitiatorKeychainId, i => i.InviteCode, ct);

        var publicUnpaired = keychains.Select(k => {
            int? age = null;
            if (k.User!.DateOfBirth.HasValue)
            {
                var today = DateOnly.FromDateTime(DateTime.UtcNow);
                age = today.Year - k.User.DateOfBirth.Value.Year;
                if (k.User.DateOfBirth.Value > today.AddYears(-age.Value)) age--;
            }

            activeInvitations.TryGetValue(k.Id, out var inviteCode);

            return new PublicNfcProfileDto(
                k.User.DisplayName,
                k.User.Gender,
                age,
                k.User.Bio,
                k.KeyId,
                false,
                inviteCode
            );
        }).ToList();

        // 2. Fetch public couples and compute love days in-memory
        var couplesList = await _db.Couples
            .Where(c => c.IsActive && c.IsPublic)
            .ToListAsync(ct);

        var publicCouples = couplesList.Select(c => {
            var start = c.StartDate.ToDateTime(TimeOnly.MinValue);
            var loveDays = (DateTime.UtcNow.Date - start.Date).Days;
            return new PublicCoupleDto(
                c.Id,
                c.CoupleName ?? "Cặp đôi TouchLove",
                c.CoupleSlug,
                c.StartDate,
                loveDays
            );
        }).ToList();

        return Ok(ApiResponse<ExploreResultDto>.Ok(new ExploreResultDto(publicUnpaired, publicCouples)));
    }

    // ─── 6. Setup initial PIN for brand-new NFC ───────────────
    [HttpPost("setup-pin")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> SetupInitialPin([FromBody] SetupNfcPinRequest req, CancellationToken ct)
    {
        var keychain = await _db.Keychains
            .Include(k => k.User)
            .FirstOrDefaultAsync(k => k.KeyId == req.KeyId, ct);

        if (keychain == null)
            return Ok(ApiResponse<LoginResponse>.Fail("Móc khóa NFC không hợp lệ."));

        if (keychain.UserId != null)
            return Ok(ApiResponse<LoginResponse>.Fail("Móc khóa này đã được kích hoạt tài khoản."));

        if (req.Passcode.Length != 6 || !req.Passcode.All(char.IsDigit))
            return Ok(ApiResponse<LoginResponse>.Fail("Mật mã PIN quét NFC phải đúng 6 chữ số."));

        // Create a shadow user for this NFC ID
        var user = new User
        {
            UserName = $"nfc_{req.KeyId}",
            Email = $"{req.KeyId}@touchlove.local",
            DisplayName = "Người dùng mới",
            UserType = UserType.NFC,
            NfcPassword = req.Passcode,
            IsSalesActive = true,
            IsNfcActive = true,
            IsEmailVerified = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, Guid.NewGuid().ToString() + "Nfc123!");
        if (!result.Succeeded)
            return Ok(ApiResponse<LoginResponse>.Fail("Không thể khởi tạo tài khoản NFC."));

        await _userManager.AddToRoleAsync(user, Constants.Roles.User);
        _db.UserSettings.Add(new UserSetting { UserId = user.Id });

        keychain.UserId = user.Id;
        keychain.Status = KeychainStatus.Activated;
        keychain.ActivatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        // Auto-login after setup
        var loginResult = await _authService.LoginByNfcWithPasswordAsync(req.KeyId, req.Passcode, ct);
        if (loginResult.Success && loginResult.Data != null)
        {
            Response.Cookies.Append("refreshToken", loginResult.Data.RefreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = false,
                SameSite = SameSiteMode.Strict,
                Expires = DateTimeOffset.UtcNow.AddDays(30)
            });

            return Ok(ApiResponse<LoginResponse>.Ok(loginResult.Data with { RefreshToken = string.Empty }));
        }

        return Ok(ApiResponse<LoginResponse>.Fail("Đăng nhập thất bại sau khi cài đặt PIN."));
    }

    // ─── 7. Personal Anniversary Reminders ───────────────────────────
    [Authorize]
    [HttpGet("reminders")]
    public async Task<ActionResult<ApiResponse<List<AnniversaryReminder>>>> GetReminders(CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var reminders = await _db.AnniversaryReminders
            .Where(r => r.UserId == userId)
            .OrderBy(r => r.Date)
            .ToListAsync(ct);
        return Ok(ApiResponse<List<AnniversaryReminder>>.Ok(reminders));
    }

    [Authorize]
    [HttpPost("reminders")]
    public async Task<ActionResult<ApiResponse<AnniversaryReminder>>> CreateReminder([FromBody] CreateReminderRequest req, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var reminder = new AnniversaryReminder
        {
            UserId = userId,
            Title = req.Title,
            Date = req.Date,
            IsRecurring = req.IsRecurring
        };
        _db.AnniversaryReminders.Add(reminder);
        await _db.SaveChangesAsync(ct);
        return Ok(ApiResponse<AnniversaryReminder>.Ok(reminder));
    }

    [Authorize]
    [HttpPut("reminders/{id:guid}")]
    public async Task<ActionResult<ApiResponse<AnniversaryReminder>>> UpdateReminder(Guid id, [FromBody] UpdateReminderRequest req, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var reminder = await _db.AnniversaryReminders.FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId, ct);
        if (reminder == null) return NotFound(ApiResponse<AnniversaryReminder>.Fail("Không tìm thấy lời nhắc."));

        if (req.Title != null) reminder.Title = req.Title;
        if (req.Date.HasValue) reminder.Date = req.Date.Value;
        if (req.IsRecurring.HasValue) reminder.IsRecurring = req.IsRecurring.Value;

        await _db.SaveChangesAsync(ct);
        return Ok(ApiResponse<AnniversaryReminder>.Ok(reminder));
    }

    [Authorize]
    [HttpDelete("reminders/{id:guid}")]
    public async Task<ActionResult<ApiResponse<string>>> DeleteReminder(Guid id, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var reminder = await _db.AnniversaryReminders.FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId, ct);
        if (reminder == null) return NotFound(ApiResponse<string>.Fail("Không tìm thấy lời nhắc."));

        _db.AnniversaryReminders.Remove(reminder);
        await _db.SaveChangesAsync(ct);
        return Ok(ApiResponse<string>.Ok("Đã xóa lời nhắc thành công."));
    }
}

public record CreateReminderRequest(string Title, DateOnly Date, bool IsRecurring);
public record UpdateReminderRequest(string? Title, DateOnly? Date, bool? IsRecurring);

// ── DTOs ────────────────────────────────────────────────────────────
public record SetupNfcPinRequest(string KeyId, string Passcode);

public record NfcProfileDto(
    Guid Id,
    string DisplayName,
    string? Nickname,
    string? AvatarUrl,
    string? Gender,
    DateOnly? DateOfBirth,
    string? Bio,
    string? NfcPassword,
    bool IsProfilePublic,
    string UserType,
    string KeyId,
    bool IsPaired,
    string? CoupleSlug,
    string? InviteCode,
    Guid? CoupleId = null,
    string? PairingPendingRole = null,
    string? PairingPendingPartnerName = null,
    Guid? PairingPendingInvitationId = null
);

public record UpdateNfcProfileRequest(
    string DisplayName,
    string? Nickname,
    string? Gender,
    DateOnly? DateOfBirth,
    string? Bio,
    bool IsProfilePublic,
    string? NfcPassword
);

public record PublicNfcProfileDto(
    string DisplayName,
    string? Gender,
    int? Age,
    string? Bio,
    string KeyId,
    bool IsPaired,
    string? InviteCode
);

public record NfcUnlockRequest(string KeyId, string Passcode);

public record PublicCoupleDto(
    Guid Id,
    string CoupleName,
    string CoupleSlug,
    DateOnly StartDate,
    int LoveDays
);

public record ExploreResultDto(
    List<PublicNfcProfileDto> UnpairedProfiles,
    List<PublicCoupleDto> Couples
);
