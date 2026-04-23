using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using TouchLove.Application.Interfaces;
using TouchLove.Domain.Enums;

namespace TouchLove.Infrastructure.Storage;

public class LocalFileStorageService : IFileStorageService
{
    private readonly IWebHostEnvironment _env;
    private static readonly string[] AllowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    private static readonly Dictionary<string, byte[]> MagicBytes = new()
    {
        { "image/jpeg", [0xFF, 0xD8, 0xFF] },
        { "image/png",  [0x89, 0x50, 0x4E, 0x47] },
        { "image/webp", [0x52, 0x49, 0x46, 0x46] } // RIFF header
    };

    public LocalFileStorageService(IWebHostEnvironment env)
    {
        _env = env;
    }

    public async Task<FileUploadResult> UploadAsync(IFormFile file, string folder, CancellationToken ct = default)
    {
        // Validate MIME type via magic bytes
        var mime = await DetectMimeTypeAsync(file, ct);
        if (!AllowedMimeTypes.Contains(mime))
            throw new InvalidOperationException($"File type '{mime}' is not allowed. Only JPEG, PNG, WebP are accepted.");

        var ext = mime switch
        {
            "image/jpeg" => "jpg",
            "image/png" => "png",
            "image/webp" => "webp",
            _ => "bin"
        };

        var fileName = $"{Guid.NewGuid()}.{ext}";
        var relativePath = Path.Combine("uploads", folder, fileName).Replace("\\", "/");
        var absolutePath = Path.Combine(_env.WebRootPath, "uploads", folder, fileName);

        Directory.CreateDirectory(Path.GetDirectoryName(absolutePath)!);

        using var stream = new FileStream(absolutePath, FileMode.Create);
        await file.CopyToAsync(stream, ct);

        return new FileUploadResult(relativePath, $"/{relativePath}", StorageType.Local);
    }

    public Task DeleteAsync(string fileIdentifier, CancellationToken ct = default)
    {
        var absolutePath = Path.Combine(_env.WebRootPath, fileIdentifier.TrimStart('/').Replace("/", Path.DirectorySeparatorChar.ToString()));
        if (File.Exists(absolutePath))
            File.Delete(absolutePath);
        return Task.CompletedTask;
    }

    public string GetPublicUrl(string fileIdentifier)
        => fileIdentifier.StartsWith("/") ? fileIdentifier : $"/{fileIdentifier}";

    private static async Task<string> DetectMimeTypeAsync(IFormFile file, CancellationToken ct)
    {
        using var stream = file.OpenReadStream();
        var header = new byte[8];
        await stream.ReadAsync(header, ct);

        foreach (var (mime, magic) in MagicBytes)
        {
            if (header.Take(magic.Length).SequenceEqual(magic))
                return mime;
        }

        return "application/octet-stream";
    }
}
