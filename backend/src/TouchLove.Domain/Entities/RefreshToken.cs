using TouchLove.Domain.Common;

namespace TouchLove.Domain.Entities;

public class RefreshToken : BaseTokenEntity
{
    public Guid UserId { get; set; }
    public string TokenHash { get; set; } = string.Empty; // SHA-256
    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; } = false;
    public DateTime? RevokedAt { get; set; }
    public Guid? ReplacedByTokenId { get; set; } // rotation chain tracking

    // Navigation
    public User? User { get; set; }
}
