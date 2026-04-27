using System;
using System.Collections.Generic;
using System.Linq;

namespace TouchLove.Application.Features.Couple;

public class MilestoneService
{
    public List<MilestoneInfo> GetUpcomingMilestones(DateTime startDate, int count = 3)
    {
        var today = DateTime.UtcNow.Date;
        var milestones = new List<MilestoneInfo>();

        // Days milestones (100, 200, 300, 500, 1000)
        int[] dayCheckpoints = { 100, 200, 365, 500, 730, 1000, 2000 };
        foreach (var days in dayCheckpoints)
        {
            var targetDate = startDate.AddDays(days);
            if (targetDate >= today)
            {
                milestones.Add(new MilestoneInfo
                {
                    Title = $"{days} ngày bên nhau",
                    TargetDate = targetDate,
                    DaysRemaining = (targetDate - today).Days
                });
            }
        }

        // Year milestones
        for (int year = 1; year <= 50; year++)
        {
            var targetDate = startDate.AddYears(year);
            if (targetDate >= today)
            {
                milestones.Add(new MilestoneInfo
                {
                    Title = $"{year} năm kỷ niệm",
                    TargetDate = targetDate,
                    DaysRemaining = (targetDate - today).Days
                });
            }
        }

        return milestones
            .OrderBy(m => m.TargetDate)
            .Take(count)
            .ToList();
    }

    public MilestoneInfo? GetTodayMilestone(DateTime startDate)
    {
        var today = DateTime.UtcNow.Date;
        
        // Check days
        var daysTogether = (today - startDate.Date).Days;
        if (daysTogether > 0 && (daysTogether % 100 == 0 || daysTogether == 365))
        {
             return new MilestoneInfo { Title = $"{daysTogether} ngày bên nhau", TargetDate = today, DaysRemaining = 0 };
        }

        // Check years
        var years = today.Year - startDate.Year;
        if (years > 0 && startDate.AddYears(years).Date == today)
        {
            return new MilestoneInfo { Title = $"{years} năm kỷ niệm", TargetDate = today, DaysRemaining = 0 };
        }

        return null;
    }
}

public class MilestoneInfo
{
    public string Title { get; set; } = string.Empty;
    public DateTime TargetDate { get; set; }
    public int DaysRemaining { get; set; }
}
