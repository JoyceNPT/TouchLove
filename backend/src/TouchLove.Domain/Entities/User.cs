using Microsoft.AspNetCore.Identity;
using TouchLove.Domain.Enums;

namespace TouchLove.Domain.Entities;

public class User : IdentityUser<Guid>
{
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public bool IsEmailVerified { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public Theme Theme { get; set; } = Theme.Light;
    public Language Language { get; set; } = Language.VI;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; } = false;

    // Navigation
    public UserSetting? Setting { get; set; }
    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
    public ICollection<EmailVerificationToken> EmailVerificationTokens { get; set; } = [];
    public ICollection<PasswordResetToken> PasswordResetTokens { get; set; } = [];
    public ICollection<Keychain> Keychains { get; set; } = [];
}
