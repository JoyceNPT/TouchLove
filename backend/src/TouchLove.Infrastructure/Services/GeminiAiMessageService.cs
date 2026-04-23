using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text;
using System.Text.Json;
using TouchLove.Application.Interfaces;

namespace TouchLove.Infrastructure.Services;

public class GeminiAiMessageService : IAiMessageService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;
    private readonly ILogger<GeminiAiMessageService> _logger;

    public GeminiAiMessageService(HttpClient httpClient, IConfiguration config, ILogger<GeminiAiMessageService> logger)
    {
        _httpClient = httpClient;
        _config = config;
        _logger = logger;
    }

    public async Task<string?> GenerateAsync(string coupleName, int daysTogether, CancellationToken ct = default)
    {
        var apiKey = _config["Gemini:ApiKey"];
        if (string.IsNullOrEmpty(apiKey))
        {
            _logger.LogWarning("Gemini API key not configured. Returning null.");
            return null;
        }

        try
        {
            var prompt = $"Tạo một thông điệp tình cảm ngắn gọn (2-3 câu, tiếng Việt) cho cặp đôi tên {coupleName}, đã yêu nhau {daysTogether} ngày. Lãng mạn, ấm áp, chân thật, không sáo rỗng.";

            var requestBody = new
            {
                contents = new[]
                {
                    new { parts = new[] { new { text = prompt } } }
                },
                generationConfig = new
                {
                    temperature = 0.9,
                    maxOutputTokens = 200
                }
            };

            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={apiKey}";
            var response = await _httpClient.PostAsync(url,
                new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json"), ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Gemini API returned {StatusCode}", response.StatusCode);
                return null;
            }

            var json = await response.Content.ReadAsStringAsync(ct);
            using var doc = JsonDocument.Parse(json);
            var text = doc.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            return text?.Trim();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate AI message for couple {CoupleName}", coupleName);
            return null;
        }
    }
}
