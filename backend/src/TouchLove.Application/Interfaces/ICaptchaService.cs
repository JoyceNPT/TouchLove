namespace TouchLove.Application.Interfaces;

public interface ICaptchaService
{
    Task<bool> VerifyAsync(string token, CancellationToken ct = default);
}
