using TouchLove.Domain.Common;
using TouchLove.Domain.Enums;

namespace TouchLove.Domain.Entities;

public class MessageTemplate : BaseEntity
{
    public string Content { get; set; } = string.Empty;
    public string Language { get; set; } = "vi";               // vi / en
    public string? Category { get; set; }                       // romantic, funny, poetic...
    public TemplateStatus Status { get; set; } = TemplateStatus.Draft;
    public Guid CreatedByAdminId { get; set; }
    public DateTime? PublishedAt { get; set; }

    // Navigation
    public User? CreatedByAdmin { get; set; }
}
