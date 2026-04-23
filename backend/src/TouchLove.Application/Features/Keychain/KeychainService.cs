using Microsoft.EntityFrameworkCore;
using TouchLove.Application.Interfaces;
using TouchLove.Domain.Entities;
using TouchLove.Domain.Enums;
using TouchLove.Shared;

namespace TouchLove.Application.Features.Keychain;

public class KeychainService
{
    private readonly IApplicationDbContext _db;

    public KeychainService(IApplicationDbContext db)
    {
        _db = db;
    }

    // ─── Activate ────────────────────────────────────────────────────
    public async Task<ApiResponse<string>> ActivateAsync(string keyId, Guid userId, CancellationToken ct = default)
    {
        var keychain = await _db.Keychains
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(k => k.KeyId == keyId, ct);

        if (keychain == null)
            return ApiResponse<string>.Fail("Keychain not found.");

        if (keychain.Status != KeychainStatus.Available)
            return ApiResponse<string>.Fail("This keychain is not available for activation.");

        // Check user doesn't already have an Activated keychain
        var existing = await _db.Keychains
            .IgnoreQueryFilters()
            .AnyAsync(k => k.UserId == userId && k.Status == KeychainStatus.Activated, ct);

        if (existing)
            return ApiResponse<string>.Fail("You already have a pending keychain. Please pair it first.");

        keychain.UserId = userId;
        keychain.Status = KeychainStatus.Activated;
        keychain.ActivatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return ApiResponse<string>.Ok("Keychain activated successfully.");
    }

    // ─── Create Invite Code (Partner A) ──────────────────────────────
    public async Task<ApiResponse<string>> CreateInviteAsync(Guid userId, CancellationToken ct = default)
    {
        var keychain = await _db.Keychains
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(k => k.UserId == userId && k.Status == KeychainStatus.Activated, ct);

        if (keychain == null)
            return ApiResponse<string>.Fail("You need an activated keychain to create an invitation.");

        // Revoke any existing active invite for this keychain
        var existing = await _db.PairingInvitations
            .Where(i => i.InitiatorKeychainId == keychain.Id && !i.IsUsed && i.ExpiresAt > DateTime.UtcNow)
            .ToListAsync(ct);
        foreach (var inv in existing)
            inv.IsUsed = true; // effectively revoke

        // Generate unique 6-char code (no 0,O,I,1)
        var code = await GenerateUniqueInviteCodeAsync(ct);

        _db.PairingInvitations.Add(new PairingInvitation
        {
            InitiatorKeychainId = keychain.Id,
            InviteCode = code,
            ExpiresAt = DateTime.UtcNow.AddHours(Constants.InviteCode.ExpirationHours)
        });

        await _db.SaveChangesAsync(ct);
        return ApiResponse<string>.Ok(code, "Invitation code created. Share this with your partner.");
    }

    // ─── Accept Pairing (Partner B) ──────────────────────────────────
    public async Task<ApiResponse<CoupleDto>> AcceptPairingAsync(string inviteCode, Guid userId, IEmailService emailService, CancellationToken ct = default)
    {
        var invitation = await _db.PairingInvitations
            .Include(i => i.InitiatorKeychain)
                .ThenInclude(k => k!.User)
            .FirstOrDefaultAsync(i => i.InviteCode == inviteCode && !i.IsUsed && i.ExpiresAt > DateTime.UtcNow, ct);

        if (invitation == null)
            return ApiResponse<CoupleDto>.Fail("Invalid, expired, or already used invitation code.");

        var partnerBKeychain = await _db.Keychains
            .IgnoreQueryFilters()
            .Include(k => k.User)
            .FirstOrDefaultAsync(k => k.UserId == userId && k.Status == KeychainStatus.Activated, ct);

        if (partnerBKeychain == null)
            return ApiResponse<CoupleDto>.Fail("You need an activated keychain to accept a pairing.");

        // Self-pair check
        if (invitation.InitiatorKeychainId == partnerBKeychain.Id)
            return ApiResponse<CoupleDto>.Fail("You cannot pair with yourself.");

        // User already in a couple?
        if (partnerBKeychain.CoupleId.HasValue)
            return ApiResponse<CoupleDto>.Fail("Your keychain is already paired.");

        var partnerA = invitation.InitiatorKeychain!.User!;
        var partnerB = partnerBKeychain.User!;

        // Generate unique slug
        var slug = await GenerateUniqueSlugAsync(partnerA.DisplayName, partnerB.DisplayName, ct);

        var couple = new Couple
        {
            KeychainAId = invitation.InitiatorKeychainId,
            KeychainBId = partnerBKeychain.Id,
            CoupleSlug = slug,
            CoupleName = $"{partnerA.DisplayName} & {partnerB.DisplayName}",
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow),
            IsActive = true,
            PairedAt = DateTime.UtcNow
        };
        _db.Couples.Add(couple);

