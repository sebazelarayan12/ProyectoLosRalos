namespace LosRalos.Application.Settings;

public class JwtSettings
{
    public string Secret { get; set; } = string.Empty;
    public int ExpiresInHours { get; set; } = 2;
}
