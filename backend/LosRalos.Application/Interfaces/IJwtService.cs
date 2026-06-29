using LosRalos.Application.Entities;

namespace LosRalos.Application.Interfaces;

public interface IJwtService
{
    string GenerateToken(Usuario usuario);
}
