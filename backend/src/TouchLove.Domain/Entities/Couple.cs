using TouchLove.Domain.Common;

namespace TouchLove.Domain.Entities;

public class Couple : BaseEntity
{
    public Guid KeychainAId { get; set; }               // Partner A (người tạo invitation)
    public Guid KeychainBId { get; set; }               // Partner B (người nhập code)
    public string CoupleSlug { get; set; } = string.Empty; // unique, partial index IsDeleted=false
    public string? CoupleName { get; set; }
    public DateOnly StartDate { get; set; }             // Ngày bắt đầu yêu
    public string? Description { get; set; }
    public string? AvatarAUrl { get; set; }
    public string? AvatarBUrl { get; set; }
    public int NfcScanCount { get; set; } = 0;          // Denormalized
    public bool IsActive { get; set; } = true;
    public DateTime PairedAt { get; set; }
    public DateTime? UnpairedAt { get; set; }

    // Navigation
    public Keychain? KeychainA { get; set; }
    public Keychain? KeychainB { get; set; }
    public ICollection<Memory> Memories { get; set; } = [];
    public ICollection<DailyMessage> DailyMessages { get; set; } = [];
    public ICollection<NfcScanLog> NfcScanLogs { get; set; } = [];
    public ICollection<UnpairRequest> UnpairRequests { get; set; } = [];
}
