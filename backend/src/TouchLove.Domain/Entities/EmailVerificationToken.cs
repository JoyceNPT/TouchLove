using TouchLove.Domain.Common;

namespace TouchLove.Domain.Entities;

public class EmailVerificationToken : BaseTokenEntity
{
    public Guid UserId { get; set; }
    public string TokenHash { get; set; } = string.Empty; // SHA-256
    public DateTime ExpiresAt { get; set; }
    public bool IsUsed { get; set; } = false;

    // Navigation
    public User? User { get; set; }
}
