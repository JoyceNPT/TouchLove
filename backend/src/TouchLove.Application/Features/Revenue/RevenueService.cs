using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using TouchLove.Application.Interfaces;
using TouchLove.Domain.Enums;
using TouchLove.Shared;

namespace TouchLove.Application.Features.Revenue;

public class RevenueService : IRevenueService
{
    private readonly IApplicationDbContext _db;

    public RevenueService(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<FullRevenueReport>> GetFullRevenueReportAsync(RevenueFilterRequest req, CancellationToken ct = default)
    {
        try
        {
            var query = _db.Orders
                .Include(o => o.Items)
                .Where(o => 
                    (o.PaymentMethod == "QR" && o.PaymentStatus == PaymentStatus.Paid) ||
                    (o.PaymentMethod == "COD" && o.Status == OrderStatus.Completed)
                );

        if (req.StartDate.HasValue)
            query = query.Where(o => o.CreatedAt >= req.StartDate.Value);
        if (req.EndDate.HasValue)
            query = query.Where(o => o.CreatedAt <= req.EndDate.Value);

        var orders = await query.ToListAsync(ct);
        var orderIds = orders.Select(o => o.Id).ToList();

        // Get Vouchers
        var redemptions = await _db.VoucherRedemptions
            .Include(vr => vr.Voucher)
            .Where(vr => orderIds.Contains(vr.OrderId))
            .ToListAsync(ct);

        var redemptionsDict = redemptions
            .GroupBy(vr => vr.OrderId)
            .ToDictionary(g => g.Key, g => g.First());

        decimal totalGrossRevenue = 0;
        decimal totalCostOfGoods = 0;
        int totalProductsSold = 0;

        var orderDetails = new List<RevenueOrderDetailDto>();

        foreach (var order in orders)
        {
            decimal orderCost = order.Items.Sum(i => i.CostPrice * i.Quantity);
            decimal voucherDiscount = redemptionsDict.ContainsKey(order.Id) ? redemptionsDict[order.Id].DiscountApplied : 0;
            
            // TotalAmount in Order is already Net Revenue (after discount)
            decimal netRevenue = order.TotalAmount; 
            decimal profit = netRevenue - orderCost;

            totalGrossRevenue += netRevenue;
            totalCostOfGoods += orderCost;
            totalProductsSold += order.Items.Sum(i => i.Quantity);

            orderDetails.Add(new RevenueOrderDetailDto(
                order.Id,
                order.OrderNumber,
                order.ShippingFullName,
                order.CreatedAt, // We use CreatedAt as CompletedAt is not in Order model explicitly
                netRevenue + voucherDiscount, // Gross order value before discount
                voucherDiscount,
                netRevenue,
                orderCost,
                profit
            ));
        }

        decimal grossProfit = totalGrossRevenue - totalCostOfGoods;
        decimal profitMargin = totalGrossRevenue > 0 ? (grossProfit / totalGrossRevenue) * 100 : 0;

        var summary = new RevenueReportSummary(
            totalGrossRevenue,
            totalCostOfGoods,
            grossProfit,
            profitMargin,
            orders.Count,
            totalProductsSold
        );

        // Voucher Effectiveness
        var voucherStats = redemptions
            .GroupBy(vr => vr.Voucher?.Code ?? "UNKNOWN")
            .Select(g => {
                var relatedOrders = orders.Where(o => g.Select(x => x.OrderId).Contains(o.Id));
                return new VoucherEffectivenessDto(
                    g.Key,
                    g.Count(),
                    g.Sum(x => x.DiscountApplied),
                    relatedOrders.Sum(o => o.TotalAmount)
                );
            })
            .ToList();

        // Monthly Breakdown
        var monthlyStats = orders
            .GroupBy(o => new { o.CreatedAt.Year, o.CreatedAt.Month })
            .Select(g => {
                var monthOrders = g.ToList();
                decimal monthRevenue = monthOrders.Sum(o => o.TotalAmount);
                decimal monthCost = monthOrders.Sum(o => o.Items.Sum(i => i.CostPrice * i.Quantity));
                return new MonthlyRevenueDto(
                    $"{g.Key.Month:D2}/{g.Key.Year}",
                    monthRevenue,
                    monthRevenue - monthCost,
                    monthOrders.Count
                );
            })
            .OrderBy(x => x.MonthYear)
            .ToList();

            var report = new FullRevenueReport(summary, orderDetails, voucherStats, monthlyStats);
            return ApiResponse<FullRevenueReport>.Ok(report);
        }
        catch (Exception ex)
        {
            return ApiResponse<FullRevenueReport>.Fail($"Error: {ex.Message} | StackTrace: {ex.StackTrace}");
        }
    }
}
