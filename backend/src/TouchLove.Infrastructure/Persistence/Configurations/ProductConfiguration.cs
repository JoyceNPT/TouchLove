using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TouchLove.Domain.Entities;

namespace TouchLove.Infrastructure.Persistence.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.HasIndex(x => x.Slug).IsUnique();
        builder.Property(x => x.Price).HasColumnType("decimal(18,2)");
        builder.Property(x => x.CostPrice).HasColumnType("decimal(18,2)");
    }
}
