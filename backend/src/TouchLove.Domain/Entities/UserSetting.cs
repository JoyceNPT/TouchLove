namespace TouchLove.Domain.Entities;

public class UserSetting
{
    public Guid UserId { get; set; }
    public bool EmailNotifEnabled { get; set; } = true;
    public bool AnnivNotifEnabled { get; set; } = true;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User? User { get; set; }
}
