using Microsoft.EntityFrameworkCore;
using TouchLove.Application.Interfaces;
using TouchLove.Domain.Entities;
using TouchLove.Domain.Enums;
using TouchLove.Shared;

namespace TouchLove.Application.Features.Couple;

public class CoupleService
{
    private readonly IApplicationDbContext _db;
    private readonly ICacheService _cache;
    private readonly IFileStorageService _storage;

    public CoupleService(IApplicationDbContext db, ICacheService cache, IFileStorageService storage)
    {
        _db = db;
        _cache = cache;
        _storage = storage;
    }

    // ─── Public: Get Couple Page ──────────────────────────────────────
    public async Task<ApiResponse<CouplePageDto>> GetCouplePageAsync(string slug, CancellationToken ct = default)
    {
        var cacheKey = $"couple:{slug}";
        var cached = await _cache.GetAsync<CouplePageDto>(cacheKey, ct);
        if (cached != null)
            return ApiResponse<CouplePageDto>.Ok(cached);

        var couple = await _db.Couples
            .Include(c => c.KeychainA).ThenInclude(k => k!.User)
            .Include(c => c.KeychainB).ThenInclude(k => k!.User)
            .FirstOrDefaultAsync(c => c.CoupleSlug == slug && c.IsActive, ct);

        if (couple == null)
            return ApiResponse<CouplePageDto>.Fail("Couple page not found.");

        var recentMemories = await _db.Memories
            .Where(m => m.CoupleId == couple.Id)
            .OrderBy(m => m.SortOrder)
            .ThenByDescending(m => m.CreatedAt)
            .Take(12)
            .Select(m => new MemoryPreviewDto(m.Id, _storage.GetPublicUrl(m.StoragePath), m.Caption, m.SortOrder))
            .ToListAsync(ct);

        var todayMessage = await _db.DailyMessages
            .Where(m => m.CoupleId == couple.Id && m.MessageDate == DateOnly.FromDateTime(DateTime.UtcNow))
            .Select(m => m.Content)
            .FirstOrDefaultAsync(ct);

        var dto = new CouplePageDto(
            Id: couple.Id,
            Slug: couple.CoupleSlug,
            CoupleName: couple.CoupleName,
            StartDate: couple.StartDate,
            Description: couple.Description,
            AvatarAUrl: couple.AvatarAUrl,
            AvatarBUrl: couple.AvatarBUrl,
            NfcScanCount: couple.NfcScanCount,
            PartnerAName: couple.KeychainA?.User?.DisplayName,
            PartnerBName: couple.KeychainB?.User?.DisplayName,
            TodayMessage: todayMessage ?? "Hãy luôn yêu thương và trân trọng nhau nhé! 💕",
            RecentMemories: recentMemories
        );

        await _cache.SetAsync(cacheKey, dto, TimeSpan.FromMinutes(Constants.Cache.CouplePageMinutes), ct);
        return ApiResponse<CouplePageDto>.Ok(dto);
    }

    // ─── Update Couple Info ───────────────────────────────────────────
    public async Task<ApiResponse<string>> UpdateCoupleAsync(Guid coupleId, Guid userId, UpdateCoupleRequest req, CancellationToken ct = default)
    {
        var couple = await GetCoupleIfPartnerAsync(coupleId, userId, ct);
        if (couple == null)
            return ApiResponse<string>.Fail("Couple not found or access denied.");

        if (req.CoupleName != null) couple.CoupleName = req.CoupleName;
        if (req.Description != null) couple.Description = req.Description;
        if (req.StartDate.HasValue) couple.StartDate = req.StartDate.Value;

        if (req.CoupleSlug != null && req.CoupleSlug != couple.CoupleSlug)
        {
            var taken = await _db.Couples.AnyAsync(c => c.CoupleSlug == req.CoupleSlug, ct);
            if (taken) return ApiResponse<string>.Fail("This slug is already taken. Please choose another.");
            couple.CoupleSlug = req.CoupleSlug;
        }

        await _db.SaveChangesAsync(ct);
        await _cache.RemoveAsync($"couple:{couple.CoupleSlug}", ct);
        return ApiResponse<string>.Ok("Couple updated successfully.");
    }

