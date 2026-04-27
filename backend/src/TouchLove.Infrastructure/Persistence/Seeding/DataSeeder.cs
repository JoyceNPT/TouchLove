using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TouchLove.Domain.Entities;
using TouchLove.Domain.Enums;
using TouchLove.Shared;

namespace TouchLove.Infrastructure.Persistence.Seeding;

public static class DataSeeder
{
    // Fixed GUIDs for idempotent seeding
    private static readonly Guid AdminId = new("00000000-0000-0000-0000-000000000001");
    private static readonly Guid User1Id = new("00000000-0000-0000-0000-000000000002");
    private static readonly Guid User2Id = new("00000000-0000-0000-0000-000000000003");
    private static readonly Guid Keychain1Id = new("00000000-0000-0000-0001-000000000001");
    private static readonly Guid Keychain2Id = new("00000000-0000-0000-0001-000000000002");
    private static readonly Guid CoupleId = new("00000000-0000-0000-0002-000000000001");

    public static async Task SeedAsync(AppDbContext context, UserManager<User> userManager, RoleManager<IdentityRole<Guid>> roleManager)
    {
        // ── Order 1: Roles ──────────────────────────────────────────
        foreach (var role in new[] { Constants.Roles.Admin, Constants.Roles.User })
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole<Guid>(role));
        }

        // ── Order 2: Admin user ──────────────────────────────────────
        if (await userManager.FindByIdAsync(AdminId.ToString()) == null)
        {
            var admin = new User
            {
                Id = AdminId,
                UserName = "admin@touchlove.local",
                Email = "admin@touchlove.local",
                DisplayName = "Admin",
                IsEmailVerified = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            await userManager.CreateAsync(admin, "Admin@123456");
            await userManager.AddToRoleAsync(admin, Constants.Roles.Admin);
            context.UserSettings.Add(new UserSetting { UserId = AdminId });
        }

        // ── Order 3: Test users ──────────────────────────────────────
        if (await userManager.FindByIdAsync(User1Id.ToString()) == null)
        {
            var user1 = new User
            {
                Id = User1Id,
                UserName = "user1@test.local",
                Email = "user1@test.local",
                DisplayName = "An",
                IsEmailVerified = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            await userManager.CreateAsync(user1, "Test@123456");
            await userManager.AddToRoleAsync(user1, Constants.Roles.User);
            context.UserSettings.Add(new UserSetting { UserId = User1Id });
        }

        if (await userManager.FindByIdAsync(User2Id.ToString()) == null)
        {
            var user2 = new User
            {
                Id = User2Id,
                UserName = "user2@test.local",
                Email = "user2@test.local",
                DisplayName = "Bình",
                IsEmailVerified = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            await userManager.CreateAsync(user2, "Test@123456");
            await userManager.AddToRoleAsync(user2, Constants.Roles.User);
            context.UserSettings.Add(new UserSetting { UserId = User2Id });
        }

        await context.SaveChangesAsync();

        // ── Order 4: Keychains & Couple ──────────────────────────────
        if (!await context.Keychains.IgnoreQueryFilters().AnyAsync(k => k.Id == Keychain1Id))
        {
            context.Keychains.AddRange(
                new Keychain
                {
                    Id = Keychain1Id,
                    KeyId = "key-aaa-001",
                    UserId = User1Id,
                    CoupleId = null, // Set later to break circular dependency
                    Status = KeychainStatus.Paired,
                    ActivatedAt = new DateTime(2024, 2, 14, 0, 0, 0, DateTimeKind.Utc),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Keychain
                {
                    Id = Keychain2Id,
                    KeyId = "key-bbb-002",
                    UserId = User2Id,
                    CoupleId = null, // Set later to break circular dependency
                    Status = KeychainStatus.Paired,
                    ActivatedAt = new DateTime(2024, 2, 14, 0, 0, 0, DateTimeKind.Utc),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Keychain
                {
                    KeyId = "new-chip-123",
                    Status = KeychainStatus.Available,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            );
        }

        if (!await context.Couples.IgnoreQueryFilters().AnyAsync(c => c.Id == CoupleId))
        {
            context.Couples.Add(new Couple
            {
                Id = CoupleId,
                KeychainAId = Keychain1Id,
                KeychainBId = Keychain2Id,
                CoupleSlug = "an-va-binh",
                CoupleName = "An & Bình",
                StartDate = new DateOnly(2024, 2, 14),
                Description = "Tình yêu bắt đầu từ mùa xuân năm 2024 💕",
                NfcScanCount = 42,
                IsActive = true,
                PairedAt = new DateTime(2024, 2, 14, 0, 0, 0, DateTimeKind.Utc),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }

        await context.SaveChangesAsync();

        // ── Step 4.5: Update Keychains with CoupleId ──────────────────
        var k1 = await context.Keychains.FindAsync(Keychain1Id);
        var k2 = await context.Keychains.FindAsync(Keychain2Id);
        if (k1 != null) k1.CoupleId = CoupleId;
        if (k2 != null) k2.CoupleId = CoupleId;

        await context.SaveChangesAsync();

        // ── Order 5: Message Templates ────────────────────────────────
        if (!await context.MessageTemplates.IgnoreQueryFilters().AnyAsync())
        {
            var adminUser = await userManager.FindByIdAsync(AdminId.ToString());
            var templates = new List<MessageTemplate>
            {
                new() { Id = new Guid("00000000-0000-0000-0003-000000000001"), Content = "Mỗi ngày bên em là một món quà mà anh không thể đổi lấy bất cứ thứ gì. Cảm ơn em đã xuất hiện trong cuộc đời anh.", Language = "vi", Category = "romantic", Status = TemplateStatus.Published, CreatedByAdminId = AdminId, PublishedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new() { Id = new Guid("00000000-0000-0000-0003-000000000002"), Content = "Tình yêu không phải là tìm kiếm sự hoàn hảo, mà là chấp nhận sự không hoàn hảo của nhau và vẫn chọn ở lại. Anh chọn em.", Language = "vi", Category = "poetic", Status = TemplateStatus.Published, CreatedByAdminId = AdminId, PublishedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new() { Id = new Guid("00000000-0000-0000-0003-000000000003"), Content = "Sáng nay thức dậy, điều đầu tiên anh nghĩ đến là em. Và điều cuối cùng trước khi ngủ cũng là em. Em đã trở thành nhịp thở của anh rồi.", Language = "vi", Category = "romantic", Status = TemplateStatus.Published, CreatedByAdminId = AdminId, PublishedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new() { Id = new Guid("00000000-0000-0000-0003-000000000004"), Content = "Có những lúc anh không biết nói gì, nhưng anh biết rằng chỉ cần có em ở đây là đủ. Đủ hạnh phúc. Đủ bình yên.", Language = "vi", Category = "poetic", Status = TemplateStatus.Published, CreatedByAdminId = AdminId, PublishedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new() { Id = new Guid("00000000-0000-0000-0003-000000000005"), Content = "Hôm nay có thể bận rộn, có thể mệt mỏi, nhưng đừng quên rằng luôn có một người đang nghĩ đến em và mỉm cười vì em tồn tại.", Language = "vi", Category = "motivational", Status = TemplateStatus.Published, CreatedByAdminId = AdminId, PublishedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new() { Id = new Guid("00000000-0000-0000-0003-000000000006"), Content = "Every moment with you is a chapter in the most beautiful story I've ever been a part of.", Language = "en", Category = "romantic", Status = TemplateStatus.Published, CreatedByAdminId = AdminId, PublishedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new() { Id = new Guid("00000000-0000-0000-0003-000000000007"), Content = "You are the reason I believe in love. Thank you for being my favorite adventure.", Language = "en", Category = "romantic", Status = TemplateStatus.Published, CreatedByAdminId = AdminId, PublishedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            };
            context.MessageTemplates.AddRange(templates);
        }

        await context.SaveChangesAsync();

        // ── Order 6: DailyMessages (7 ngày gần nhất) ─────────────────
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (!await context.DailyMessages.AnyAsync(m => m.CoupleId == CoupleId))
        {
            var templateIds = new[]
            {
                new Guid("00000000-0000-0000-0003-000000000001"),
                new Guid("00000000-0000-0000-0003-000000000002"),
                new Guid("00000000-0000-0000-0003-000000000003"),
                new Guid("00000000-0000-0000-0003-000000000004"),
                new Guid("00000000-0000-0000-0003-000000000005"),
                new Guid("00000000-0000-0000-0003-000000000001"),
                new Guid("00000000-0000-0000-0003-000000000002"),
            };
            var contents = new[]
            {
                "Mỗi ngày bên em là một món quà mà anh không thể đổi lấy bất cứ thứ gì. Cảm ơn em đã xuất hiện trong cuộc đời anh.",
                "Tình yêu không phải là tìm kiếm sự hoàn hảo, mà là chấp nhận sự không hoàn hảo của nhau và vẫn chọn ở lại. Anh chọn em.",
                "Sáng nay thức dậy, điều đầu tiên anh nghĩ đến là em. Và điều cuối cùng trước khi ngủ cũng là em. Em đã trở thành nhịp thở của anh rồi.",
                "Có những lúc anh không biết nói gì, nhưng anh biết rằng chỉ cần có em ở đây là đủ. Đủ hạnh phúc. Đủ bình yên.",
                "Hôm nay có thể bận rộn, có thể mệt mỏi, nhưng đừng quên rằng luôn có một người đang nghĩ đến em và mỉm cười vì em tồn tại.",
                "Mỗi ngày bên em là một món quà mà anh không thể đổi lấy bất cứ thứ gì. Cảm ơn em đã xuất hiện trong cuộc đời anh.",
                "Tình yêu không phải là tìm kiếm sự hoàn hảo, mà là chấp nhận sự không hoàn hảo của nhau và vẫn chọn ở lại. Anh chọn em.",
            };

            for (int i = 0; i < 7; i++)
            {
                context.DailyMessages.Add(new DailyMessage
                {
                    CoupleId = CoupleId,
                    TemplateId = templateIds[i],
                    Content = contents[i],
                    MessageDate = today.AddDays(-6 + i),
                    Source = MessageSource.Template,
                    IsBookmarked = i == 0,
                    CreatedAt = DateTime.UtcNow.AddDays(-6 + i)
                });
            }
        }

        // ── Order 7: Memories (placeholder) ──────────────────────────
        if (!await context.Memories.IgnoreQueryFilters().AnyAsync(m => m.CoupleId == CoupleId))
        {
            for (int i = 1; i <= 3; i++)
            {
                context.Memories.Add(new Memory
                {
                    CoupleId = CoupleId,
                    UploadedByUserId = User1Id,
                    StoragePath = $"uploads/{CoupleId}/placeholder-{i}.jpg",
                    StorageType = StorageType.Local,
                    OriginalFileName = $"memory-{i}.jpg",
                    MimeType = "image/jpeg",
                    FileSizeBytes = 1024 * 100,
                    Caption = i == 1 ? "Ngày đầu tiên gặp nhau 💕" : i == 2 ? "Hẹn hò cuối tuần" : "Kỷ niệm 1 tháng yêu",
                    SortOrder = i,
                    CreatedAt = DateTime.UtcNow.AddDays(-i * 10),
                    UpdatedAt = DateTime.UtcNow
                });
            }
        }

        // ── Order 8: Products & Suppliers ─────────────────────────────
        Guid supplierId;
        var supplier = await context.Suppliers.FirstOrDefaultAsync(s => s.Name == "Xưởng Len TouchLove");
        if (supplier == null)
        {
            supplier = new Supplier
            {
                Name = "Xưởng Len TouchLove",
                Phone = "0901234567",
                Email = "xuonglen@touchlove.local",
                Address = "123 Đường Láng, Hà Nội"
            };
            context.Suppliers.Add(supplier);
            await context.SaveChangesAsync();
        }
        supplierId = supplier.Id;

        var productsToSeed = new List<Product>
        {
            new() { Name = "Móc khóa Gấu Yêu", Slug = "moc-khoa-gau-yeu", Price = 150000, StockQuantity = 50, SupplierId = supplierId, Description = "Móc khóa len hình gấu nâu dễ thương gắn chip NFC cao cấp, cho phép lưu giữ những lời nhắn ngọt ngào.", ImageUrls = "[\"https://images.unsplash.com/photo-1559440666-374213642921?auto=format&fit=crop&q=80&w=600\"]" },
            new() { Name = "Móc khóa Thỏ Trắng", Slug = "moc-khoa-tho-trang", Price = 155000, StockQuantity = 30, SupplierId = supplierId, Description = "Móc khóa len hình thỏ trắng tinh khôi, món quà tuyệt vời cho bạn gái với công nghệ TouchLove NFC.", ImageUrls = "[\"https://images.unsplash.com/photo-1585110396054-c8112c60b201?auto=format&fit=crop&q=80&w=600\"]" },
            new() { Name = "Cặp đôi Mèo Mun", Slug = "cap-doi-meo-mun", Price = 280000, StockQuantity = 20, SupplierId = supplierId, Description = "Bộ 2 móc khóa mèo mun phối màu đen trắng sang trọng, gắn kết trái tim hai người yêu nhau.", ImageUrls = "[\"https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600\"]" },
            new() { Name = "Móc khóa Heo Hồng", Slug = "moc-khoa-heo-hong", Price = 145000, StockQuantity = 45, SupplierId = supplierId, Description = "Heo hồng mập mạp đáng yêu, là biểu tượng cho sự ấm áp và sung túc.", ImageUrls = "[\"https://images.unsplash.com/photo-1570158268183-d296b2892211?auto=format&fit=crop&q=80&w=600\"]" },
            new() { Name = "Móc khóa Shiba Inu", Slug = "moc-khoa-shiba-inu", Price = 165000, StockQuantity = 25, SupplierId = supplierId, Description = "Chú chó Shiba Inu nổi tiếng với nụ cười rạng rỡ, mang lại niềm vui mỗi ngày.", ImageUrls = "[\"https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=600\"]" },
            new() { Name = "Móc khóa Cú Mèo", Slug = "moc-khoa-cu-meo", Price = 160000, StockQuantity = 15, SupplierId = supplierId, Description = "Cú mèo thông thái cho những cặp đôi thích sự sâu sắc và bí ẩn.", ImageUrls = "[\"https://images.unsplash.com/photo-1544211911-2f01ad4d409b?auto=format&fit=crop&q=80&w=600\"]" }
        };

        foreach (var p in productsToSeed)
        {
            if (!await context.Products.AnyAsync(x => x.Slug == p.Slug))
            {
                context.Products.Add(p);
            }
        }

        await context.SaveChangesAsync();
    }
}
