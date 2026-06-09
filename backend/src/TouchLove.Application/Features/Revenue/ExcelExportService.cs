using OfficeOpenXml;
using OfficeOpenXml.Style;
using System.IO;

namespace TouchLove.Application.Features.Revenue;

public class ExcelExportService
{
    public ExcelExportService()
    {
        ExcelPackage.License.SetNonCommercial();
    }

    public byte[] GenerateRevenueExcel(FullRevenueReport report)
    {
        using var package = new ExcelPackage();

        // Sheet 1: Summary
        var wsSummary = package.Workbook.Worksheets.Add("Tổng quan");
        wsSummary.Cells["A1:B1"].Merge = true;
        wsSummary.Cells["A1"].Value = "BÁO CÁO DOANH THU";
        wsSummary.Cells["A1"].Style.Font.Size = 16;
        wsSummary.Cells["A1"].Style.Font.Bold = true;
        wsSummary.Cells["A1"].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

        wsSummary.Cells["A3"].Value = "Tổng Doanh Thu (VNĐ):";
        wsSummary.Cells["B3"].Value = report.Summary.GrossRevenue;
        
        wsSummary.Cells["A4"].Value = "Tổng Giá Vốn (VNĐ):";
        wsSummary.Cells["B4"].Value = report.Summary.TotalCostOfGoods;

        wsSummary.Cells["A5"].Value = "Lợi Nhuận Gộp (VNĐ):";
        wsSummary.Cells["B5"].Value = report.Summary.GrossProfit;

        wsSummary.Cells["A6"].Value = "Biên Lợi Nhuận (%):";
        wsSummary.Cells["B6"].Value = report.Summary.ProfitMargin / 100;
        wsSummary.Cells["B6"].Style.Numberformat.Format = "0.00%";

        wsSummary.Cells["A7"].Value = "Số Đơn Hàng:";
        wsSummary.Cells["B7"].Value = report.Summary.TotalOrders;

        wsSummary.Cells["A8"].Value = "Sản Phẩm Đã Bán:";
        wsSummary.Cells["B8"].Value = report.Summary.TotalProductsSold;

        wsSummary.Cells["A3:A8"].Style.Font.Bold = true;
        wsSummary.Cells["B3:B5"].Style.Numberformat.Format = "#,##0";
        wsSummary.Cells.AutoFitColumns();

        // Sheet 2: Chi tiết đơn hàng
        var wsOrders = package.Workbook.Worksheets.Add("Chi tiết đơn hàng");
        var orderHeaders = new[] { "Mã Đơn", "Khách Hàng", "Ngày Hoàn Thành", "Tổng Tiền Hàng", "Voucher Giảm", "Doanh Thu Thực", "Giá Vốn", "Lợi Nhuận" };
        for (int i = 0; i < orderHeaders.Length; i++)
        {
            wsOrders.Cells[1, i + 1].Value = orderHeaders[i];
            wsOrders.Cells[1, i + 1].Style.Font.Bold = true;
            wsOrders.Cells[1, i + 1].Style.Fill.PatternType = ExcelFillStyle.Solid;
            wsOrders.Cells[1, i + 1].Style.Fill.BackgroundColor.SetColor(ExcelIndexedColor.Indexed22);
        }

        int row = 2;
        foreach (var o in report.OrderDetails)
        {
            wsOrders.Cells[row, 1].Value = o.OrderNumber;
            wsOrders.Cells[row, 2].Value = o.CustomerName;
            wsOrders.Cells[row, 3].Value = o.CompletedAt.ToString("dd/MM/yyyy HH:mm");
            wsOrders.Cells[row, 4].Value = o.TotalOrderValue;
            wsOrders.Cells[row, 5].Value = o.VoucherDiscount;
            wsOrders.Cells[row, 6].Value = o.NetRevenue;
            wsOrders.Cells[row, 7].Value = o.TotalCost;
            wsOrders.Cells[row, 8].Value = o.Profit;
            row++;
        }
        wsOrders.Cells[2, 4, row, 8].Style.Numberformat.Format = "#,##0";
        wsOrders.Cells.AutoFitColumns();

        // Sheet 3: Vouchers
        var wsVoucher = package.Workbook.Worksheets.Add("Hiệu quả Voucher");
        var vHeaders = new[] { "Mã Voucher", "Số Lần Dùng", "Tổng Giảm Giá", "Doanh Thu Mang Lại" };
        for (int i = 0; i < vHeaders.Length; i++)
        {
            wsVoucher.Cells[1, i + 1].Value = vHeaders[i];
            wsVoucher.Cells[1, i + 1].Style.Font.Bold = true;
            wsVoucher.Cells[1, i + 1].Style.Fill.PatternType = ExcelFillStyle.Solid;
            wsVoucher.Cells[1, i + 1].Style.Fill.BackgroundColor.SetColor(ExcelIndexedColor.Indexed22);
        }

        row = 2;
        foreach (var v in report.VoucherEffectiveness)
        {
            wsVoucher.Cells[row, 1].Value = v.VoucherCode;
            wsVoucher.Cells[row, 2].Value = v.TimesUsed;
            wsVoucher.Cells[row, 3].Value = v.TotalDiscountGiven;
            wsVoucher.Cells[row, 4].Value = v.TotalRevenueGenerated;
            row++;
        }
        wsVoucher.Cells[2, 3, row, 4].Style.Numberformat.Format = "#,##0";
        wsVoucher.Cells.AutoFitColumns();

        // Sheet 4: Theo tháng
        var wsMonthly = package.Workbook.Worksheets.Add("Theo tháng");
        var mHeaders = new[] { "Tháng", "Doanh Thu", "Lợi Nhuận", "Số Đơn" };
        for (int i = 0; i < mHeaders.Length; i++)
        {
            wsMonthly.Cells[1, i + 1].Value = mHeaders[i];
            wsMonthly.Cells[1, i + 1].Style.Font.Bold = true;
            wsMonthly.Cells[1, i + 1].Style.Fill.PatternType = ExcelFillStyle.Solid;
            wsMonthly.Cells[1, i + 1].Style.Fill.BackgroundColor.SetColor(ExcelIndexedColor.Indexed22);
        }

        row = 2;
        foreach (var m in report.MonthlyBreakdown)
        {
            wsMonthly.Cells[row, 1].Value = m.MonthYear;
            wsMonthly.Cells[row, 2].Value = m.Revenue;
            wsMonthly.Cells[row, 3].Value = m.Profit;
            wsMonthly.Cells[row, 4].Value = m.OrdersCount;
            row++;
        }
        wsMonthly.Cells[2, 2, row, 3].Style.Numberformat.Format = "#,##0";
        wsMonthly.Cells.AutoFitColumns();

        return package.GetAsByteArray();
    }
}
