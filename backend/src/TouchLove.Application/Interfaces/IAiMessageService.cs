namespace TouchLove.Application.Interfaces;

public interface IAiMessageService
{
    /// <summary>
    /// Generate a romantic daily message for a couple.
    /// </summary>
    /// <param name="coupleName">Name of the couple (e.g., "An & Bình")</param>
    /// <param name="daysTogether">Number of days they've been together</param>
    Task<string?> GenerateAsync(string coupleName, int daysTogether, CancellationToken ct = default);
}
