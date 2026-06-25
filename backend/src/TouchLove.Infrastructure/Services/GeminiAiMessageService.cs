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

    public async Task<string?> GenerateAsync(string coupleName, int daysTogether, CancellationToken ct = default, string? context = null)
    {
        var apiKey = _config["Gemini:ApiKey"]?.Trim();
        if (string.IsNullOrEmpty(apiKey))
        {
            _logger.LogWarning("Gemini API key not configured. Returning null.");
            return null;
        }

        try
        {
            var prompt = $"Viết duy nhất 1 câu văn lãng mạn, thật ngắn gọn để làm thông điệp tình yêu mỗi ngày. {context} Yêu cầu: Viết trực tiếp nội dung câu nói. Không chào hỏi, không giải thích.";

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

            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={apiKey}";
            
            var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            var response = await _httpClient.PostAsync(url,
                new StringContent(JsonSerializer.Serialize(requestBody, options), Encoding.UTF8, "application/json"), ct);

            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(ct);
                _logger.LogError("Gemini API returned {StatusCode}: {Body}", response.StatusCode, body);
                return null;
            }

            var json = await response.Content.ReadAsStringAsync(ct);
            try
            {
                using var doc = JsonDocument.Parse(json);
                if (doc.RootElement.TryGetProperty("candidates", out var candidates) &&
                    candidates.GetArrayLength() > 0 &&
                    candidates[0].TryGetProperty("content", out var content) &&
                    content.TryGetProperty("parts", out var parts) &&
                    parts.GetArrayLength() > 0)
                {
                    var sb = new StringBuilder();
                    foreach (var part in parts.EnumerateArray())
                    {
                        if (part.TryGetProperty("text", out var textProp))
                        {
                            sb.Append(textProp.GetString());
                        }
                    }
                    return sb.ToString().Trim();
                }
                else
                {
                    _logger.LogWarning("Unexpected Gemini response format: {Json}", json);
                    return null;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to parse Gemini JSON: {Json}", json);
                return null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to call Gemini API for couple {CoupleName}", coupleName);
            return null;
        }
    }
}
