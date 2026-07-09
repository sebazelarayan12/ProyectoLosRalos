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

## Patrones establecidos (Paso 3)

### Cursor-based pagination

Usar (Apellido, FechaCreacion) como clave del cursor — NO Guid como secundario (C# no tiene > para Guid y EF Core no traduce Guid.CompareTo). DateTime si traduce a SQL con >. Encodar como base64(JSON).

En EF Core LINQ para comparar strings: `string.Compare(a, b) > 0` — se traduce a SQL. NO usar `a > b` en C# (CS0019).

`AuditLogRepository.SearchAsync` usa cursor de una sola clave (`Timestamp`, sin tiebreak por Id) —
distinto del patron `(Apellido, FechaCreacion)` de Profesional. Tradeoff aceptado: volumen de audit
en este proyecto es bajo (100-500 usuarios), colision exacta de `Timestamp` entre dos entradas es
improbable. Mismo criterio de tradeoff que `TipoDocumento.GetOrCreateAsync`.

### Check constraints en EF Core 8

Usar `builder.ToTable("tabla", t => { t.HasCheckConstraint(...); })` — NO `builder.HasCheckConstraint(...)` directo (obsoleto CS0618).
Siempre citar columnas con doble comilla en SQL de constraints: `"\"ColumnaName\" IN ('Valor1', 'Valor2')"`.

### GIN trigram index

No configurable via fluent API. Agregar como SQL crudo en migration:
```csharp
migrationBuilder.Sql(@"CREATE EXTENSION IF NOT EXISTS pg_trgm;");
migrationBuilder.Sql(@"CREATE INDEX idx_X_apellido_trgm ON tabla USING GIN (""Apellido"" gin_trgm_ops);");
```
Agregar DROP correspondiente en Down():
```csharp
migrationBuilder.Sql(@"DROP INDEX IF EXISTS idx_X_apellido_trgm;");
```

### appsettings.Testing.json — OBLIGATORIO para integration tests

Cuando los tests usan `UseEnvironment("Testing")`, ASP.NET no carga `appsettings.Development.json`. Si `appsettings.json` tiene `Jwt:Secret: ""`, `SymmetricSecurityKey(byte[0])` lanza `ArgumentException` en startup y todos los requests devuelven 500.

SIEMPRE crear `appsettings.Testing.json` con los mismos secretos que inyectan los tests via `ConfigureAppConfiguration`. Los valores deben coincidir exactamente.

### File storage — validacion y path seguro (Paso 4)

`FileStorageService` (Infrastructure/Services) nunca confia en el Content-Type declarado por el
cliente ni en la extension del nombre de archivo. Detecta el tipo real leyendo los primeros bytes
(magic bytes) contra un allowlist fijo (jpeg/png/pdf) — cualquier otro tipo se rechaza con
`AppValidationException` (400), sin importar que extension traiga el archivo.

`LimitedStream` (Infrastructure/Services) envuelve el stream de entrada y lanza `IOException` al
superar `MaxFileSizeBytes` — se atrapa en el service y se traduce a `AppValidationException`.
Nunca confiar solo en `Content-Length` del request.

El nombre fisico del archivo SIEMPRE se genera con `Guid.NewGuid()` + la extension del tipo
detectado (no la del nombre original). `NombreOriginal` se guarda sanitizado (solo se filtran
caracteres de control con `char.IsControl`, se trunca a 255) unicamente como metadata para mostrar
en UI — nunca se usa para construir el path fisico.

Antes de leer o borrar un archivo, `ResolverPathSeguro` verifica con `Path.GetFullPath` que el path
resuelto arranca con el `BasePath` configurado — bloquea path traversal aunque el path se construya
siempre internamente (defensa en profundidad).

`IFormFile` requiere que el controller este en un proyecto Web SDK (`LosRalos.Api` ya lo es) — no
agregar dependencia de ASP.NET Core a `LosRalos.Infrastructure`, que sigue siendo SDK normal sin
`Microsoft.NET.Sdk.Web`. El controller extrae `Stream` + `FileName` del `IFormFile` y se los pasa al
service como tipos primitivos.

### TipoDocumento — catalogo dinamico get-or-create (Paso 4)

`TipoDocumentoRepository.GetOrCreateAsync` compara con `.ToLower() == nombre.ToLower()` (traduce a
`lower()` en Postgres, usa el indice `idx_tipo_documento_nombre_lower`). No hay manejo de race
condition en creacion concurrente del mismo nombre — el indice UNIQUE en DB previene el duplicado
pero una insercion concurrente lanzaria `DbUpdateException` sin capturar. Aceptable para MVP
(100-500 usuarios, subida de documentos no es una operacion de alta concurrencia sobre el mismo tipo).

`Nombre` siempre se normaliza a mayusculas (`.Trim().ToUpperInvariant()`) antes de comparar o
guardar — convención para que el catalogo quede consistente sin importar el casing que tipee el
usuario en el combobox del frontend. El seed inicial de Paso 4 (`Dni Frente`, `Titulo`, etc., en la
migration `AddDocumentos`) se normalizo a mayusculas via una migration de datos separada
(`NormalizarTipoDocumentoMayusculas`, solo `UPDATE ... SET "Nombre" = UPPER("Nombre")`) — no se
edito la migration original (regla: nunca tocar una migration ya aplicada).

### AuditLog — DetalleExtra en edicion

`DetalleExtra` para `EditarProfesional` = nombres de campos cambiados separados por coma, SIN valores (privacidad). `ApplyPatch` retorna `List<string>` de nombres. No incluir campos que no cambiaron.

### Seguridad — ProfesionalResumenResponse

Decision revertida (2026-07-09): `ProfesionalResumenResponse` (listado, `GET /profesionales`) SI incluye
`Dni`/`Cuil` — pedido explicito del usuario para verlos en la pantalla de busqueda. A diferencia de
`ProfesionalDetalleResponse` (`GET /{id}`), el listado NO registra `VerLegajo` en AuditLog — decision
consciente de dejarlo sin auditar por ahora. Si se agrega auditoria de listado en el futuro, usar una
accion distinta a `VerLegajo` (no es "ver un legajo puntual", es "ver un listado con datos sensibles").

### Rate limiting de login — particionado por IP, no global (Paso 12)

`AddSlidingWindowLimiter(nombre, opciones)` crea un limiter GLOBAL (una sola cuenta compartida por
todos los llamantes), no particionado por IP — a pesar de que el nombre de la politica sea
"LoginRateLimit". Con eso, 5 intentos fallidos de CUALQUIER usuario/IP bloqueaban el login para
TODOS (bug de disponibilidad, y no cumplia "5 intentos por IP" del spec Sec. 9 A07). Fix: `AddPolicy`
con `RateLimitPartition.GetSlidingWindowLimiter` particionado por `ctx.Connection.RemoteIpAddress`,
mismo patron que ya usaba el `GlobalLimiter`. Si se agrega otro rate limit con
`Add<Algoritmo>Limiter(nombre, opciones)` (sin partitioner), va a tener el mismo problema — usar
siempre `AddPolicy` + `RateLimitPartition` cuando el limite debe ser por IP/usuario.

### `Audit:HmacKey` — fail-fast en startup (Paso 12)

Igual que `Jwt:Secret`, si `Audit:HmacKey` esta vacio el arranque debe fallar (antes solo tiraba con
clave vacia en runtime, silenciosamente debil). Guard agregado en `Program.cs` junto a la validacion
de `Jwt:Secret`.

### QA + Hardening (Paso 12) — hallazgos y pendientes

Hecho:
- `frontend/Dockerfile` + `frontend/nginx.conf` creados (no existian — `docker-compose.yml` ya los
  referenciaba, el build fallaba). Headers de seguridad exactos del spec Sec. 9 A05 (CSP,
  X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy). Proxy `/api/` hacia
  el servicio `api` interno (no expuesto directo al host).
- `.dockerignore` en `backend/` y `frontend/`.
- `.env.example` completado con `Jwt__Secret`, `Audit__HmacKey`, `Cors__AllowedOrigins__0` (faltaban
  por completo — el arranque fallaria en cualquier deploy que solo siguiera el `.env.example` viejo).
- `dotnet list package --vulnerable`: 2 paquetes transitivos High (`System.Net.Http` 4.3.0,
  `System.Text.RegularExpressions` 4.3.0) traidos por `Testcontainers.PostgreSql` en
  `LosRalos.Tests`. Fix: pin directo a versiones parcheadas (4.3.4 / 4.3.1) en el `.csproj` — NuGet
  resuelve a la version mas alta cuando hay referencia directa. `npm audit` en frontend: 0
  vulnerabilidades.
- Test nuevo `Login_SeisIntentosFallidos_SextoRetorna429` (faltaba, item explicito del checklist
  pre-deploy del spec).
- Healthcheck agregado al servicio `frontend` en `docker-compose.yml` (faltaba, `db` y `api` ya
  tenian).

Pendiente — requiere decision de arquitectura/deploy, no se toco sin avisar:
- Usuario de PostgreSQL con permisos minimos (hoy `POSTGRES_USER` es superusuario del contenedor via
  imagen oficial). Separar en un rol de arranque (migrations, DDL) y un rol de runtime (solo
  SELECT/INSERT/UPDATE/DELETE) es un cambio de infraestructura de deploy, no algo para implementar
  sin acuerdo.
- HTTPS con certificado real, SSL en connection string — spec ya lo marca como pendiente de hosting
  definitivo (Sec. 14).
- PDF viewer en iOS Safari — requiere prueba manual en dispositivo real, no automatizable desde aca.

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
