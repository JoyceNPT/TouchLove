namespace TouchLove.Domain.Entities;

/// <summary>
/// Append-only log. NEVER update or delete records.
/// Retention: kept for 1 year, cleaned by Hangfire weekly.
/// </summary>
public class NfcScanLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? CoupleId { get; set; }
    public Guid KeychainId { get; set; }
    public DateTime ScannedAt { get; set; } = DateTime.UtcNow;
    public string? UserAgent { get; set; }
    public string? IpAddress { get; set; }

    // Navigation
    public Couple? Couple { get; set; }
    public Keychain? Keychain { get; set; }
}
