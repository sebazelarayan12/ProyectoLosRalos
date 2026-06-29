FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY LosRalos.sln .
COPY LosRalos.Application/LosRalos.Application.csproj LosRalos.Application/
COPY LosRalos.Infrastructure/LosRalos.Infrastructure.csproj LosRalos.Infrastructure/
COPY LosRalos.Api/LosRalos.Api.csproj LosRalos.Api/
COPY LosRalos.Tests/LosRalos.Tests.csproj LosRalos.Tests/

RUN dotnet restore

COPY . .

RUN dotnet publish LosRalos.Api/LosRalos.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

EXPOSE 5000
ENTRYPOINT ["dotnet", "LosRalos.Api.dll"]
