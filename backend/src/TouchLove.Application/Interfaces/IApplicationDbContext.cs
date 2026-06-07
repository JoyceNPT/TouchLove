using TouchLove.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace TouchLove.Application.Interfaces;

public interface IApplicationDbContext
{
    Microsoft.EntityFrameworkCore.Infrastructure.DatabaseFacade Database { get; }
    DbSet<User> Users { get; }
    DbSet<UserSetting> UserSettings { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<EmailVerificationToken> EmailVerificationTokens { get; }
    DbSet<PasswordResetToken> PasswordResetTokens { get; }
    DbSet<Keychain> Keychains { get; }
    DbSet<PairingInvitation> PairingInvitations { get; }
    DbSet<Couple> Couples { get; }
    DbSet<Memory> Memories { get; }
    DbSet<DailyMessage> DailyMessages { get; }
    DbSet<MessageTemplate> MessageTemplates { get; }
    DbSet<NfcScanLog> NfcScanLogs { get; }
    DbSet<UnpairRequest> UnpairRequests { get; }
    DbSet<Supplier> Suppliers { get; }
    DbSet<Product> Products { get; }
    DbSet<Order> Orders { get; }
    DbSet<OrderItem> OrderItems { get; }
    DbSet<Cart> Carts { get; }
    DbSet<CartItem> CartItems { get; }
    DbSet<AnniversaryReminder> AnniversaryReminders { get; }
    DbSet<Voucher> Vouchers { get; }
    DbSet<VoucherRedemption> VoucherRedemptions { get; }
    DbSet<PendingOrder> PendingOrders { get; }
    DbSet<AppPolicy> AppPolicies { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
