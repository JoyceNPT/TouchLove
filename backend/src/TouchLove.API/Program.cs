using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using StackExchange.Redis;
using System.Text;
using TouchLove.Application.Features.Admin;
using TouchLove.Application.Features.Album;
using TouchLove.Application.Features.Auth;
using TouchLove.Application.Features.Couple;
using TouchLove.Application.Features.Keychain;
using TouchLove.Application.Features.Message;
using TouchLove.Application.Interfaces;
using TouchLove.Domain.Entities;
using TouchLove.Infrastructure.BackgroundJobs;
using TouchLove.Infrastructure.Persistence;
using TouchLove.Infrastructure.Persistence.Seeding;
using TouchLove.Infrastructure.Services;
using TouchLove.Infrastructure.Storage;

// ── Serilog bootstrap ─────────────────────────────────────────────────
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    // ── Serilog ───────────────────────────────────────────────────────
    builder.Host.UseSerilog((ctx, lc) => lc
        .ReadFrom.Configuration(ctx.Configuration)
        .WriteTo.Console()
        .Enrich.FromLogContext());

    var cs = builder.Configuration.GetConnectionString("Default")!;
    var redisCs = builder.Configuration["Redis:ConnectionString"]!;

    // ── EF Core + PostgreSQL ──────────────────────────────────────────
    builder.Services.AddDbContext<AppDbContext>(opt =>
        opt.UseNpgsql(cs, npg => npg.MigrationsAssembly("TouchLove.Infrastructure")));
    builder.Services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<AppDbContext>());

    // ── ASP.NET Core Identity ─────────────────────────────────────────
    builder.Services.AddIdentity<User, IdentityRole<Guid>>(opt =>
    {
        opt.Password.RequireDigit = true;
        opt.Password.RequiredLength = 8;
        opt.Password.RequireNonAlphanumeric = true;
        opt.Password.RequireUppercase = true;
        opt.User.RequireUniqueEmail = true;
    })
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

    // ── JWT Authentication ────────────────────────────────────────────
    var jwtKey = builder.Configuration["Jwt:Key"]!;
    builder.Services.AddAuthentication(opt =>
    {
        opt.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        opt.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.Zero
        };
    });

    builder.Services.AddAuthorization();

    // ── Redis ─────────────────────────────────────────────────────────
    builder.Services.AddSingleton<IConnectionMultiplexer>(_ => ConnectionMultiplexer.Connect(redisCs));
    builder.Services.AddScoped<ICacheService, RedisCacheService>();

    // ── Hangfire ──────────────────────────────────────────────────────
    builder.Services.AddHangfire(config => config
        .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
        .UseSimpleAssemblyNameTypeSerializer()
        .UseRecommendedSerializerSettings()
        .UsePostgreSqlStorage(c => c.UseNpgsqlClientFactory(NpgsqlClientFactory.Instance)));

    // Hack: Hangfire Postgres needs this inline because the factory builder needs the connection string
    builder.Services.AddHangfire(config =>
        config.UsePostgreSqlStorage(c =>
            c.UseConnectionString(cs)));

    builder.Services.AddHangfireServer();

    // ── Application Services ──────────────────────────────────────────
    builder.Services.AddScoped<AuthService>();
    builder.Services.AddScoped<KeychainService>();
    builder.Services.AddScoped<CoupleService>();
    builder.Services.AddScoped<AlbumService>();
    builder.Services.AddScoped<MessageService>();
    builder.Services.AddScoped<AdminService>();

    // ── Infrastructure Services ───────────────────────────────────────
    builder.Services.AddScoped<IFileStorageService, LocalFileStorageService>();
    builder.Services.AddScoped<IEmailService, MailKitEmailService>();
    builder.Services.AddScoped<ICaptchaService, GoogleRecaptchaService>();

    builder.Services.AddHttpClient<IAiMessageService, GeminiAiMessageService>();
    builder.Services.AddHttpClient<ICaptchaService, GoogleRecaptchaService>();

    // ── Hangfire Jobs ─────────────────────────────────────────────────
    builder.Services.AddScoped<GenerateDailyMessagesJob>();
    builder.Services.AddScoped<CleanupExpiredTokensJob>();
    builder.Services.AddScoped<CleanupDeletedMemoriesJob>();
    builder.Services.AddScoped<CleanupExpiredInvitationsJob>();
    builder.Services.AddScoped<SendAnniversaryEmailsJob>();
    builder.Services.AddScoped<CleanupNfcScanLogsJob>();

    // ── CORS ──────────────────────────────────────────────────────────
    builder.Services.AddCors(opt => opt.AddDefaultPolicy(p =>
    {
        p.WithOrigins(builder.Configuration["Frontend:Url"] ?? "http://localhost:3000")
         .AllowAnyHeader()
         .AllowAnyMethod()
         .AllowCredentials(); // Required for HttpOnly cookies
    }));

    // ── Controllers + Swagger ─────────────────────────────────────────
    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new() { Title = "TouchLove API", Version = "v1" });
        c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
        {
            Name = "Authorization", Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
            Scheme = "Bearer", BearerFormat = "JWT", In = Microsoft.OpenApi.Models.ParameterLocation.Header
        });
        c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
        {
            {
                new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                {
                    Reference = new Microsoft.OpenApi.Models.OpenApiReference
                    {
                        Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "Bearer"
                    }
                },
                Array.Empty<string>()
            }
        });
    });

    // ── File upload size limit ────────────────────────────────────────
    builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(opt =>
        opt.MultipartBodyLengthLimit = 11 * 1024 * 1024); // 11MB

    var app = builder.Build();

    // ── Migrate & Seed ────────────────────────────────────────────────
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();

        if (app.Environment.IsDevelopment())
        {
            var userMgr = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
            var roleMgr = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
            await DataSeeder.SeedAsync(db, userMgr, roleMgr);
        }
    }

    // ── Middleware pipeline ───────────────────────────────────────────
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.UseSerilogRequestLogging();
    app.UseCors();

    // Static files (for LocalFileStorageService uploads)
    app.UseStaticFiles();

    app.UseAuthentication();
    app.UseAuthorization();

    // Hangfire dashboard (dev only)
    if (app.Environment.IsDevelopment())
    {
        app.UseHangfireDashboard("/hangfire", new DashboardOptions
        {
            Authorization = [] // No auth in dev
        });
    }

    // ── Register recurring Hangfire jobs ──────────────────────────────
    RecurringJob.AddOrUpdate<GenerateDailyMessagesJob>("generate-daily-messages",
        j => j.ExecuteAsync(), "0 17 * * *"); // 00:00 GMT+7 = 17:00 UTC

    RecurringJob.AddOrUpdate<CleanupExpiredTokensJob>("cleanup-expired-tokens",
        j => j.ExecuteAsync(), "0 2 * * *");

    RecurringJob.AddOrUpdate<CleanupDeletedMemoriesJob>("cleanup-deleted-memories",
        j => j.ExecuteAsync(), "0 3 * * *");

    RecurringJob.AddOrUpdate<CleanupExpiredInvitationsJob>("cleanup-expired-invitations",
        j => j.ExecuteAsync(), "0 * * * *");

    RecurringJob.AddOrUpdate<SendAnniversaryEmailsJob>("send-anniversary-emails",
        j => j.ExecuteAsync(), "0 8 * * *");

    RecurringJob.AddOrUpdate<CleanupNfcScanLogsJob>("cleanup-nfc-scan-logs",
        j => j.ExecuteAsync(), "0 4 * * 0");

    app.MapControllers();

    await app.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application failed to start.");
}
finally
{
    await Log.CloseAndFlushAsync();
}
