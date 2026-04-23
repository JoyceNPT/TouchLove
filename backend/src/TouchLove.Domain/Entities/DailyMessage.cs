using TouchLove.Domain.Enums;

namespace TouchLove.Domain.Entities;

public class DailyMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CoupleId { get; set; }
    public Guid? TemplateId { get; set; }               // NULL if AI generated
    public string Content { get; set; } = string.Empty; // Full text, preserved even if template archived
    public DateOnly MessageDate { get; set; }            // UNIQUE(CoupleId, MessageDate)
    public MessageSource Source { get; set; }
    public bool IsBookmarked { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Couple? Couple { get; set; }
    public MessageTemplate? Template { get; set; }
}
