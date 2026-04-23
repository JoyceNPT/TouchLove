using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TouchLove.Domain.Entities;

namespace TouchLove.Infrastructure.Persistence.Configurations;

public class UnpairRequestConfiguration : IEntityTypeConfiguration<UnpairRequest>
{
    public void Configure(EntityTypeBuilder<UnpairRequest> builder)
    {
        builder.HasOne(u => u.Couple)
            .WithMany(c => c.UnpairRequests)
            .HasForeignKey(u => u.CoupleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(u => u.RequestedByKeychain)
            .WithMany()
            .HasForeignKey(u => u.RequestedByKeychainId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(u => u.ConfirmedByKeychain)
            .WithMany()
            .HasForeignKey(u => u.ConfirmedByKeychainId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
