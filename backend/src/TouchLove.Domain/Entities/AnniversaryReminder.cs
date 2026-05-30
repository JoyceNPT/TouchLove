using TouchLove.Domain.Common;

namespace TouchLove.Domain.Entities;

public class AnniversaryReminder : BaseEntity
{
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateOnly Date { get; set; }
    public bool IsRecurring { get; set; } = true;

    // Navigation
    public User? User { get; set; }
}
