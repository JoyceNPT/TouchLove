using Microsoft.EntityFrameworkCore;
using TouchLove.Application.Interfaces;
using TouchLove.Domain.Entities;
using TouchLove.Domain.Enums;
using TouchLove.Shared;
using TouchLove.Application.Features.Couple;

namespace TouchLove.Application.Features.Message;

public class MessageService
{
    private readonly IApplicationDbContext _db;
    private readonly ICacheService _cache;
    private readonly IAiMessageService _ai;
    private readonly MilestoneService _milestone;

    public MessageService(IApplicationDbContext db, ICacheService cache, IAiMessageService ai, MilestoneService milestone)
    {
        _db = db;
        _cache = cache;
        _ai = ai;
        _milestone = milestone;
    }

    // ─── Today's message (on-demand, cached) ─────────────────────────
    public async Task<ApiResponse<MessageDto>> GetTodayMessageAsync(string coupleSlug, CancellationToken ct = default)
    {
        var couple = await _db.Couples.FirstOrDefaultAsync(c => c.CoupleSlug == coupleSlug && c.IsActive, ct);
        if (couple == null) return ApiResponse<MessageDto>.Fail("Couple not found.");

        var cacheKey = $"msg-today:{couple.Id}";
        var cached = await _cache.GetAsync<MessageDto>(cacheKey, ct);
        if (cached != null) return ApiResponse<MessageDto>.Ok(cached);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var existing = await _db.DailyMessages
            .FirstOrDefaultAsync(m => m.CoupleId == couple.Id && m.MessageDate == today, ct);

        if (existing != null)
        {
            var dto = MapToDto(existing);
            await _cache.SetAsync(cacheKey, dto, TimeSpan.FromMinutes(Constants.Cache.TodayMessageMinutes), ct);
            return ApiResponse<MessageDto>.Ok(dto);
        }

        // Generate on-demand
        var generated = await GenerateMessageForCoupleAsync(couple, today, ct);
        await _cache.SetAsync(cacheKey, MapToDto(generated), TimeSpan.FromMinutes(Constants.Cache.TodayMessageMinutes), ct);
        return ApiResponse<MessageDto>.Ok(MapToDto(generated));
    }

