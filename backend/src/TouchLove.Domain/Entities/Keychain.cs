using TouchLove.Domain.Common;
using TouchLove.Domain.Enums;

namespace TouchLove.Domain.Entities;

public class Keychain : BaseEntity
{
    public string KeyId { get; set; } = string.Empty; // UUID ghi vào chip NFC
    public Guid? UserId { get; set; }                  // NULL khi chưa activate
    public Guid? CoupleId { get; set; }                // NULL khi chưa paired
    public KeychainStatus Status { get; set; } = KeychainStatus.Available;
    public DateTime? ActivatedAt { get; set; }
    public DateTime? RevokedAt { get; set; }

    // Navigation
    public User? User { get; set; }
    public Couple? Couple { get; set; }
}
