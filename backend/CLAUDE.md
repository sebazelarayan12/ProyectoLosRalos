# Legajos Digitales Backend — AI Agent Ruleset

Reglas especificas para el agente que trabaja dentro de `backend/`.
El spec autoritativo esta en `docs/specs/2026-06-28-legajos-digitales-design.md` — leerlo antes de cualquier tarea.

---

## Regla global inamovible

Nunca escribas tildes en ninguna palabra ni mensaje, sin importar el contexto.

---

## Skills disponibles

| Skill | Cuando usarlo |
|-------|---------------|
| `dotnet-best-practices` | Crear o editar entities, services, controllers, repositorios |
| `api-design-principles` | Disenar endpoints REST, definir contratos HTTP |
| `systematic-debugging` | Depurar excepciones, fallos de API, tests fallidos |
| `test-driven-development` | Implementar cualquier feature (tests antes de codigo) |
| `brainstorming` | Evaluar enfoques antes de implementar algo nuevo |
| `supabase-postgres-best-practices` | Optimizar queries, schema, indices en PostgreSQL |
| `security-review` | Revisar seguridad de endpoints, manejo de archivos, auth |
| `judgment-day` | Revision adversarial antes de marcar un paso como completo |

**Auto-invocar antes de escribir codigo:**

| Accion | Skill obligatorio |
|--------|-------------------|
| Crear/editar entidades, services, controllers, repos | `dotnet-best-practices` |
| Disenar un endpoint nuevo | `api-design-principles` |
| Depurar error en runtime o test fallido | `systematic-debugging` |
| Implementar nueva feature (cualquier paso) | `test-driven-development` |
| Elegir entre dos enfoques de implementacion | `brainstorming` |
| Escribir o revisar una migration o query compleja | `supabase-postgres-best-practices` |
| Tocar auth, file upload, o datos sensibles | `security-review` |

---

## Reglas criticas — inamovibles

### Entidades y PKs

- SIEMPRE `Guid` como PK con `ValueGeneratedOnAdd()` y `HasDefaultValueSql("gen_random_uuid()")`
- NUNCA `int` o `long` secuenciales como ID — previene enumeracion de datos sensibles
- SIEMPRE enums con `HasConversion<string>()` + `HasCheckConstraint()` en la configuracion EF
- NUNCA dejar que EF mapee enums como `int` a la DB (guarda "Asistencial", no 0)

### Capa Application

- SIEMPRE interfaces de repositorios en `Application/Interfaces/`
- SIEMPRE implementaciones en `Infrastructure/Persistence/Repositories/`
- NUNCA acceder a `AppDbContext` fuera de Infrastructure
- SIEMPRE DTOs tipados: `<Entidad>Request` para entrada, `<Entidad>Response` para salida
- SIEMPRE mapeos via extension methods explicitos (`<Entidad>MappingExtensions`) — sin AutoMapper
- NUNCA compartir el mismo DTO entre POST y PATCH (semanticas distintas)

### Controllers

- SIEMPRE `[ApiController]` + `[Route("api/v1/[controller]")]`
- SIEMPRE recibir y retornar DTOs — nunca entidades EF
- NUNCA logica de negocio en controllers — solo delegar al service
- SIEMPRE aceptar `CancellationToken ct` en cada action
- SIEMPRE `ConfigureAwait(false)` en cada `await`

### Excepciones y errores

- `NotFoundException` → 404
- `AppValidationException(field, message)` → 400 con `{ errors: { campo: "mensaje" } }`
- `ForbiddenException` → 403
- `UnauthorizedException` → 401
- NUNCA lanzar `Exception` generica para errores de negocio
- NUNCA exponer stack trace fuera de Development

### Secretos y configuracion

- NUNCA hardcodear secretos, passwords, ni connection strings reales
- SIEMPRE `IOptions<T>` para settings tipados
- SIEMPRE `DateTime.UtcNow` — NUNCA `DateTime.Now`
- SIEMPRE `timestamptz` en PostgreSQL (ya configurado con `Npgsql.EnableLegacyTimestampBehavior=false`)

