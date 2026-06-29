namespace LosRalos.Application.DTOs.Shared;

public class PaginatedResponse<T>
{
    public List<T> Items { get; init; } = [];
    public int PorPagina { get; init; }
    public bool HasNextPage { get; init; }
    public string? Cursor { get; init; }
}
