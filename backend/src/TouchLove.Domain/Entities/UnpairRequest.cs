namespace TouchLove.Domain.Entities;

/// <summary>
/// Tracks 2-step unpair consent process.
/// Created when Partner A requests unpair.
/// Completed when Partner B confirms.
/// </summary>
public class UnpairRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CoupleId { get; set; }
    public Guid RequestedByKeychainId { get; set; }     // Partner A
    public Guid? ConfirmedByKeychainId { get; set; }    // Partner B (null until confirmed)
    public bool IsCompleted { get; set; } = false;
    public bool IsCancelled { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public DateTime ExpiresAt { get; set; }             // Auto-expire in 48h if not confirmed

    // Navigation
    public Couple? Couple { get; set; }
    public Keychain? RequestedByKeychain { get; set; }
    public Keychain? ConfirmedByKeychain { get; set; }
}
