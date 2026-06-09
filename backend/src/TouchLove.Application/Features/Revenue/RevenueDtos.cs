using System;
using System.Collections.Generic;

namespace TouchLove.Application.Features.Revenue;

public record RevenueFilterRequest(DateTime? StartDate, DateTime? EndDate);

public record RevenueReportSummary(
    decimal GrossRevenue,      // Tổng tiền bán hàng (sau khi trừ voucher)
    decimal TotalCostOfGoods,  // Tổng giá vốn (dựa trên CostPrice snapshot)
    decimal GrossProfit,       // Lợi nhuận gộp = GrossRevenue - TotalCostOfGoods
    decimal ProfitMargin,      // Biên lợi nhuận (%)
    int TotalOrders,           // Số đơn hoàn thành
    int TotalProductsSold      // Tổng số sản phẩm bán ra
);

public record RevenueOrderDetailDto(
    Guid OrderId,
    string OrderNumber,
    string CustomerName,
    DateTime CompletedAt,
    decimal TotalOrderValue,
    decimal VoucherDiscount,
    decimal NetRevenue,
    decimal TotalCost,
    decimal Profit
);

public record VoucherEffectivenessDto(
    string VoucherCode,
    int TimesUsed,
    decimal TotalDiscountGiven,
    decimal TotalRevenueGenerated
);

public record MonthlyRevenueDto(
    string MonthYear,
    decimal Revenue,
    decimal Profit,
    int OrdersCount
);

public record FullRevenueReport(
    RevenueReportSummary Summary,
    List<RevenueOrderDetailDto> OrderDetails,
    List<VoucherEffectivenessDto> VoucherEffectiveness,
    List<MonthlyRevenueDto> MonthlyBreakdown
);
