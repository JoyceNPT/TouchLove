namespace TouchLove.Domain.Enums;

public enum OrderStatus
{
    Pending = 0,
    Confirmed = 1,
    Processing = 2,
    Shipping = 3,
    Completed = 4,
    Cancelled = 5,
    WaitingForRefund = 6,
    Refunded = 7
}
