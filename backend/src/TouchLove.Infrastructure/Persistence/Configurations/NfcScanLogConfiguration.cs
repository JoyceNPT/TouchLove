using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TouchLove.Domain.Entities;

namespace TouchLove.Infrastructure.Persistence.Configurations;

public class NfcScanLogConfiguration : IEntityTypeConfiguration<NfcScanLog>
{
    public void Configure(EntityTypeBuilder<NfcScanLog> builder)
    {
        builder.Property(n => n.UserAgent).HasMaxLength(500);
        builder.Property(n => n.IpAddress).HasMaxLength(45);

        builder.HasIndex(n => n.CoupleId);
        builder.HasIndex(n => n.ScannedAt);

        // NO soft delete, NO query filter. Append-only.
        builder.HasOne(n => n.Couple)
            .WithMany(c => c.NfcScanLogs)
            .HasForeignKey(n => n.CoupleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(n => n.Keychain)
            .WithMany()
            .HasForeignKey(n => n.KeychainId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
