using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using TouchLove.Application.Interfaces;
using TouchLove.Domain.Entities;

namespace TouchLove.Infrastructure.Persistence;

public class AppDbContext : IdentityDbContext<User, IdentityRole<Guid>, Guid>, IApplicationDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<UserSetting> UserSettings => Set<UserSetting>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<EmailVerificationToken> EmailVerificationTokens => Set<EmailVerificationToken>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
    public DbSet<Keychain> Keychains => Set<Keychain>();
    public DbSet<PairingInvitation> PairingInvitations => Set<PairingInvitation>();
    public DbSet<Couple> Couples => Set<Couple>();
    public DbSet<Memory> Memories => Set<Memory>();
    public DbSet<DailyMessage> DailyMessages => Set<DailyMessage>();
    public DbSet<MessageTemplate> MessageTemplates => Set<MessageTemplate>();
    public DbSet<NfcScanLog> NfcScanLogs => Set<NfcScanLog>();
    public DbSet<UnpairRequest> UnpairRequests => Set<UnpairRequest>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Apply all IEntityTypeConfiguration from this assembly
        builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Rename Identity tables to snake_case friendly names
        builder.Entity<IdentityRole<Guid>>().ToTable("AspNetRoles");
        builder.Entity<IdentityUserRole<Guid>>().ToTable("AspNetUserRoles");
        builder.Entity<IdentityUserClaim<Guid>>().ToTable("AspNetUserClaims");
        builder.Entity<IdentityUserLogin<Guid>>().ToTable("AspNetUserLogins");
        builder.Entity<IdentityRoleClaim<Guid>>().ToTable("AspNetRoleClaims");
        builder.Entity<IdentityUserToken<Guid>>().ToTable("AspNetUserTokens");
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Auto-update UpdatedAt for entities with that property
        var entries = ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Modified);

        foreach (var entry in entries)
        {
            if (entry.Entity is Domain.Common.BaseEntity baseEntity)
            {
                baseEntity.UpdatedAt = DateTime.UtcNow;
            }
            if (entry.Entity is UserSetting setting)
            {
                setting.UpdatedAt = DateTime.UtcNow;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}