        // Update keychains
        invitation.InitiatorKeychain.Status = KeychainStatus.Paired;
        invitation.InitiatorKeychain.CoupleId = couple.Id;
        partnerBKeychain.Status = KeychainStatus.Paired;
        partnerBKeychain.CoupleId = couple.Id;

        // Mark invitation used
        invitation.IsUsed = true;
        invitation.UsedByKeychainId = partnerBKeychain.Id;

        await _db.SaveChangesAsync(ct);

        // Send emails
        await emailService.SendPairingSuccessAsync(partnerA.Email!, partnerB.DisplayName, slug, ct);
        await emailService.SendPairingSuccessAsync(partnerB.Email!, partnerA.DisplayName, slug, ct);

        return ApiResponse<CoupleDto>.Ok(new CoupleDto(couple.Id, couple.CoupleSlug, couple.CoupleName), "Pairing successful! 💕");
    }

    // ─── Helpers ─────────────────────────────────────────────────────
    private async Task<string> GenerateUniqueInviteCodeAsync(CancellationToken ct)
    {
        for (int attempt = 0; attempt < 10; attempt++)
        {
            var code = GenerateCode();
            var exists = await _db.PairingInvitations
                .AnyAsync(i => i.InviteCode == code && !i.IsUsed && i.ExpiresAt > DateTime.UtcNow, ct);
            if (!exists) return code;
        }
        throw new InvalidOperationException("Could not generate unique invite code after 10 attempts.");
    }

    private static string GenerateCode()
    {
        var alphabet = Constants.InviteCode.Alphabet;
        var result = new char[Constants.InviteCode.Length];
        var bytes = new byte[Constants.InviteCode.Length];
        System.Security.Cryptography.RandomNumberGenerator.Fill(bytes);
        for (int i = 0; i < result.Length; i++)
            result[i] = alphabet[bytes[i] % alphabet.Length];
        return new string(result);
    }

    private async Task<string> GenerateUniqueSlugAsync(string nameA, string nameB, CancellationToken ct)
    {
        var year = DateTime.UtcNow.Year;
        var baseSlug = $"{Slugify(nameA)}-va-{Slugify(nameB)}-{year}";
        var slug = baseSlug;
        int suffix = 1;

        while (await _db.Couples.AnyAsync(c => c.CoupleSlug == slug, ct))
        {
            slug = $"{baseSlug}-{suffix++}";
        }

        return slug;
    }

    private static string Slugify(string input)
    {
        if (string.IsNullOrEmpty(input)) return "user";
        // Basic Vietnamese-aware slugify: lowercase, replace spaces
        return input.ToLower()
            .Replace("đ", "d")
            .Replace(" ", "-")
            .Replace("à", "a").Replace("á", "a").Replace("ả", "a").Replace("ã", "a").Replace("ạ", "a")
            .Replace("ă", "a").Replace("ằ", "a").Replace("ắ", "a").Replace("ẳ", "a").Replace("ẵ", "a").Replace("ặ", "a")
            .Replace("â", "a").Replace("ầ", "a").Replace("ấ", "a").Replace("ẩ", "a").Replace("ẫ", "a").Replace("ậ", "a")
            .Replace("è", "e").Replace("é", "e").Replace("ẻ", "e").Replace("ẽ", "e").Replace("ẹ", "e")
            .Replace("ê", "e").Replace("ề", "e").Replace("ế", "e").Replace("ể", "e").Replace("ễ", "e").Replace("ệ", "e")
            .Replace("ì", "i").Replace("í", "i").Replace("ỉ", "i").Replace("ĩ", "i").Replace("ị", "i")
            .Replace("ò", "o").Replace("ó", "o").Replace("ỏ", "o").Replace("õ", "o").Replace("ọ", "o")
            .Replace("ô", "o").Replace("ồ", "o").Replace("ố", "o").Replace("ổ", "o").Replace("ỗ", "o").Replace("ộ", "o")
            .Replace("ơ", "o").Replace("ờ", "o").Replace("ớ", "o").Replace("ở", "o").Replace("ỡ", "o").Replace("ợ", "o")
            .Replace("ù", "u").Replace("ú", "u").Replace("ủ", "u").Replace("ũ", "u").Replace("ụ", "u")
            .Replace("ư", "u").Replace("ừ", "u").Replace("ứ", "u").Replace("ử", "u").Replace("ữ", "u").Replace("ự", "u")
            .Replace("ỳ", "y").Replace("ý", "y").Replace("ỷ", "y").Replace("ỹ", "y").Replace("ỵ", "y")
            .Replace("--", "-");
    }
}

public record CoupleDto(Guid Id, string Slug, string? Name);