    // ─── History ─────────────────────────────────────────────────────
    public async Task<ApiResponse<List<MessageDto>>> GetHistoryAsync(Guid coupleId, Guid userId, int days, CancellationToken ct = default)
    {
        if (!await IsPartnerAsync(coupleId, userId, ct))
            return ApiResponse<List<MessageDto>>.Fail("Access denied.");

        var since = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-days));
        var messages = await _db.DailyMessages
            .Where(m => m.CoupleId == coupleId && m.MessageDate >= since)
            .OrderByDescending(m => m.MessageDate)
            .Select(m => new MessageDto(m.Id, m.Content, m.MessageDate, m.Source, m.IsBookmarked))
            .ToListAsync(ct);

        return ApiResponse<List<MessageDto>>.Ok(messages);
    }

    // ─── Bookmark Toggle ─────────────────────────────────────────────
    public async Task<ApiResponse<string>> ToggleBookmarkAsync(Guid messageId, Guid userId, CancellationToken ct = default)
    {
        var message = await _db.DailyMessages.FirstOrDefaultAsync(m => m.Id == messageId, ct);
        if (message == null) return ApiResponse<string>.Fail("Message not found.");

        if (!await IsPartnerAsync(message.CoupleId, userId, ct))
            return ApiResponse<string>.Fail("Access denied.");

        if (!message.IsBookmarked)
        {
            var bookmarkCount = await _db.DailyMessages
                .CountAsync(m => m.CoupleId == message.CoupleId && m.IsBookmarked, ct);
            if (bookmarkCount >= Constants.Message.MaxBookmarksPerCouple)
                return ApiResponse<string>.Fail($"Maximum {Constants.Message.MaxBookmarksPerCouple} bookmarks allowed.");
        }

        message.IsBookmarked = !message.IsBookmarked;
        await _db.SaveChangesAsync(ct);

        return ApiResponse<string>.Ok(message.IsBookmarked ? "Bookmarked!" : "Bookmark removed.");
    }

    // ─── Generate for Hangfire Job ────────────────────────────────────
    public async Task GenerateForAllActiveCouplesAsync(CancellationToken ct = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var activeCouples = await _db.Couples
            .Where(c => c.IsActive)
            .ToListAsync(ct);

        foreach (var couple in activeCouples)
        {
            var exists = await _db.DailyMessages.AnyAsync(m => m.CoupleId == couple.Id && m.MessageDate == today, ct);
            if (exists) continue;

            await GenerateMessageForCoupleAsync(couple, today, ct);
            await _cache.RemoveAsync($"msg-today:{couple.Id}", ct);
        }
    }

    // ─── Internal ─────────────────────────────────────────────────────
    private async Task<DailyMessage> GenerateMessageForCoupleAsync(Domain.Entities.Couple couple, DateOnly date, CancellationToken ct)
    {
        var usedTemplateIds = await _db.DailyMessages
            .Where(m => m.CoupleId == couple.Id && m.TemplateId != null
                     && m.MessageDate >= date.AddDays(-Constants.Message.TemplateExclusionDays))
            .Select(m => m.TemplateId!.Value)
            .ToListAsync(ct);

        var availableTemplates = await _db.MessageTemplates
            .Where(t => t.Status == TemplateStatus.Published && !usedTemplateIds.Contains(t.Id))
            .ToListAsync(ct);

        DailyMessage message;

        if (availableTemplates.Count > 0)
        {
            var template = availableTemplates[Random.Shared.Next(availableTemplates.Count)];
            message = new DailyMessage
            {
                CoupleId = couple.Id,
                TemplateId = template.Id,
                Content = template.Content,
                MessageDate = date,
                Source = MessageSource.Template
            };
        }
        else
        {
            // Try AI
            var days = date.DayNumber - couple.StartDate.DayNumber;
            var milestone = _milestone.GetTodayMilestone(couple.StartDate.ToDateTime(TimeOnly.MinValue));
            var promptContext = milestone != null ? $"Hôm nay là kỷ niệm {milestone.Title}." : string.Empty;
            
            var aiContent = await _ai.GenerateAsync(couple.CoupleName ?? "cặp đôi", days, ct, promptContext);

            if (aiContent != null)
            {
                message = new DailyMessage
                {
                    CoupleId = couple.Id,
                    Content = aiContent,
                    MessageDate = date,
                    Source = MessageSource.AI
                };
            }
            else
            {
                // Fallback: any published template
                var fallback = await _db.MessageTemplates
                    .Where(t => t.Status == TemplateStatus.Published)
                    .OrderBy(_ => Guid.NewGuid())
                    .FirstOrDefaultAsync(ct);

                message = new DailyMessage
                {
                    CoupleId = couple.Id,
                    TemplateId = fallback?.Id,
                    Content = fallback?.Content ?? "Yêu em mỗi ngày một chút hơn 💕",
                    MessageDate = date,
                    Source = MessageSource.Template
                };
            }
        }

        _db.DailyMessages.Add(message);
        await _db.SaveChangesAsync(ct);
        return message;
    }

    private async Task<bool> IsPartnerAsync(Guid coupleId, Guid userId, CancellationToken ct) =>
        await _db.Keychains.IgnoreQueryFilters().AnyAsync(k => k.CoupleId == coupleId && k.UserId == userId, ct);

    private static MessageDto MapToDto(DailyMessage m) =>
        new(m.Id, m.Content, m.MessageDate, m.Source, m.IsBookmarked);
}

public record MessageDto(Guid Id, string Content, DateOnly Date, MessageSource Source, bool IsBookmarked);
