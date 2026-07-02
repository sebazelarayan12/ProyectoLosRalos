namespace LosRalos.Application.Settings;

public class StorageSettings
{
    public string BasePath { get; set; } = string.Empty;
    public long MaxFileSizeBytes { get; set; } = 10 * 1024 * 1024;
}