### Logging

- SIEMPRE `ILogger<T>` con structured logging: `_logger.LogInformation("Texto {Param}", valor)`
- NUNCA loguear DNI, CUIL, domicilio, email del profesional, ni contenido de archivos
- NUNCA usar string interpolation en logs — vulnera structured logging

### AuditLog

- SIEMPRE registrar los eventos definidos en `AccionAudit` (ver spec Sec. 7 / Sec. 9)
- NUNCA hacer DELETE ni UPDATE sobre `audit_logs` — append-only sin excepciones
- SIEMPRE `Timestamp = DateTime.UtcNow` en cada entrada

### Archivos

- NUNCA servir archivos como estaticos desde Nginx/wwwroot
- SIEMPRE validar magic bytes + extension + tamanio antes de guardar
- SIEMPRE renombrar al guardar (`Guid.NewGuid() + extension`) — nunca usar nombre original
- SIEMPRE verificar que el path resuelto empieza con `_allowedBasePath` antes de servir

### Migrations

- SIEMPRE generar migration con `dotnet ef migrations add <Nombre> --project LosRalos.Infrastructure --startup-project LosRalos.Api`
- NUNCA editar una migration ya aplicada en el repo
- Las migrations se aplican automaticamente en startup via `context.Database.Migrate()`

---

## Arboles de decision

### Donde va la logica nueva?

```
Es solo enrutamiento y delegacion al service?
  ├─ SI  → Controller
  └─ NO  → Es acceso directo a DB?
              ├─ SI  → Repository
              └─ NO  → Service (Application layer)
```

### Que excepcion lanzar?

```
El recurso no existe?
  ├─ SI  → NotFoundException("Profesional no encontrado")
  └─ NO  → El input del usuario es invalido?
              ├─ SI  → AppValidationException("campo", "mensaje descriptivo")
              └─ NO  → El usuario no tiene permiso?
                          ├─ SI  → ForbiddenException
                          └─ NO  → No esta autenticado? → UnauthorizedException
```

### Nuevo secreto necesario?

```
1. Agregar en appsettings.json con valor ""
2. Agregar en appsettings.Development.json con valor "dev-only-..."
3. Crear clase Settings en Application/Settings/
4. Registrar con builder.Services.Configure<T>(config.GetSection("..."))
5. Avisar al usuario que agregue la variable real en .env
```

---

## Tech stack

| Componente | Version |
|------------|---------|
| .NET | 8 |
| ASP.NET Core Web API | 8 |
| Entity Framework Core | 8 (Npgsql 8.0.11) |
| PostgreSQL | 16 |
| BCrypt.Net-Next | 4.x (cost factor 12) |
| System.IdentityModel.Tokens.Jwt | 7.x |
| xUnit + FluentAssertions + NSubstitute | - |
| Testcontainers.PostgreSql | 3.x |

---

## Estructura del proyecto

```
backend/
├── LosRalos.Api/
│   ├── Controllers/          <- un archivo por recurso
│   ├── Middleware/            <- GlobalExceptionHandlerMiddleware, ActiveUserMiddleware
│   └── Program.cs             <- DI, JWT, rate limiting, middlewares
├── LosRalos.Application/
│   ├── DTOs/                  <- <Entidad>Request, <Entidad>Response, Patch<Entidad>Request
│   ├── Entities/
│   │   └── Enums/             <- RolUsuario, AccionAudit, TipoDocumento, etc.
│   ├── Exceptions/            <- NotFoundException, AppValidationException, etc.
│   ├── Interfaces/            <- IRepository, IService, IJwtService, IPasswordHasher
│   ├── Services/              <- AuthService, ProfesionalService, etc.
│   └── Settings/              <- JwtSettings, AuditSettings, StorageSettings
├── LosRalos.Infrastructure/
│   ├── Persistence/
│   │   ├── Configurations/    <- IEntityTypeConfiguration<T> por entidad
│   │   ├── Interceptors/      <- TimestampInterceptor
│   │   ├── Migrations/        <- generadas por dotnet-ef
│   │   ├── Repositories/      <- implementaciones concretas
│   │   ├── AppDbContext.cs
│   │   └── AppDbContextFactory.cs
│   └── Services/              <- JwtService, BcryptPasswordHasher, FileStorageService
└── LosRalos.Tests/
    ├── Unit/Services/         <- mocks con NSubstitute
    └── Integration/Api/       <- WebApplicationFactory + Testcontainers
```

