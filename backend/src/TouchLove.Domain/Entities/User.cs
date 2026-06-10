using Microsoft.AspNetCore.Identity;
using TouchLove.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace TouchLove.Domain.Entities;

public class User : IdentityUser<Guid>
{
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? Nickname { get; set; }
    public bool IsEmailVerified { get; set; } = false;
    public bool IsSalesActive { get; set; } = true;
    public bool IsNfcActive { get; set; } = true;
    public Theme Theme { get; set; } = Theme.Light;
    public Language Language { get; set; } = Language.VI;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; } = false;

    public UserType UserType { get; set; } = UserType.Sales;
    public string? Gender { get; set; } // Nam, Nữ, Khác
    public DateOnly? DateOfBirth { get; set; }
    public string? Bio { get; set; }
    public string? NfcPassword { get; set; } // Passcode 6 số để quét NFC
    public bool IsProfilePublic { get; set; } = true;

    [MaxLength(500)]
    public string? BlockReason { get; set; }

    // Navigation
    public UserSetting? Setting { get; set; }
    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
    public ICollection<EmailVerificationToken> EmailVerificationTokens { get; set; } = [];
    public ICollection<PasswordResetToken> PasswordResetTokens { get; set; } = [];
    public ICollection<Keychain> Keychains { get; set; } = [];
}
