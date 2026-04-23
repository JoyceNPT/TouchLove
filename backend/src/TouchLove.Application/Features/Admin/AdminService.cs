using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TouchLove.Application.Interfaces;
using TouchLove.Domain.Entities;
using TouchLove.Domain.Enums;
using TouchLove.Shared;

namespace TouchLove.Application.Features.Admin;

public class AdminService
{
    private readonly IApplicationDbContext _db;
    private readonly UserManager<User> _userManager;
    private readonly IEmailService _email;
    private readonly IFileStorageService _storage;

    public AdminService(IApplicationDbContext db, UserManager<User> userManager, IEmailService email, IFileStorageService storage)
    {
        _db = db;
        _userManager = userManager;
        _email = email;
        _storage = storage;
    }

    // ─── Stats ─────────────────────────────────────────────────────────
    public async Task<ApiResponse<AdminStatsDto>> GetStatsAsync(CancellationToken ct = default)
    {
        var today = DateTime.UtcNow.Date;
        var weekAgo = today.AddDays(-7);

        var stats = new AdminStatsDto(
            TotalCouples: await _db.Couples.IgnoreQueryFilters().CountAsync(ct),
            ActiveCouples: await _db.Couples.CountAsync(c => c.IsActive, ct),
            TotalUsers: await _userManager.Users.CountAsync(ct),
            ActiveUsers: await _userManager.Users.CountAsync(u => u.IsActive, ct),
            NfcScansToday: await _db.NfcScanLogs.CountAsync(l => l.ScannedAt >= today, ct),
            NfcScansThisWeek: await _db.NfcScanLogs.CountAsync(l => l.ScannedAt >= weekAgo, ct),
            NfcScansThisMonth: await _db.NfcScanLogs.CountAsync(l => l.ScannedAt >= today.AddDays(-30), ct),
            TotalMemories: await _db.Memories.IgnoreQueryFilters().CountAsync(ct),
            TemplatesByStatus: new TemplateStats(
                Draft: await _db.MessageTemplates.IgnoreQueryFilters().CountAsync(t => t.Status == TemplateStatus.Draft, ct),
                Published: await _db.MessageTemplates.IgnoreQueryFilters().CountAsync(t => t.Status == TemplateStatus.Published, ct),
                Archived: await _db.MessageTemplates.IgnoreQueryFilters().CountAsync(t => t.Status == TemplateStatus.Archived, ct)
            ),
            NewCouplesLast7Days: await _db.Couples.IgnoreQueryFilters()
                .Where(c => c.CreatedAt >= weekAgo)
                .GroupBy(c => c.CreatedAt.Date)
                .Select(g => new DailyCount(g.Key, g.Count()))
                .OrderBy(d => d.Date)
                .ToListAsync(ct)
        );

        return ApiResponse<AdminStatsDto>.Ok(stats);
    }

    // ─── Users ─────────────────────────────────────────────────────────
    public async Task<ApiResponse<PagedResult<AdminUserDto>>> GetUsersAsync(string? search, string? status, int page, int size, CancellationToken ct = default)
    {
        var query = _userManager.Users.AsQueryable();
        if (!string.IsNullOrEmpty(search))
            query = query.Where(u => u.Email!.Contains(search) || u.DisplayName.Contains(search));
        if (status == "blocked") query = query.Where(u => !u.IsActive);
        else if (status == "active") query = query.Where(u => u.IsActive);

        var total = await query.CountAsync(ct);
        var items = await query
            .Skip((page - 1) * size).Take(size)
            .Select(u => new AdminUserDto(u.Id, u.DisplayName, u.Email!, u.IsActive, u.IsEmailVerified, u.CreatedAt))
            .ToListAsync(ct);

        return ApiResponse<PagedResult<AdminUserDto>>.Ok(new PagedResult<AdminUserDto>
        {
            Items = items, TotalCount = total, Page = page, PageSize = size
        });
    }

