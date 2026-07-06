using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using LosRalos.Api.Middleware;
using LosRalos.Application.Entities;
using LosRalos.Application.Entities.Enums;
using LosRalos.Application.Interfaces;
using LosRalos.Application.Services;
using LosRalos.Application.Settings;
using LosRalos.Infrastructure.Persistence;
using LosRalos.Infrastructure.Persistence.Interceptors;
using LosRalos.Infrastructure.Persistence.Repositories;
using LosRalos.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", false);

var builder = WebApplication.CreateBuilder(args);

// Settings
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<AuditSettings>(builder.Configuration.GetSection("Audit"));
builder.Services.Configure<StorageSettings>(builder.Configuration.GetSection("Storage"));

if (string.IsNullOrWhiteSpace(builder.Configuration["Audit:HmacKey"]))
    throw new InvalidOperationException("Audit:HmacKey no configurado.");

// DB
builder.Services.AddSingleton<TimestampInterceptor>();
builder.Services.AddDbContext<AppDbContext>((sp, opts) =>
    opts.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
        .AddInterceptors(sp.GetRequiredService<TimestampInterceptor>()));

// Auth
var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("Jwt:Secret no configurado.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// CORS
var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? [];

builder.Services.AddCors(opts =>
{
    opts.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins(corsOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

// Rate limiting
builder.Services.Configure<ForwardedHeadersOptions>(opts =>
{
    opts.ForwardedHeaders = ForwardedHeaders.XForwardedFor;
    // Red interna Docker — 172.16.0.0/12
    opts.KnownNetworks.Add(new Microsoft.AspNetCore.HttpOverrides.IPNetwork(
        System.Net.IPAddress.Parse("172.16.0.0"), 12));
});

builder.Services.AddRateLimiter(opts =>
{
    // AddSlidingWindowLimiter(name, options) crea un limiter global (una sola cuenta compartida
    // por todos los llamantes) — no sirve para "5 intentos por IP". Se particiona por IP a mano,
    // igual que el GlobalLimiter de abajo.
    opts.AddPolicy("LoginRateLimit", ctx =>
    {
        var key = ctx.Connection.RemoteIpAddress?.ToString() ?? "anon";

        return RateLimitPartition.GetSlidingWindowLimiter(key, _ => new SlidingWindowRateLimiterOptions
        {
            PermitLimit = 5,
            Window = TimeSpan.FromMinutes(10),
            SegmentsPerWindow = 2,
            QueueLimit = 0
        });
    });

    opts.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(ctx =>
    {
        var key = ctx.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? ctx.Connection.RemoteIpAddress?.ToString()
            ?? "anon";

        return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 100,
            Window = TimeSpan.FromMinutes(1)
        });
    });

    opts.OnRejected = async (ctx, ct) =>
    {
        ctx.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        await ctx.HttpContext.Response.WriteAsJsonAsync(
            new { type = "RateLimitExceeded", message = "Demasiadas solicitudes. Intente mas tarde." }, ct);
    };
});

// DI — Services
builder.Services.AddScoped<IUsuarioRepository, UsuarioRepository>();
builder.Services.AddScoped<IAuditLogRepository, AuditLogRepository>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddSingleton<IJwtService, JwtService>();
builder.Services.AddSingleton<IPasswordHasher, BcryptPasswordHasher>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUsuarioService, UsuarioService>();
builder.Services.AddScoped<IProfesionalRepository, ProfesionalRepository>();
builder.Services.AddScoped<IProfesionalService, ProfesionalService>();
builder.Services.AddScoped<IDocumentoRepository, DocumentoRepository>();
builder.Services.AddScoped<ITipoDocumentoRepository, TipoDocumentoRepository>();
builder.Services.AddScoped<IDocumentoService, DocumentoService>();
builder.Services.AddSingleton<IFileStorageService, FileStorageService>();

// Controllers + Swagger
builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    })
    .ConfigureApiBehaviorOptions(opts =>
    {
        opts.InvalidModelStateResponseFactory = ctx =>
        {
            var errors = ctx.ModelState
                .Where(e => e.Value?.Errors.Count > 0)
                .ToDictionary(
                    e => e.Key,
                    e => e.Value!.Errors[0].ErrorMessage);
            return new Microsoft.AspNetCore.Mvc.BadRequestObjectResult(
                new { type = "ValidationError", message = "Datos invalidos", errors });
        };
    });
builder.Services.AddEndpointsApiExplorer();

if (builder.Environment.IsDevelopment())
    builder.Services.AddSwaggerGen();

var app = builder.Build();

// Migrations automaticas en startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

// Seed admin inicial (opcional, via env vars — nunca hardcodeado)
var seedAdminEmail = builder.Configuration["SEED_ADMIN_EMAIL"];
if (!string.IsNullOrWhiteSpace(seedAdminEmail))
{
    using var seedScope = app.Services.CreateScope();
    var db = seedScope.ServiceProvider.GetRequiredService<AppDbContext>();

    var yaExiste = await db.Usuarios.AnyAsync(u => u.Email == seedAdminEmail);
    if (!yaExiste)
    {
        var seedAdminPassword = builder.Configuration["SEED_ADMIN_PASSWORD"]
            ?? throw new InvalidOperationException("SEED_ADMIN_PASSWORD no configurado.");
        var seedAdminNombre = builder.Configuration["SEED_ADMIN_NOMBRE"] ?? "Administrador";
        var hasher = seedScope.ServiceProvider.GetRequiredService<IPasswordHasher>();

        db.Usuarios.Add(new Usuario
        {
            Id = Guid.NewGuid(),
            Nombre = seedAdminNombre,
            Email = seedAdminEmail,
            PasswordHash = hasher.Hash(seedAdminPassword),
            Rol = RolUsuario.Admin,
            Activo = true
        });

        await db.SaveChangesAsync();
    }
}

app.UseMiddleware<GlobalExceptionHandlerMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseForwardedHeaders();
app.UseCors("Frontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseMiddleware<ActiveUserMiddleware>();
app.UseAuthorization();
app.MapControllers();

app.MapGet("/health", () => Results.Ok(new { status = "healthy" })).AllowAnonymous();

app.Run();

public partial class Program { }
