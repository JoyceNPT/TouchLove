using Microsoft.AspNetCore.Http;
using TouchLove.Domain.Enums;

namespace TouchLove.Application.Interfaces;

public interface IFileStorageService
{
    Task<FileUploadResult> UploadAsync(IFormFile file, string folder, CancellationToken ct = default);
    Task DeleteAsync(string fileIdentifier, CancellationToken ct = default);
    string GetPublicUrl(string fileIdentifier);
}

public record FileUploadResult(string StoragePath, string PublicUrl, StorageType StorageType);