    public async Task<ApiResponse<string>> BlockUserAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null) return ApiResponse<string>.Fail("User not found.");
        user.IsActive = false;
        await _userManager.UpdateAsync(user);
        return ApiResponse<string>.Ok("User blocked.");
    }

    public async Task<ApiResponse<string>> UnblockUserAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null) return ApiResponse<string>.Fail("User not found.");
        user.IsActive = true;
        await _userManager.UpdateAsync(user);
        return ApiResponse<string>.Ok("User unblocked.");
    }

    // ─── Keychains ─────────────────────────────────────────────────────
    public async Task<ApiResponse<List<KeychainSummaryDto>>> BulkCreateKeychainsAsync(int count, CancellationToken ct = default)
    {
        if (count < 1 || count > 1000) return ApiResponse<List<KeychainSummaryDto>>.Fail("Count must be between 1 and 1000.");
        var result = new List<KeychainSummaryDto>();
        for (int i = 0; i < count; i++)
        {
            var keyId = Guid.NewGuid().ToString();
            var keychain = new Domain.Entities.Keychain { KeyId = keyId };
            _db.Keychains.Add(keychain);
            result.Add(new KeychainSummaryDto(keychain.Id, keyId));
        }
        await _db.SaveChangesAsync(ct);
        return ApiResponse<List<KeychainSummaryDto>>.Ok(result, $"{count} keychains created.");
    }

    public async Task<ApiResponse<string>> RevokeKeychainAsync(string keyId, CancellationToken ct = default)
    {
        var keychain = await _db.Keychains.IgnoreQueryFilters().FirstOrDefaultAsync(k => k.KeyId == keyId, ct);
        if (keychain == null) return ApiResponse<string>.Fail("Keychain not found.");
        keychain.Status = KeychainStatus.Revoked;
        keychain.RevokedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return ApiResponse<string>.Ok("Keychain revoked.");
    }

    public async Task<ApiResponse<string>> ReactivateKeychainAsync(string keyId, CancellationToken ct = default)
    {
        var keychain = await _db.Keychains.IgnoreQueryFilters().FirstOrDefaultAsync(k => k.KeyId == keyId, ct);
        if (keychain == null) return ApiResponse<string>.Fail("Keychain not found.");
        if (keychain.Status != KeychainStatus.Revoked) return ApiResponse<string>.Fail("Only revoked keychains can be reactivated.");
        keychain.Status = KeychainStatus.Available;
        keychain.RevokedAt = null;
        await _db.SaveChangesAsync(ct);
        return ApiResponse<string>.Ok("Keychain reactivated.");
    }

    // ─── Templates ─────────────────────────────────────────────────────
    public async Task<ApiResponse<TemplateDto>> CreateTemplateAsync(Guid adminId, string content, string language, string? category, CancellationToken ct = default)
    {
        var template = new MessageTemplate
        {
            Content = content,
            Language = language,
            Category = category,
            Status = TemplateStatus.Draft,
            CreatedByAdminId = adminId
        };
        _db.MessageTemplates.Add(template);
        await _db.SaveChangesAsync(ct);
        return ApiResponse<TemplateDto>.Ok(MapTemplate(template));
    }

    public async Task<ApiResponse<string>> PublishTemplateAsync(Guid templateId, CancellationToken ct = default)
    {
        var template = await _db.MessageTemplates.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == templateId, ct);
        if (template == null) return ApiResponse<string>.Fail("Template not found.");
        if (template.Status != TemplateStatus.Draft) return ApiResponse<string>.Fail("Only draft templates can be published.");
        template.Status = TemplateStatus.Published;
        template.PublishedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return ApiResponse<string>.Ok("Template published.");
    }

    public async Task<ApiResponse<string>> ArchiveTemplateAsync(Guid templateId, CancellationToken ct = default)
    {
        var template = await _db.MessageTemplates.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == templateId, ct);
        if (template == null) return ApiResponse<string>.Fail("Template not found.");
        if (template.Status != TemplateStatus.Published) return ApiResponse<string>.Fail("Only published templates can be archived.");
        template.Status = TemplateStatus.Archived;
        await _db.SaveChangesAsync(ct);
        return ApiResponse<string>.Ok("Template archived.");
    }

    public async Task<ApiResponse<PagedResult<TemplateDto>>> GetTemplatesAsync(string? status, string? language, string? category, int page, int size, CancellationToken ct = default)
    {
        var query = _db.MessageTemplates.IgnoreQueryFilters().AsQueryable();
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<TemplateStatus>(status, true, out var ts)) query = query.Where(t => t.Status == ts);
        if (!string.IsNullOrEmpty(language)) query = query.Where(t => t.Language == language);
        if (!string.IsNullOrEmpty(category)) query = query.Where(t => t.Category == category);

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * size).Take(size).Select(t => MapTemplate(t)).ToListAsync(ct);

        return ApiResponse<PagedResult<TemplateDto>>.Ok(new PagedResult<TemplateDto>
        {
            Items = items, TotalCount = total, Page = page, PageSize = size
        });
    }

    private static TemplateDto MapTemplate(MessageTemplate t) =>
        new(t.Id, t.Content, t.Language, t.Category, t.Status, t.PublishedAt, t.CreatedAt);
}

// ── DTOs ─────────────────────────────────────────────────────────────
public record AdminStatsDto(int TotalCouples, int ActiveCouples, int TotalUsers, int ActiveUsers,
    int NfcScansToday, int NfcScansThisWeek, int NfcScansThisMonth, int TotalMemories,
    TemplateStats TemplatesByStatus, List<DailyCount> NewCouplesLast7Days);
public record TemplateStats(int Draft, int Published, int Archived);
public record DailyCount(DateTime Date, int Count);
public record AdminUserDto(Guid Id, string DisplayName, string Email, bool IsActive, bool IsEmailVerified, DateTime CreatedAt);
public record KeychainSummaryDto(Guid Id, string KeyId);
public record TemplateDto(Guid Id, string Content, string Language, string? Category, TemplateStatus Status, DateTime? PublishedAt, DateTime CreatedAt);
