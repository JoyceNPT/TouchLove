using TouchLove.Domain.Common;

namespace TouchLove.Domain.Entities;

public class AppPolicy : BaseEntity
{
    public string Code { get; set; } = string.Empty; // e.g. TERMS, PRIVACY
    public string Language { get; set; } = "vi"; // e.g. vi, en
    public string Content { get; set; } = string.Empty;
}
