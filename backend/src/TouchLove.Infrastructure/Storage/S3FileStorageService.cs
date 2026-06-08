using Amazon;
using Amazon.S3;
using Amazon.S3.Transfer;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using TouchLove.Application.Interfaces;
using TouchLove.Domain.Enums;

namespace TouchLove.Infrastructure.Storage;

public class S3FileStorageService : IFileStorageService
{
    private readonly IConfiguration _config;
    private static readonly string[] AllowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"];

    public S3FileStorageService(IConfiguration config)
    {
        _config = config;
    }

    private IAmazonS3 GetClient()
    {
        var accessKey = _config["Storage:S3:AccessKey"];
        var secretKey = _config["Storage:S3:SecretKey"];
        var region = _config["Storage:S3:Region"] ?? "ap-southeast-2";

        var regionEndpoint = RegionEndpoint.GetBySystemName(region);

        if (string.IsNullOrEmpty(accessKey) || string.IsNullOrEmpty(secretKey))
        {
            // Fallback to default credentials (IAM role / profile)
            return new AmazonS3Client(regionEndpoint);
        }

        return new AmazonS3Client(accessKey, secretKey, regionEndpoint);
    }

    public async Task<FileUploadResult> UploadAsync(IFormFile file, string folder, CancellationToken ct = default)
    {
        return await UploadInternalAsync(file, folder, null, ct);
    }

    public async Task<FileUploadResult> UploadWithCustomNameAsync(IFormFile file, string folder, string customFileName, CancellationToken ct = default)
    {
        return await UploadInternalAsync(file, folder, customFileName, ct);
    }

    private async Task<FileUploadResult> UploadInternalAsync(IFormFile file, string folder, string? customFileName, CancellationToken ct = default)
    {
        var mime = file.ContentType;
        var ext = Path.GetExtension(file.FileName).TrimStart('.').ToLower();
        if (string.IsNullOrEmpty(ext))
        {
            ext = mime switch
            {
                "image/jpeg" => "jpg",
                "image/png" => "png",
                "image/webp" => "webp",
                "video/mp4" => "mp4",
                "video/webm" => "webm",
                _ => "bin"
            };
        }

        var bucketName = _config["Storage:S3:BucketName"] ?? "touchlove-bucket";
        var fileName = string.IsNullOrEmpty(customFileName) ? $"{Guid.NewGuid()}.{ext}" : customFileName;
        var fileKey = $"{folder}/{fileName}".Replace("\\", "/").TrimStart('/');

        using var client = GetClient();
        using var stream = file.OpenReadStream();

        var fileTransferUtility = new TransferUtility(client);
        var uploadRequest = new TransferUtilityUploadRequest
        {
            InputStream = stream,
            Key = fileKey,
            BucketName = bucketName,
            ContentType = mime
        };

        // Standard public read setup can be toggled
        // uploadRequest.CannedACL = S3CannedACL.PublicRead;

        await fileTransferUtility.UploadAsync(uploadRequest, ct);

        var publicUrlTemplate = _config["Storage:S3:PublicUrlTemplate"] ?? "https://{bucket}.s3.{region}.amazonaws.com/{key}";
        var region = _config["Storage:S3:Region"] ?? "ap-southeast-2";
        
        var publicUrl = publicUrlTemplate
            .Replace("{bucket}", bucketName)
            .Replace("{region}", region)
            .Replace("{key}", fileKey);

        return new FileUploadResult(fileKey, publicUrl, StorageType.S3);
    }

    public async Task DeleteAsync(string fileIdentifier, CancellationToken ct = default)
    {
        var bucketName = _config["Storage:S3:BucketName"] ?? "touchlove-bucket";
        using var client = GetClient();
        await client.DeleteObjectAsync(bucketName, fileIdentifier, ct);
    }

    public async Task DeleteByUrlAsync(string publicUrl, CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(publicUrl)) return;
        try
        {
            var uri = new Uri(publicUrl);
            var key = uri.AbsolutePath.TrimStart('/');
            if (!string.IsNullOrEmpty(key))
            {
                await DeleteAsync(key, ct);
            }
        }
        catch { }
    }

    public string GetPublicUrl(string fileIdentifier)
    {
        if (fileIdentifier.StartsWith("http://") || fileIdentifier.StartsWith("https://"))
            return fileIdentifier;

        var bucketName = _config["Storage:S3:BucketName"] ?? "touchlove-bucket";
        var region = _config["Storage:S3:Region"] ?? "ap-southeast-2";
        var publicUrlTemplate = _config["Storage:S3:PublicUrlTemplate"] ?? "https://{bucket}.s3.{region}.amazonaws.com/{key}";

        return publicUrlTemplate
            .Replace("{bucket}", bucketName)
            .Replace("{region}", region)
            .Replace("{key}", fileIdentifier);
    }
}
