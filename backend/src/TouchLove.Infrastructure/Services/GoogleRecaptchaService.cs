using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Net.Http.Json;
using TouchLove.Application.Interfaces;

namespace TouchLove.Infrastructure.Services;

public class GoogleRecaptchaService : ICaptchaService
{
    private readonly IConfiguration _config;
    private readonly HttpClient _httpClient;
    private readonly IHostEnvironment _env;
    private readonly ILogger<GoogleRecaptchaService> _logger;

    public GoogleRecaptchaService(IConfiguration config, HttpClient httpClient, IHostEnvironment env, ILogger<GoogleRecaptchaService> logger)
    {
        _config = config;
        _httpClient = httpClient;
        _env = env;
        _logger = logger;
    }

    public async Task<bool> VerifyAsync(string token, CancellationToken ct = default)
    {
        // Bypass in Development environment
        if (_env.IsDevelopment())
        {
            _logger.LogDebug("reCAPTCHA bypassed in Development");
            return true;
        }

        if (string.IsNullOrEmpty(token)) return false;

        var secretKey = _config["Recaptcha:SecretKey"];
        var response = await _httpClient.PostAsync(
            "https://www.google.com/recaptcha/api/siteverify",
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                { "secret", secretKey ?? "" },
                { "response", token }
            }), ct);

        var json = await response.Content.ReadFromJsonAsync<RecaptchaResponse>(cancellationToken: ct);
        return json?.Success == true && json.Score >= 0.5f;
    }

    private record RecaptchaResponse(bool Success, float Score, string? Action);
}