    // ─── Update Avatar ────────────────────────────────────────────────
    public async Task<ApiResponse<string>> UpdateAvatarAsync(Guid coupleId, Guid userId, Microsoft.AspNetCore.Http.IFormFile file, CancellationToken ct = default)
    {
        var couple = await GetCoupleIfPartnerAsync(coupleId, userId, ct);
        if (couple == null)
            return ApiResponse<string>.Fail("Couple not found or access denied.");

        var result = await _storage.UploadAsync(file, $"{coupleId}/avatars", ct);

        // Determine if user is Partner A or B
        var keychainA = await _db.Keychains.FirstOrDefaultAsync(k => k.Id == couple.KeychainAId && k.UserId == userId, ct);
        if (keychainA != null)
            couple.AvatarAUrl = result.PublicUrl;
        else
            couple.AvatarBUrl = result.PublicUrl;

        await _db.SaveChangesAsync(ct);
        await _cache.RemoveAsync($"couple:{couple.CoupleSlug}", ct);
        return ApiResponse<string>.Ok(result.PublicUrl);
    }

    // ─── Unpair: Request ─────────────────────────────────────────────
    public async Task<ApiResponse<string>> RequestUnpairAsync(Guid coupleId, Guid userId, CancellationToken ct = default)
    {
        var couple = await GetCoupleIfPartnerAsync(coupleId, userId, ct);
        if (couple == null) return ApiResponse<string>.Fail("Couple not found or access denied.");

        var keychain = await _db.Keychains
            .FirstOrDefaultAsync(k => k.CoupleId == coupleId && k.UserId == userId, ct);
        if (keychain == null) return ApiResponse<string>.Fail("Keychain not found.");

        // Check no pending request already
        var pending = await _db.UnpairRequests
            .AnyAsync(r => r.CoupleId == coupleId && !r.IsCompleted && !r.IsCancelled && r.ExpiresAt > DateTime.UtcNow, ct);
        if (pending) return ApiResponse<string>.Fail("An unpair request is already pending. Ask your partner to confirm.");

        _db.UnpairRequests.Add(new UnpairRequest
        {
            CoupleId = coupleId,
            RequestedByKeychainId = keychain.Id,
            ExpiresAt = DateTime.UtcNow.AddHours(Constants.UnpairRequest.ExpirationHours)
        });
        await _db.SaveChangesAsync(ct);

        return ApiResponse<string>.Ok("Unpair request sent. Your partner needs to confirm within 48 hours.");
    }

    // ─── Unpair: Confirm ─────────────────────────────────────────────
    public async Task<ApiResponse<string>> ConfirmUnpairAsync(Guid coupleId, Guid userId, CancellationToken ct = default)
    {
        var couple = await GetCoupleIfPartnerAsync(coupleId, userId, ct);
        if (couple == null) return ApiResponse<string>.Fail("Couple not found or access denied.");

        var keychain = await _db.Keychains
            .FirstOrDefaultAsync(k => k.CoupleId == coupleId && k.UserId == userId, ct);
        if (keychain == null) return ApiResponse<string>.Fail("Keychain not found.");

        var request = await _db.UnpairRequests
            .FirstOrDefaultAsync(r => r.CoupleId == coupleId && !r.IsCompleted && !r.IsCancelled
                                   && r.RequestedByKeychainId != keychain.Id // must be the OTHER partner
                                   && r.ExpiresAt > DateTime.UtcNow, ct);

        if (request == null)
            return ApiResponse<string>.Fail("No pending unpair request found from your partner.");

        // Complete unpair
        request.IsCompleted = true;
        request.ConfirmedByKeychainId = keychain.Id;
        request.CompletedAt = DateTime.UtcNow;

        couple.IsActive = false;
        couple.UnpairedAt = DateTime.UtcNow;
        couple.IsDeleted = true; // Soft delete (Hangfire will hard delete after 30 days)
        couple.UpdatedAt = DateTime.UtcNow;

        // Reset keychains to Activated (can be re-paired)
        var keychainA = await _db.Keychains.FindAsync([couple.KeychainAId], ct);
        var keychainB = await _db.Keychains.FindAsync([couple.KeychainBId], ct);
        if (keychainA != null) { keychainA.Status = KeychainStatus.Activated; keychainA.CoupleId = null; }
        if (keychainB != null) { keychainB.Status = KeychainStatus.Activated; keychainB.CoupleId = null; }

        await _db.SaveChangesAsync(ct);
        await _cache.RemoveAsync($"couple:{couple.CoupleSlug}", ct);

        return ApiResponse<string>.Ok("Unpaired successfully. You can pair again with a new keychain.");
    }

