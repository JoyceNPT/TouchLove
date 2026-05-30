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

        var existing = await _db.PairingInvitations
            .Where(i => i.InitiatorKeychainId == keychain.Id && !i.IsUsed && i.ExpiresAt > DateTime.UtcNow)
            .ToListAsync(ct);

        if (existing.Any(i => i.IsPendingConfirmation))
            return ApiResponse<string>.Fail("Bạn đang có yêu cầu ghép đôi chờ xác nhận. Hãy xác nhận hoặc từ chối trước khi tạo mã mới.");

        foreach (var inv in existing)
            inv.IsUsed = true;

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

    // ─── Request pairing (Partner B enters code — awaits A confirm) ───
    public async Task<ApiResponse<PairingRequestDto>> RequestPairingAsync(string inviteCode, Guid userId, CancellationToken ct = default)
    {
        inviteCode = inviteCode.Trim().ToUpperInvariant();

        var invitation = await _db.PairingInvitations
            .Include(i => i.InitiatorKeychain)
                .ThenInclude(k => k!.User)
            .FirstOrDefaultAsync(i => i.InviteCode == inviteCode && !i.IsUsed && i.ExpiresAt > DateTime.UtcNow, ct);

        if (invitation == null)
            return ApiResponse<PairingRequestDto>.Fail("Mã mời không hợp lệ, đã hết hạn hoặc đã được sử dụng.");

        if (invitation.IsPendingConfirmation)
            return ApiResponse<PairingRequestDto>.Fail("Mã mời này đang chờ xác nhận từ chủ mã. Vui lòng đợi hoặc liên hệ đối phương.");

        var partnerBKeychain = await _db.Keychains
            .IgnoreQueryFilters()
            .Include(k => k.User)
            .FirstOrDefaultAsync(k => k.UserId == userId && k.Status == KeychainStatus.Activated, ct);

        if (partnerBKeychain == null)
            return ApiResponse<PairingRequestDto>.Fail("Bạn cần kích hoạt móc khóa NFC trước khi ghép đôi.");

        if (invitation.InitiatorKeychainId == partnerBKeychain.Id)
            return ApiResponse<PairingRequestDto>.Fail("Bạn không thể ghép đôi với chính mình.");

        if (partnerBKeychain.CoupleId.HasValue)
            return ApiResponse<PairingRequestDto>.Fail("Móc khóa của bạn đã được ghép đôi.");

        var existingPending = await _db.PairingInvitations
            .AnyAsync(i => i.UsedByKeychainId == partnerBKeychain.Id && i.IsPendingConfirmation && !i.IsUsed && i.ExpiresAt > DateTime.UtcNow, ct);

        if (existingPending)
            return ApiResponse<PairingRequestDto>.Fail("Bạn đã gửi yêu cầu ghép đôi. Vui lòng chờ đối phương xác nhận.");

        invitation.UsedByKeychainId = partnerBKeychain.Id;
        invitation.IsPendingConfirmation = true;
        invitation.RequestedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        var initiatorName = invitation.InitiatorKeychain?.User?.Nickname
            ?? invitation.InitiatorKeychain?.User?.DisplayName
            ?? "Đối phương";

        var requesterName = partnerBKeychain.User?.Nickname ?? partnerBKeychain.User?.DisplayName ?? "Ai đó";
        var initiatorUserId = invitation.InitiatorKeychain?.UserId
            ?? (await _db.Keychains.IgnoreQueryFilters().FirstAsync(k => k.Id == invitation.InitiatorKeychainId, ct)).UserId;

        return ApiResponse<PairingRequestDto>.Ok(
            new PairingRequestDto(
                invitation.Id,
                "pending_confirmation",
                initiatorName,
                null,
                null,
                requesterName,
                initiatorUserId),
            "Đã gửi yêu cầu ghép đôi. Chờ đối phương (chủ mã mời) xác nhận! 💕");
    }

    // ─── Confirm pairing (Partner A — initiator) ─────────────────────
    public async Task<ApiResponse<CoupleDto>> ConfirmPairingAsync(Guid userId, IEmailService emailService, CancellationToken ct = default)
    {
        var initiatorKeychain = await _db.Keychains
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(k => k.UserId == userId && k.Status == KeychainStatus.Activated, ct);

        if (initiatorKeychain == null)
            return ApiResponse<CoupleDto>.Fail("Không tìm thấy móc khóa đang chờ ghép đôi.");

        var invitation = await _db.PairingInvitations
            .Include(i => i.InitiatorKeychain)
                .ThenInclude(k => k!.User)
            .Include(i => i.UsedByKeychain)
                .ThenInclude(k => k!.User)
            .FirstOrDefaultAsync(i =>
                i.InitiatorKeychainId == initiatorKeychain.Id
                && i.IsPendingConfirmation
                && !i.IsUsed
                && i.ExpiresAt > DateTime.UtcNow, ct);

        if (invitation == null)
            return ApiResponse<CoupleDto>.Fail("Không có yêu cầu ghép đôi nào cần xác nhận.");

        return await CompletePairingAsync(invitation, emailService, ct);
    }

    // ─── Reject / cancel pending pairing ─────────────────────────────
    public async Task<ApiResponse<string>> RejectPairingAsync(Guid userId, CancellationToken ct = default)
    {
        var keychain = await _db.Keychains
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(k => k.UserId == userId && k.Status == KeychainStatus.Activated, ct);

        if (keychain == null)
            return ApiResponse<string>.Fail("Không tìm thấy móc khóa NFC.");

        var invitation = await _db.PairingInvitations
            .FirstOrDefaultAsync(i =>
                !i.IsUsed
                && i.IsPendingConfirmation
                && i.ExpiresAt > DateTime.UtcNow
                && (i.InitiatorKeychainId == keychain.Id || i.UsedByKeychainId == keychain.Id), ct);

        if (invitation == null)
            return ApiResponse<string>.Fail("Không có yêu cầu ghép đôi nào để hủy.");

        invitation.IsPendingConfirmation = false;
        invitation.UsedByKeychainId = null;
        invitation.RequestedAt = null;

        await _db.SaveChangesAsync(ct);
        return ApiResponse<string>.Ok("Đã hủy yêu cầu ghép đôi.");
    }

    public async Task<PairingPendingInfo?> GetPairingPendingForUserAsync(Guid userId, CancellationToken ct = default)
    {
        var keychain = await _db.Keychains
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(k => k.UserId == userId && k.Status == KeychainStatus.Activated, ct);

        if (keychain == null) return null;

        var asAcceptor = await _db.PairingInvitations
            .Include(i => i.InitiatorKeychain)
                .ThenInclude(k => k!.User)
            .FirstOrDefaultAsync(i =>
                i.UsedByKeychainId == keychain.Id
                && i.IsPendingConfirmation
                && !i.IsUsed
                && i.ExpiresAt > DateTime.UtcNow, ct);

        if (asAcceptor != null)
        {
            var name = asAcceptor.InitiatorKeychain?.User?.Nickname
                ?? asAcceptor.InitiatorKeychain?.User?.DisplayName
                ?? "Đối phương";
            return new PairingPendingInfo(asAcceptor.Id, "acceptor", name, asAcceptor.RequestedAt);
        }

        var asInitiator = await _db.PairingInvitations
            .Include(i => i.UsedByKeychain)
                .ThenInclude(k => k!.User)
            .FirstOrDefaultAsync(i =>
                i.InitiatorKeychainId == keychain.Id
                && i.IsPendingConfirmation
                && !i.IsUsed
                && i.ExpiresAt > DateTime.UtcNow, ct);

        if (asInitiator != null)
        {
            var name = asInitiator.UsedByKeychain?.User?.Nickname
                ?? asInitiator.UsedByKeychain?.User?.DisplayName
                ?? "Đối phương";
            return new PairingPendingInfo(asInitiator.Id, "initiator", name, asInitiator.RequestedAt);
        }

        return null;
    }

    private async Task<ApiResponse<CoupleDto>> CompletePairingAsync(
        PairingInvitation invitation,
        IEmailService emailService,
        CancellationToken ct)
    {
        if (!invitation.IsPendingConfirmation || invitation.UsedByKeychainId == null)
            return ApiResponse<CoupleDto>.Fail("Yêu cầu ghép đôi không hợp lệ.");

        var partnerAKeychain = invitation.InitiatorKeychain
            ?? await _db.Keychains.IgnoreQueryFilters().Include(k => k.User).FirstAsync(k => k.Id == invitation.InitiatorKeychainId, ct);

        var partnerBKeychain = invitation.UsedByKeychain
            ?? await _db.Keychains.IgnoreQueryFilters().Include(k => k.User).FirstAsync(k => k.Id == invitation.UsedByKeychainId.Value, ct);

        if (partnerAKeychain.Status != KeychainStatus.Activated || partnerBKeychain.Status != KeychainStatus.Activated)
            return ApiResponse<CoupleDto>.Fail("Một trong hai móc khóa không còn ở trạng thái có thể ghép đôi.");

        var partnerA = partnerAKeychain.User!;
        var partnerB = partnerBKeychain.User!;

        var slug = await GenerateUniqueSlugAsync(partnerA.DisplayName, partnerB.DisplayName, ct);

        var couple = new TouchLove.Domain.Entities.Couple
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

        partnerAKeychain.Status = KeychainStatus.Paired;
        partnerAKeychain.CoupleId = couple.Id;
        partnerBKeychain.Status = KeychainStatus.Paired;
        partnerBKeychain.CoupleId = couple.Id;

        invitation.IsUsed = true;
        invitation.IsPendingConfirmation = false;

        await _db.SaveChangesAsync(ct);

        await emailService.SendPairingSuccessAsync(partnerA.Email!, partnerB.DisplayName, couple.Id, ct);
        await emailService.SendPairingSuccessAsync(partnerB.Email!, partnerA.DisplayName, couple.Id, ct);

        return ApiResponse<CoupleDto>.Ok(new CoupleDto(couple.Id, couple.CoupleSlug, couple.CoupleName), "Ghép đôi thành công! 💕");
    }

    public async Task<Guid?> GetAcceptorUserIdForPendingInvitationAsync(Guid initiatorUserId, CancellationToken ct = default)
    {
        var keychain = await _db.Keychains
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(k => k.UserId == initiatorUserId && k.Status == KeychainStatus.Activated, ct);
        if (keychain == null) return null;

        var invitation = await _db.PairingInvitations
            .FirstOrDefaultAsync(i =>
                i.InitiatorKeychainId == keychain.Id
                && i.IsPendingConfirmation
                && !i.IsUsed
                && i.ExpiresAt > DateTime.UtcNow, ct);

        if (invitation?.UsedByKeychainId == null) return null;

        var acceptorKeychain = await _db.Keychains
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(k => k.Id == invitation.UsedByKeychainId, ct);

        return acceptorKeychain?.UserId;
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

public record PairingRequestDto(
    Guid InvitationId,
    string Status,
    string PartnerName,
    Guid? CoupleId,
    string? CoupleSlug,
    string? RequesterDisplayName = null,
    Guid? InitiatorUserId = null);

public record PairingPendingInfo(Guid InvitationId, string Role, string PartnerName, DateTime? RequestedAt);
