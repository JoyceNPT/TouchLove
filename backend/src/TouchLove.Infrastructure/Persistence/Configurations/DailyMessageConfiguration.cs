using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TouchLove.Domain.Entities;

namespace TouchLove.Infrastructure.Persistence.Configurations;

public class DailyMessageConfiguration : IEntityTypeConfiguration<DailyMessage>
{
    public void Configure(EntityTypeBuilder<DailyMessage> builder)
    {
        builder.Property(m => m.Content).IsRequired();

        // Unique: one message per couple per day
        builder.HasIndex(m => new { m.CoupleId, m.MessageDate }).IsUnique();

        builder.HasOne(m => m.Couple)
            .WithMany(c => c.DailyMessages)
            .HasForeignKey(m => m.CoupleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(m => m.Template)
            .WithMany()
            .HasForeignKey(m => m.TemplateId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
