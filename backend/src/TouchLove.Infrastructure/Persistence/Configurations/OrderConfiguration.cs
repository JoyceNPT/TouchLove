using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TouchLove.Domain.Entities;

namespace TouchLove.Infrastructure.Persistence.Configurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.HasIndex(x => x.OrderNumber).IsUnique();
        builder.Property(x => x.TotalAmount).HasColumnType("decimal(18,2)");
    }
}
