namespace TouchLove.Domain.Entities;

public class PairingInvitation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid InitiatorKeychainId { get; set; }
    public string InviteCode { get; set; } = string.Empty; // 6 chars, no 0/O/I/1
    public DateTime ExpiresAt { get; set; }
    public bool IsUsed { get; set; } = false;
    public Guid? UsedByKeychainId { get; set; }
    /// <summary>Partner B submitted the code; waiting for initiator (A) to confirm.</summary>
    public bool IsPendingConfirmation { get; set; } = false;
    public DateTime? RequestedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Keychain? InitiatorKeychain { get; set; }
    public Keychain? UsedByKeychain { get; set; }
}
