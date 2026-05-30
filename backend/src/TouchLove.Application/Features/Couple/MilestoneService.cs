using System;
using System.Collections.Generic;
using System.Linq;

namespace TouchLove.Application.Features.Couple;

public class MilestoneService
{
    public List<MilestoneInfo> GetUpcomingMilestones(DateTime startDate, int count = 100)
    {
        var today = DateTime.UtcNow.Date;
        var milestones = new List<MilestoneInfo>();

        // Month checkpoints
        int[] monthCheckpoints = { 1, 6 };
        foreach (var months in monthCheckpoints)
        {
            var targetDate = startDate.AddMonths(months).Date;
            milestones.Add(new MilestoneInfo
            {
                Title = $"{months} tháng yêu nhau",
                TargetDate = targetDate,
                DaysRemaining = Math.Max(0, (targetDate - today).Days),
                IsUnlocked = targetDate <= today,
                Type = "month"
            });
        }

        // Year checkpoints
        int[] yearCheckpoints = { 1, 2, 3, 4, 5, 10, 20, 30, 50 };
        foreach (var years in yearCheckpoints)
        {
            var targetDate = startDate.AddYears(years).Date;
            milestones.Add(new MilestoneInfo
            {
                Title = $"{years} năm yêu nhau",
                TargetDate = targetDate,
                DaysRemaining = Math.Max(0, (targetDate - today).Days),
                IsUnlocked = targetDate <= today,
                Type = "year"
            });
        }

        // Day checkpoints (100, 200, 300, 500, 1000, 2000, 3000)
        int[] dayCheckpoints = { 100, 200, 300, 500, 1000, 2000, 3000 };
        foreach (var days in dayCheckpoints)
        {
            var targetDate = startDate.AddDays(days).Date;
            milestones.Add(new MilestoneInfo
            {
                Title = $"{days} ngày bên nhau",
                TargetDate = targetDate,
                DaysRemaining = Math.Max(0, (targetDate - today).Days),
                IsUnlocked = targetDate <= today,
                Type = "day"
            });
        }

        return milestones
            .OrderBy(m => m.TargetDate)
            .ToList();
    }

    public MilestoneInfo? GetTodayMilestone(DateTime startDate)
    {
        var today = DateTime.UtcNow.Date;
        
        // Check days
        var daysTogether = (today - startDate.Date).Days;
        if (daysTogether > 0 && (daysTogether % 100 == 0 || daysTogether == 365))
        {
             return new MilestoneInfo { Title = $"{daysTogether} ngày bên nhau", TargetDate = today, DaysRemaining = 0, IsUnlocked = true, Type = "day" };
        }

        // Check years
        var years = today.Year - startDate.Year;
        if (years > 0 && startDate.AddYears(years).Date == today)
        {
            return new MilestoneInfo { Title = $"{years} năm kỷ niệm", TargetDate = today, DaysRemaining = 0, IsUnlocked = true, Type = "year" };
        }

        return null;
    }
}

public class MilestoneInfo
{
    public string Title { get; set; } = string.Empty;
    public DateTime TargetDate { get; set; }
    public int DaysRemaining { get; set; }
    public bool IsUnlocked { get; set; }
    public string Type { get; set; } = string.Empty;
}
