namespace LosRalos.Application.Entities;

public class TipoDocumento
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public DateTime FechaCreacion { get; set; }
}
