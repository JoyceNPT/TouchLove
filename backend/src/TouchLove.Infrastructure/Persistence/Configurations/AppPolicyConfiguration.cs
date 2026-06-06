using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TouchLove.Domain.Entities;

namespace TouchLove.Infrastructure.Persistence.Configurations;

public class AppPolicyConfiguration : IEntityTypeConfiguration<AppPolicy>
{
    public void Configure(EntityTypeBuilder<AppPolicy> builder)
    {
        builder.HasIndex(x => new { x.Code, x.Language }).IsUnique();
    }
}