---

## Comandos

```bash
# Build
dotnet build LosRalos.sln

# Correr local (requiere Postgres en localhost)
dotnet run --project LosRalos.Api

# Tests unitarios (rapidos, sin Docker)
dotnet test --filter "FullyQualifiedName~Unit"

# Tests de integracion (requiere Docker para Testcontainers)
dotnet test --filter "FullyQualifiedName~Integration"

# Todos los tests
dotnet test LosRalos.Tests

# Nueva migration
dotnet ef migrations add <NombreMigration> --project LosRalos.Infrastructure --startup-project LosRalos.Api

# Docker (desde raiz del proyecto)
docker-compose up -d
```

---

## Checklist QA (antes de dar un paso por completo)

- [ ] Migration creada y aplicada sin errores
- [ ] Enums con `HasConversion<string>()` y check constraints
- [ ] Timestamps todos en UTC (`DateTime.UtcNow`)
- [ ] AuditLog registrado en cada accion sensible del paso
- [ ] Sin datos personales en logs (grep "Dni\|Cuil\|Domicilio" en logs)
- [ ] Secretos solo en env vars / `appsettings.Development.json`
- [ ] Tests unitarios verdes: `dotnet test --filter "FullyQualifiedName~Unit"`
- [ ] Controllers retornan DTOs, no entidades EF
- [ ] Swagger deshabilitado en Production (verificar `if IsDevelopment`)
- [ ] `ConfigureAwait(false)` en todos los `await` de services y repos

---

## Convenciones de nomenclatura

| Artefacto | Patron | Ejemplo |
|-----------|--------|---------|
| Entidad | PascalCase | `Profesional`, `AuditLog` |
| DTO entrada POST | `<Entidad>Request` | `ProfesionalRequest` |
| DTO entrada PATCH | `Patch<Entidad>Request` | `PatchProfesionalRequest` |
| DTO salida | `<Entidad>Response` | `ProfesionalResponse` |
| Interface service | `I<Entidad>Service` | `IAuthService` |
| Clase service | `<Entidad>Service` | `AuthService` |
| Interface repo | `I<Entidad>Repository` | `IProfesionalRepository` |
| Clase repo | `<Entidad>Repository` | `ProfesionalRepository` |
| Controller | `<Entidades>Controller` | `ProfesionalesController` |
| Config EF | `<Entidad>Configuration` | `ProfesionalConfiguration` |
| Extension mapeo | `<Entidad>MappingExtensions` | `ProfesionalMappingExtensions` |

---

## Convenciones de API

- Base route: `api/v1/[controller]`
- JSON: camelCase automatico (System.Text.Json default)
- Paginacion cursor-based — response: `{ items, porPagina, hasNextPage, cursor }`
- NUNCA `total`, `totalPaginas` en response — requiere `COUNT(*)` full scan
- Error response: `{ type, message, errors? }`
- PATCH para updates parciales — todos los campos nullable en `Patch<Entidad>Request`
- POST exitoso → 201 + header `Location: /api/v1/recurso/{id}`
- DELETE → soft delete, retorna 204
- Auth: Bearer JWT en header `Authorization`
- Swagger: solo en `Development`, deshabilitado en `Production`
