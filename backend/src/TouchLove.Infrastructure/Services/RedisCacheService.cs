using StackExchange.Redis;
using System.Text.Json;
using TouchLove.Application.Interfaces;

namespace TouchLove.Infrastructure.Services;

public class RedisCacheService : ICacheService
{
    private readonly IDatabase _db;

    public RedisCacheService(IConnectionMultiplexer redis)
    {
        _db = redis.GetDatabase();
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken ct = default)
    {
        var value = await _db.StringGetAsync(key);
        if (!value.HasValue) return default;
        return JsonSerializer.Deserialize<T>(value!);
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan expiry, CancellationToken ct = default)
    {
        var json = JsonSerializer.Serialize(value);
        await _db.StringSetAsync(key, json, expiry);
    }

    public async Task RemoveAsync(string key, CancellationToken ct = default)
        => await _db.KeyDeleteAsync(key);

    public async Task<bool> ExistsAsync(string key, CancellationToken ct = default)
        => await _db.KeyExistsAsync(key);

    public async Task IncrementAsync(string key, TimeSpan? expiry = null, CancellationToken ct = default)
    {
        await _db.StringIncrementAsync(key);
        if (expiry.HasValue)
        {
            var ttl = await _db.KeyTimeToLiveAsync(key);
            if (!ttl.HasValue)
                await _db.KeyExpireAsync(key, expiry.Value);
        }
    }

    public async Task<long> GetCounterAsync(string key, CancellationToken ct = default)
    {
        var value = await _db.StringGetAsync(key);
        return value.HasValue ? (long)value : 0;
    }
}
