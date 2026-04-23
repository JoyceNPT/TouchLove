using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TouchLove.Domain.Entities;

namespace TouchLove.Infrastructure.Persistence.Configurations;

public class CoupleConfiguration : IEntityTypeConfiguration<Couple>
{
    public void Configure(EntityTypeBuilder<Couple> builder)
    {
        builder.Property(c => c.CoupleSlug).IsRequired().HasMaxLength(100);
        builder.Property(c => c.CoupleName).HasMaxLength(200);
        builder.Property(c => c.Description).HasMaxLength(500);
        builder.Property(c => c.AvatarAUrl).HasMaxLength(500);
        builder.Property(c => c.AvatarBUrl).HasMaxLength(500);

        // Partial unique index: CoupleSlug unique only when NOT soft deleted
        builder.HasIndex(c => c.CoupleSlug)
            .IsUnique()
            .HasFilter("\"IsDeleted\" = false");

        builder.HasIndex(c => new { c.IsActive, c.IsDeleted });

        builder.HasQueryFilter(c => !c.IsDeleted);

        builder.HasOne(c => c.KeychainA)
            .WithMany()
            .HasForeignKey(c => c.KeychainAId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.KeychainB)
            .WithMany()
            .HasForeignKey(c => c.KeychainBId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
