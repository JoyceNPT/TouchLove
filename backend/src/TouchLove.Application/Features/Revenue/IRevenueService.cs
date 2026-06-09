using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using TouchLove.Shared;

namespace TouchLove.Application.Features.Revenue;

public interface IRevenueService
{
    Task<ApiResponse<FullRevenueReport>> GetFullRevenueReportAsync(RevenueFilterRequest req, CancellationToken ct = default);
}
