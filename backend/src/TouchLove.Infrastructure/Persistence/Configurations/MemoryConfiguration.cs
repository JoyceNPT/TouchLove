using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TouchLove.Domain.Entities;

namespace TouchLove.Infrastructure.Persistence.Configurations;

public class MemoryConfiguration : IEntityTypeConfiguration<Memory>
{
    public void Configure(EntityTypeBuilder<Memory> builder)
    {
        builder.Property(m => m.StoragePath).IsRequired().HasMaxLength(500);
        builder.Property(m => m.OriginalFileName).IsRequired().HasMaxLength(255);
        builder.Property(m => m.MimeType).IsRequired().HasMaxLength(100);
        builder.Property(m => m.Caption).HasMaxLength(200);

        builder.HasIndex(m => new { m.CoupleId, m.IsDeleted });
        builder.HasQueryFilter(m => !m.IsDeleted);

        builder.HasOne(m => m.Couple)
            .WithMany(c => c.Memories)
            .HasForeignKey(m => m.CoupleId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
