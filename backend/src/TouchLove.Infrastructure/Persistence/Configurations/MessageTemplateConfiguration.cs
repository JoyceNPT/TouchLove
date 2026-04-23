using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TouchLove.Domain.Entities;

namespace TouchLove.Infrastructure.Persistence.Configurations;

public class MessageTemplateConfiguration : IEntityTypeConfiguration<MessageTemplate>
{
    public void Configure(EntityTypeBuilder<MessageTemplate> builder)
    {
        builder.Property(t => t.Language).HasMaxLength(5).HasDefaultValue("vi");
        builder.Property(t => t.Category).HasMaxLength(100);
        builder.HasQueryFilter(t => !t.IsDeleted);
    }
}
