using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TouchLove.Domain.Entities;

namespace TouchLove.Infrastructure.Persistence.Configurations;

public class KeychainConfiguration : IEntityTypeConfiguration<Keychain>
{
    public void Configure(EntityTypeBuilder<Keychain> builder)
    {
        builder.Property(k => k.KeyId).IsRequired().HasMaxLength(36);
        builder.HasIndex(k => k.KeyId).IsUnique();
        builder.HasIndex(k => new { k.UserId, k.IsDeleted });

        // Keychain does NOT soft-delete in normal business flow (admin manages lifecycle)
        // But we keep IsDeleted from BaseEntity for safety
    }
}