    // ─── NFC Redirect Logic ───────────────────────────────────────────
    public async Task<NfcRedirectResult> HandleNfcScanAsync(string keyId, string? userAgent, string? ip, CancellationToken ct = default)
    {
        var keychain = await _db.Keychains
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(k => k.KeyId == keyId, ct);

        if (keychain == null)
            return new NfcRedirectResult(NfcRedirectType.NotFound, null);

        return keychain.Status switch
        {
            KeychainStatus.Available => new NfcRedirectResult(NfcRedirectType.Activate, keyId),
            KeychainStatus.Activated => new NfcRedirectResult(NfcRedirectType.Pair, keyId),
            KeychainStatus.Revoked   => new NfcRedirectResult(NfcRedirectType.Revoked, null),
            KeychainStatus.Paired    => await HandlePairedScanAsync(keychain, userAgent, ip, ct),
            _ => new NfcRedirectResult(NfcRedirectType.NotFound, null)
        };
    }

    private async Task<NfcRedirectResult> HandlePairedScanAsync(Domain.Entities.Keychain keychain, string? userAgent, string? ip, CancellationToken ct)
    {
        var couple = await _db.Couples
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.Id == keychain.CoupleId, ct);

        if (couple == null || !couple.IsActive)
            return new NfcRedirectResult(NfcRedirectType.NotFound, null);

        couple.NfcScanCount++;
        _db.NfcScanLogs.Add(new NfcScanLog
        {
            CoupleId = couple.Id,
            KeychainId = keychain.Id,
            UserAgent = userAgent?.Length > 500 ? userAgent[..500] : userAgent,
            IpAddress = ip?.Length > 45 ? ip[..45] : ip
        });

        await _db.SaveChangesAsync();
        await _cache.RemoveAsync($"couple:{couple.CoupleSlug}");

        return new NfcRedirectResult(NfcRedirectType.CouplePage, couple.CoupleSlug);
    }

    private async Task<Domain.Entities.Couple?> GetCoupleIfPartnerAsync(Guid coupleId, Guid userId, CancellationToken ct)
    {
        var couple = await _db.Couples
            .Include(c => c.KeychainA)
            .Include(c => c.KeychainB)
            .FirstOrDefaultAsync(c => c.Id == coupleId, ct);

        if (couple == null) return null;
        if (couple.KeychainA?.UserId != userId && couple.KeychainB?.UserId != userId) return null;
        return couple;
    }
}

// ── DTOs ─────────────────────────────────────────────────────────────
public record CouplePageDto(
    Guid Id, string Slug, string? CoupleName, DateOnly StartDate,
    string? Description, string? AvatarAUrl, string? AvatarBUrl,
    int NfcScanCount, string? PartnerAName, string? PartnerBName,
    string TodayMessage,
    List<MemoryPreviewDto> RecentMemories);

public record MemoryPreviewDto(Guid Id, string Url, string? Caption, int SortOrder);

public record UpdateCoupleRequest(string? CoupleName, string? Description, DateOnly? StartDate, string? CoupleSlug);

public enum NfcRedirectType { NotFound, Activate, Pair, CouplePage, Revoked }
public record NfcRedirectResult(NfcRedirectType Type, string? Payload);
