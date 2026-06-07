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

    public async Task<ApiResponse<PagedResult<MemoryDto>>> GetMemoriesAsync(Guid coupleId, int page, int size, CancellationToken ct = default)
    {
        var query = _db.Memories.Where(m => m.CoupleId == coupleId);
        var total = await query.CountAsync(ct);
        var memories = await query
            .Include(m => m.UploadedByUser)
            .OrderBy(m => m.SortOrder).ThenByDescending(m => m.CreatedAt)
            .Skip((page - 1) * size).Take(size)
            .ToListAsync(ct);

        var items = memories.Select(m => {
            List<string>? additionalUrls = null;
            if (!string.IsNullOrEmpty(m.AdditionalMediaJson))
            {
                try
                {
                    var mediaItems = System.Text.Json.JsonSerializer.Deserialize<List<MemoryMediaItem>>(m.AdditionalMediaJson);
                    if (mediaItems != null)
                    {
                        additionalUrls = mediaItems.Select(x => _storage.GetPublicUrl(x.StoragePath)).ToList();
                    }
                }
                catch { }
            }

            return new MemoryDto(
                m.Id, 
                _storage.GetPublicUrl(m.StoragePath), 
                m.Caption, 
                m.SortOrder, 
                m.MimeType, 
                m.CreatedAt, 
                m.UploadedByUser != null ? m.UploadedByUser.DisplayName : "Ẩn danh",
                additionalUrls);
        }).ToList();

        return ApiResponse<PagedResult<MemoryDto>>.Ok(new PagedResult<MemoryDto>
        {
            Items = items, TotalCount = total, Page = page, PageSize = size
        });
    }

    public async Task<ApiResponse<MemoryDto>> UploadMemoryAsync(Guid coupleId, Guid userId, List<Microsoft.AspNetCore.Http.IFormFile> files, string? caption, CancellationToken ct = default)
    {
        if (files == null || files.Count == 0)
            return ApiResponse<MemoryDto>.Fail("No files selected.");

        if (!await IsPartnerAsync(coupleId, userId, ct))
            return ApiResponse<MemoryDto>.Fail("Access denied.");

        var couple = await _db.Couples.FindAsync([coupleId], ct);
        if (couple == null) return ApiResponse<MemoryDto>.Fail("Couple not found.");

        long incomingBytes = 0;
        foreach (var file in files)
        {
            incomingBytes += file.Length;
            if (file.ContentType.StartsWith("video/") && file.Length > Constants.Album.MaxVideoFileSizeBytes)
                return ApiResponse<MemoryDto>.Fail($"Kích thước video {file.FileName} vượt quá giới hạn 50MB.");
        }

        if (couple.UsedStorageBytes + incomingBytes > Constants.Album.MaxStoragePerCoupleBytes)
            return ApiResponse<MemoryDto>.Fail("Dung lượng lưu trữ của Couple đã vượt quá giới hạn 1GB.");

        var mediaItems = new List<MemoryMediaItem>();
        string primaryUrl = string.Empty;

        for (int i = 0; i < files.Count; i++)
        {
            var file = files[i];
            var uploadResult = await _storage.UploadAsync(file, $"CoupleSpace/{coupleId}", ct);
            
            if (i == 0)
            {
                primaryUrl = uploadResult.PublicUrl;
            }

            mediaItems.Add(new MemoryMediaItem
            {
                StoragePath = uploadResult.StoragePath,
                MimeType = file.ContentType,
                OriginalFileName = file.FileName,
                FileSizeBytes = file.Length
            });
        }

        var maxSort = await _db.Memories.Where(m => m.CoupleId == coupleId).MaxAsync(m => (int?)m.SortOrder, ct) ?? 0;

        var firstFile = files[0];
        var firstUpload = mediaItems[0];

        var memory = new Memory
        {
            CoupleId = coupleId,
            UploadedByUserId = userId,
            StoragePath = firstUpload.StoragePath,
            StorageType = TouchLove.Domain.Enums.StorageType.Local,
            OriginalFileName = firstFile.FileName,
            MimeType = firstFile.ContentType,
            FileSizeBytes = firstFile.Length,
            Caption = caption?.Length > 200 ? caption[..200] : caption,
            SortOrder = maxSort + 1,
            AdditionalMediaJson = System.Text.Json.JsonSerializer.Serialize(mediaItems)
        };

        _db.Memories.Add(memory);
        couple.UsedStorageBytes += incomingBytes;
        await _db.SaveChangesAsync(ct);

        await _cache.RemoveAsync($"couple:{couple.Id}", ct);

        var user = await _db.Users.FindAsync([userId], ct);
        var uploaderName = user?.DisplayName ?? "Ẩn danh";

        var additionalUrls = mediaItems.Select(x => _storage.GetPublicUrl(x.StoragePath)).ToList();

        return ApiResponse<MemoryDto>.Ok(new MemoryDto(
            memory.Id, 
            primaryUrl, 
            memory.Caption, 
            memory.SortOrder, 
            memory.MimeType, 
            memory.CreatedAt, 
            uploaderName,
            additionalUrls));
    }

    public async Task<ApiResponse<string>> DeleteMemoryAsync(Guid memoryId, Guid userId, CancellationToken ct = default)
    {
        var memory = await _db.Memories.Include(m => m.Couple).FirstOrDefaultAsync(m => m.Id == memoryId, ct);
        if (memory == null) return ApiResponse<string>.Fail("Memory not found.");

        if (!await IsPartnerAsync(memory.CoupleId, userId, ct))
            return ApiResponse<string>.Fail("Access denied.");

        long freedBytes = 0;
        
        // Delete all files from S3
        if (!string.IsNullOrEmpty(memory.AdditionalMediaJson))
        {
            var extraMedia = System.Text.Json.JsonSerializer.Deserialize<List<MemoryMediaItem>>(memory.AdditionalMediaJson);
            if (extraMedia != null)
            {
                foreach (var media in extraMedia)
                {
                    await _storage.DeleteAsync(media.StoragePath, ct);
                    freedBytes += media.FileSizeBytes;
                }
            }
        }
        else if (!string.IsNullOrEmpty(memory.StoragePath))
        {
            await _storage.DeleteAsync(memory.StoragePath, ct);
            freedBytes += memory.FileSizeBytes;
        }

        if (memory.Couple != null)
        {
            memory.Couple.UsedStorageBytes -= freedBytes;
            if (memory.Couple.UsedStorageBytes < 0) memory.Couple.UsedStorageBytes = 0;
            await _cache.RemoveAsync($"couple:{memory.Couple.Id}", ct);
        }

        _db.Memories.Remove(memory);
        await _db.SaveChangesAsync(ct);

        return ApiResponse<string>.Ok("Đã xóa vĩnh viễn kỷ niệm và các tệp đính kèm.");
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

    public async Task<ApiResponse<MemoryDto>> UpdateMemoryWithFilesAsync(Guid memoryId, Guid userId, List<Microsoft.AspNetCore.Http.IFormFile>? newFiles, string? caption, CancellationToken ct = default)
    {
        var memory = await _db.Memories.Include(m => m.Couple).FirstOrDefaultAsync(m => m.Id == memoryId, ct);
        if (memory == null) return ApiResponse<MemoryDto>.Fail("Memory not found.");

        if (!await IsPartnerAsync(memory.CoupleId, userId, ct))
            return ApiResponse<MemoryDto>.Fail("Access denied.");

        if (caption != null) memory.Caption = caption.Length > 200 ? caption[..200] : caption;

        string primaryUrl = string.Empty;
        var additionalUrls = new List<string>();

        if (newFiles != null && newFiles.Count > 0)
        {
            var couple = memory.Couple;
            long incomingBytes = 0;
            foreach (var file in newFiles)
            {
                incomingBytes += file.Length;
                if (file.ContentType.StartsWith("video/") && file.Length > Constants.Album.MaxVideoFileSizeBytes)
                    return ApiResponse<MemoryDto>.Fail($"Kích thước video {file.FileName} vượt quá giới hạn 50MB.");
            }

            // Calculate freed bytes
            long freedBytes = 0;
            if (!string.IsNullOrEmpty(memory.AdditionalMediaJson))
            {
                var extraMedia = System.Text.Json.JsonSerializer.Deserialize<List<MemoryMediaItem>>(memory.AdditionalMediaJson);
                if (extraMedia != null)
                {
                    foreach (var media in extraMedia)
                    {
                        await _storage.DeleteAsync(media.StoragePath, ct);
                        freedBytes += media.FileSizeBytes;
                    }
                }
            }
            else if (!string.IsNullOrEmpty(memory.StoragePath))
            {
                await _storage.DeleteAsync(memory.StoragePath, ct);
                freedBytes += memory.FileSizeBytes;
            }

            if (couple != null)
            {
                couple.UsedStorageBytes = couple.UsedStorageBytes - freedBytes + incomingBytes;
                if (couple.UsedStorageBytes > Constants.Album.MaxStoragePerCoupleBytes)
                    return ApiResponse<MemoryDto>.Fail("Dung lượng lưu trữ của Couple đã vượt quá giới hạn 1GB.");
            }

            var mediaItems = new List<MemoryMediaItem>();

            for (int i = 0; i < newFiles.Count; i++)
            {
                var file = newFiles[i];
                var uploadResult = await _storage.UploadAsync(file, $"CoupleSpace/{memory.CoupleId}", ct);
                
                if (i == 0)
                {
                    primaryUrl = uploadResult.PublicUrl;
                }

                mediaItems.Add(new MemoryMediaItem
                {
                    StoragePath = uploadResult.StoragePath,
                    MimeType = file.ContentType,
                    OriginalFileName = file.FileName,
                    FileSizeBytes = file.Length
                });
            }

            var firstFile = newFiles[0];
            var firstUpload = mediaItems[0];

            memory.StoragePath = firstUpload.StoragePath;
            memory.OriginalFileName = firstFile.FileName;
            memory.MimeType = firstFile.ContentType;
            memory.FileSizeBytes = firstFile.Length;
            memory.AdditionalMediaJson = System.Text.Json.JsonSerializer.Serialize(mediaItems);

            additionalUrls = mediaItems.Select(x => _storage.GetPublicUrl(x.StoragePath)).ToList();
        }
        else
        {
            // Just return existing URLs if no new files
            if (!string.IsNullOrEmpty(memory.AdditionalMediaJson))
            {
                var extraMedia = System.Text.Json.JsonSerializer.Deserialize<List<MemoryMediaItem>>(memory.AdditionalMediaJson);
                if (extraMedia != null)
                {
                    additionalUrls = extraMedia.Select(x => _storage.GetPublicUrl(x.StoragePath)).ToList();
                    primaryUrl = additionalUrls.FirstOrDefault() ?? string.Empty;
                }
            }
            else
            {
                primaryUrl = _storage.GetPublicUrl(memory.StoragePath);
                additionalUrls.Add(primaryUrl);
            }
        }

        await _db.SaveChangesAsync(ct);
        if (memory.Couple != null) await _cache.RemoveAsync($"couple:{memory.Couple.Id}", ct);

        var user = await _db.Users.FindAsync([memory.UploadedByUserId], ct);
        var uploaderName = user?.DisplayName ?? "Ẩn danh";

        return ApiResponse<MemoryDto>.Ok(new MemoryDto(
            memory.Id, 
            primaryUrl, 
            memory.Caption, 
            memory.SortOrder, 
            memory.MimeType, 
            memory.CreatedAt, 
            uploaderName,
            additionalUrls));
    }

    private async Task<bool> IsPartnerAsync(Guid coupleId, Guid userId, CancellationToken ct)
    {
        return await _db.Keychains
            .IgnoreQueryFilters()
            .AnyAsync(k => k.CoupleId == coupleId && k.UserId == userId, ct);
    }
}

public record MemoryDto(Guid Id, string Url, string? Caption, int SortOrder, string MimeType, DateTime CreatedAt, string? UploadedBy, List<string>? AdditionalUrls = null);
