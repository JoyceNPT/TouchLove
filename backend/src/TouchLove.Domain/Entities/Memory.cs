using TouchLove.Domain.Common;
using TouchLove.Domain.Enums;

namespace TouchLove.Domain.Entities;

public class Memory : BaseEntity
{
    public Guid CoupleId { get; set; }
    public Guid UploadedByUserId { get; set; }
    public string StoragePath { get; set; } = string.Empty; // relative path or storage key
    public StorageType StorageType { get; set; } = StorageType.Local;
    public string OriginalFileName { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;     // image/jpeg, image/png, image/webp
    public long FileSizeBytes { get; set; }
    public string? Caption { get; set; }
    public int SortOrder { get; set; } = 0;
    public DateTime? DeleteScheduledAt { get; set; }          // Hangfire hard delete time

    // Navigation
    public Couple? Couple { get; set; }
    public User? UploadedByUser { get; set; }
}
