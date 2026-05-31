using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TouchLove.Domain.Entities;

namespace TouchLove.Infrastructure.Persistence.Configurations;

public class VoucherConfiguration : IEntityTypeConfiguration<Voucher>
{
    public void Configure(EntityTypeBuilder<Voucher> builder)
    {
        builder.HasIndex(x => x.Code).IsUnique();
        
        // Optimistic concurrency token
        builder.Property(x => x.UsageLimitTotal).IsConcurrencyToken();
    }
}
