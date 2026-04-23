using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TouchLove.Domain.Entities;

namespace TouchLove.Infrastructure.Persistence.Configurations;

public class PairingInvitationConfiguration : IEntityTypeConfiguration<PairingInvitation>
{
    public void Configure(EntityTypeBuilder<PairingInvitation> builder)
    {
        builder.Property(p => p.InviteCode).IsRequired().HasMaxLength(6);
        builder.HasIndex(p => p.InviteCode).IsUnique();

        builder.HasOne(p => p.InitiatorKeychain)
            .WithMany()
            .HasForeignKey(p => p.InitiatorKeychainId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.UsedByKeychain)
            .WithMany()
            .HasForeignKey(p => p.UsedByKeychainId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
