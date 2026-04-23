namespace TouchLove.Domain.Common;

public abstract class BaseTokenEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
