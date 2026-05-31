using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TouchLove.Domain.Entities;

namespace TouchLove.Infrastructure.Persistence.Configurations;

public class PendingOrderConfiguration : IEntityTypeConfiguration<PendingOrder>
{
    public void Configure(EntityTypeBuilder<PendingOrder> builder)
    {
        builder.HasIndex(x => x.OrderNumber).IsUnique();
        builder.HasIndex(x => x.TransactionId).IsUnique();
        
        builder.HasOne(x => x.Customer)
            .WithMany()
            .HasForeignKey(x => x.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
