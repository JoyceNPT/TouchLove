using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace TouchLove.API.Hubs;

public class CoupleHub : Hub
{
    public async Task JoinCoupleGroup(string coupleId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, coupleId);
    }

    public async Task LeaveCoupleGroup(string coupleId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, coupleId);
    }

    public async Task SendNudge(string coupleId, string senderName)
    {
        await Clients.OthersInGroup(coupleId).SendAsync("ReceiveNudge", senderName);
    }
}
