using Microsoft.EntityFrameworkCore;
using TouchLove.Application.Interfaces;
using TouchLove.Domain.Entities;
using TouchLove.Domain.Enums;
using TouchLove.Shared;

namespace TouchLove.Application.Features.Album;

public class AlbumService
{
    private readonly IApplicationDbContext _db;
    private readonly IFileStorageService _storage;
    private readonly ICacheService _cache;

    public AlbumService(IApplicationDbContext db, IFileStorageService storage, ICacheService cache)
    {
        _db = db;
        _storage = storage;
        _cache = cache;
    }

    public async Task<ApiResponse<PagedResult<MemoryDto>>> GetMemoriesAsync(string coupleSlug, int page, int size, CancellationToken ct = default)
    {
        var couple = await _db.Couples.FirstOrDefaultAsync(c => c.CoupleSlug == coupleSlug, ct);
        if (couple == null) return ApiResponse<PagedResult<MemoryDto>>.Fail("Couple not found.");

        var query = _db.Memories.Where(m => m.CoupleId == couple.Id);
        var total = await query.CountAsync(ct);
        var items = await query
            .OrderBy(m => m.SortOrder).ThenByDescending(m => m.CreatedAt)
            .Skip((page - 1) * size).Take(size)
            .Select(m => new MemoryDto(m.Id, _storage.GetPublicUrl(m.StoragePath), m.Caption, m.SortOrder, m.MimeType, m.CreatedAt))
            .ToListAsync(ct);

        return ApiResponse<PagedResult<MemoryDto>>.Ok(new PagedResult<MemoryDto>
        {
            Items = items, TotalCount = total, Page = page, PageSize = size
        });
    }

    public async Task<ApiResponse<MemoryDto>> UploadMemoryAsync(Guid coupleId, Guid userId, Microsoft.AspNetCore.Http.IFormFile file, string? caption, CancellationToken ct = default)
    {
        if (!await IsPartnerAsync(coupleId, userId, ct))
            return ApiResponse<MemoryDto>.Fail("Access denied.");

        var count = await _db.Memories.CountAsync(m => m.CoupleId == coupleId, ct);
        if (count >= Constants.Album.MaxMemoriesPerCouple)
            return ApiResponse<MemoryDto>.Fail($"Album limit of {Constants.Album.MaxMemoriesPerCouple} photos reached.");

        if (file.Length > Constants.Album.MaxFileSizeBytes)
            return ApiResponse<MemoryDto>.Fail("File size exceeds 10MB limit.");

        var uploadResult = await _storage.UploadAsync(file, coupleId.ToString(), ct);

        var maxSort = await _db.Memories.Where(m => m.CoupleId == coupleId).MaxAsync(m => (int?)m.SortOrder, ct) ?? 0;

        var memory = new Memory
        {
            CoupleId = coupleId,
            UploadedByUserId = userId,
            StoragePath = uploadResult.StoragePath,
            StorageType = uploadResult.StorageType,
            OriginalFileName = file.FileName,
            MimeType = file.ContentType,
            FileSizeBytes = file.Length,
            Caption = caption?.Length > 200 ? caption[..200] : caption,
            SortOrder = maxSort + 1
        };
        _db.Memories.Add(memory);
        await _db.SaveChangesAsync(ct);

        var couple = await _db.Couples.FindAsync([coupleId], ct);
        if (couple != null) await _cache.RemoveAsync($"couple:{couple.CoupleSlug}", ct);

        return ApiResponse<MemoryDto>.Ok(new MemoryDto(memory.Id, uploadResult.PublicUrl, memory.Caption, memory.SortOrder, memory.MimeType, memory.CreatedAt));
    }

    public async Task<ApiResponse<string>> DeleteMemoryAsync(Guid memoryId, Guid userId, CancellationToken ct = default)
    {
        var memory = await _db.Memories.Include(m => m.Couple).FirstOrDefaultAsync(m => m.Id == memoryId, ct);
        if (memory == null) return ApiResponse<string>.Fail("Memory not found.");

        if (!await IsPartnerAsync(memory.CoupleId, userId, ct))
            return ApiResponse<string>.Fail("Access denied.");

        memory.IsDeleted = true;
        memory.DeleteScheduledAt = DateTime.UtcNow.AddDays(Constants.Album.DeleteAfterDays);
        await _db.SaveChangesAsync(ct);

        if (memory.Couple != null) await _cache.RemoveAsync($"couple:{memory.Couple.CoupleSlug}", ct);
        return ApiResponse<string>.Ok("Memory deleted. It will be permanently removed in 7 days.");
    }

    public async Task<ApiResponse<string>> UpdateMemoryAsync(Guid memoryId, Guid userId, string? caption, int? sortOrder, CancellationToken ct = default)
    {
        var memory = await _db.Memories.FirstOrDefaultAsync(m => m.Id == memoryId, ct);
        if (memory == null) return ApiResponse<string>.Fail("Memory not found.");

        if (!await IsPartnerAsync(memory.CoupleId, userId, ct))
            return ApiResponse<string>.Fail("Access denied.");

        if (caption != null) memory.Caption = caption.Length > 200 ? caption[..200] : caption;
        if (sortOrder.HasValue) memory.SortOrder = sortOrder.Value;

        await _db.SaveChangesAsync(ct);
        return ApiResponse<string>.Ok("Memory updated.");
    }

    private async Task<bool> IsPartnerAsync(Guid coupleId, Guid userId, CancellationToken ct)
    {
        return await _db.Keychains
            .IgnoreQueryFilters()
            .AnyAsync(k => k.CoupleId == coupleId && k.UserId == userId, ct);
    }
}

public record MemoryDto(Guid Id, string Url, string? Caption, int SortOrder, string MimeType, DateTime CreatedAt);
