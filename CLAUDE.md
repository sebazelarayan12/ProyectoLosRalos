# Legajos Digitales — Hospital Los Ralos

Sistema web para consulta y gestion de legajos digitales de profesionales del hospital.

## Delegacion de contexto

Cada subcarpeta tiene su propio `CLAUDE.md` con reglas especificas:

- `backend/CLAUDE.md` — reglas, convenciones y checklist para trabajo en .NET/C#
- `frontend/CLAUDE.md` — reglas, convenciones y checklist para trabajo en React/Vite

Cuando trabajes dentro de `backend/` o `frontend/`, el `CLAUDE.md` de esa carpeta aplica ademas de este.
En caso de contradiccion, el `CLAUDE.md` mas especifico (subcarpeta) gana — excepto el spec, que siempre gana a todo.

---

## Infraestructura — Dokploy

El deploy vive en Dokploy (VPS Contabo, acceso via Tailscale). Hay MCP oficial configurado (`dokploy-mcp`).

**Regla:** cualquier consulta o accion sobre Dokploy (proyectos, environments, servicios, deploys, variables de entorno, dominios, logs) SIEMPRE usa el MCP `dokploy-mcp` — nunca asumir estado ni sugerir pasos manuales en el panel sin antes consultar el MCP.

---

## Skills — uso obligatorio

Si la tarea coincide con un skill disponible en `<available_skills>`, invocarlo con la herramienta `Skill` ANTES de generar codigo o respuesta. Esto no es opcional.

### Backend

| Accion | Skill |
|--------|-------|
| Crear o editar entidades, services, controllers, repositorios | `dotnet-best-practices` |
| Disenar un endpoint REST o definir contrato HTTP | `api-design-principles` |
| Implementar cualquier feature (tests primero) | `test-driven-development` |
| Depurar excepciones, errores de runtime o tests fallidos | `systematic-debugging` |
| Elegir entre dos enfoques de implementacion | `brainstorming` |
| Escribir o revisar una migration o query compleja | `supabase-postgres-best-practices` |
| Tocar auth, file upload, datos sensibles | `security-review` |

### Frontend

| Accion | Skill |
|--------|-------|
| Disenar pantalla, componente o layout | `ui-ux-pro-max` + `frontend-design` |
| Implementar componentes React, hooks, routing | `vercel-react-best-practices` |
| Inicializar o agregar componentes shadcn/ui | `shadcn` |
| Implementar cualquier feature (tests primero) | `test-driven-development` |
| Depurar comportamiento inesperado en UI | `systematic-debugging` |
| Elegir entre enfoques de estado o arquitectura | `brainstorming` |
| Revision de calidad React post-cambio | `react-doctor` |

### React doctor — obligatorio post-cambio frontend

Despues de cada cambio dentro de `frontend/`, correr:

```bash
npx -y react-doctor@latest . --verbose --diff
```

Resolver todas las advertencias antes de commitear. Si queda alguna abierta, documentarla.

---

## Mantenimiento de CLAUDE.md de subcarpetas

Al terminar cada paso del spec, revisar si `backend/CLAUDE.md` o `frontend/CLAUDE.md` necesita actualizacion:

- Nueva convencion establecida durante el paso → agregarla
- Nuevo patron de nombrado o estructura descubierta → agregarla
- Gotcha o restriccion tecnica encontrada → agregarla
- Regla que ya no aplica → removerla

No actualizar mecanicamente — solo cuando hay informacion nueva que un agente futuro necesitaria saber y que no esta ya en el spec ni en el CLAUDE.md existente.

---

## Spec autoritativo — LEER ANTES DE CUALQUIER TAREA

El spec completo del proyecto esta en:

```
docs/specs/2026-06-28-legajos-digitales-design.md
```

**OBLIGATORIO:** antes de escribir codigo, crear archivos, o tomar decisiones tecnicas, leer
el spec. Contiene el modelo de datos definitivo, endpoints, seguridad, convenciones, orden de
implementacion, y decisiones ya tomadas. NO asumir nada que no este en el spec — verificar ahi primero.

El spec es la fuente de verdad. Si hay contradiccion entre el spec y este CLAUDE.md, el spec gana.

---

## Contexto

- Hospital: Los Ralos, Tucumán, Argentina (SI.PRO.SA / Ministerio de Salud Pública)
- Profesionales: entre 100 y 500 agentes
- Tipos de legajo: Asistencial (ej: odontólogos) y Administrativo
- Desarrollador: Sebastián Zelarayan (estudiante UTN FRT, 4° año ISI)

## Reglas de escritura

- Sin emojis en ningun output — codigo, prose, comentarios, commits.
- Sin acentos (tildes) en ningun output — usar `a`, `e`, `i`, `o`, `u` en lugar de `á`, `é`, `í`, `ó`, `ú`.

## Stack decidido

- **Backend:** C# .NET 8 Web API
- **Frontend:** React + Vite
- **Base de datos:** PostgreSQL 16
- **ORM:** Entity Framework Core
- **Contenedores:** Docker + docker-compose
- **Auth:** JWT (expiración corta, 1-2hs)
- **Passwords:** BCrypt

## Estructura de carpetas raiz

```
backend/    ← solucion .NET completa
frontend/   ← React + Vite (pendiente Paso 5)
docs/       ← spec y documentacion
```

## Arquitectura backend — 3 capas

```
backend/LosRalos.Api            ← Controllers, middlewares, auth
backend/LosRalos.Application    ← Services, interfaces de repos, DTOs, entidades
backend/LosRalos.Infrastructure ← EF Core, repositorios, file storage
```

- Sin CQRS / MediatR — Services directos. La lógica no lo justifica.
- Dependencia hacia adentro: Api → Application ← Infrastructure
- Domain va dentro de Application (entidades sin lógica de negocio compleja)

## Roles de usuario

| Rol | Permisos |
|-----|----------|
| `admin` | CRUD completo: profesionales, documentos, usuarios |
| `visor` | Solo lectura (GET) |

## PKs: GUID (no enteros secuenciales)

Todos los IDs son `Guid` (UUID v4). Razón: previene ataques de enumeración sobre datos sensibles (DNI, documentos personales). En PostgreSQL tipo `uuid`, en EF Core `ValueGeneratedOnAdd()`.

## Modelo de datos (entidades)

Ver spec Sec. 4 para el modelo completo y actualizado. Resumen de entidades:
- `Profesional` — datos del agente
- `Documento` — archivos con soft delete (`EliminadoEn`)
- `Usuario` — usuarios del sistema con `FechaActualizacion`
- `AuditLog` — append-only, con acciones de gestion de usuarios incluidas

## REGLA IRROMPIBLE — Secretos y variables sensibles

**NUNCA** escribir en ningun archivo del repo:
- Passwords reales
- JWT secrets reales
- Connection strings con credenciales reales
- API keys, tokens, o cualquier valor secreto
- Claves HMAC o de cifrado reales

Esto incluye: codigo fuente, `appsettings.json`, `docker-compose.yml`, comentarios, commits, tests.

**Cuando se necesita agregar un nuevo secreto**, NO escribirlo. En cambio:

1. Agregar la variable a `.env.example` con un valor placeholder descriptivo:
   ```
   NOMBRE_VARIABLE=descripcion-de-que-va-aqui
   ```
2. Agregar la variable a `appsettings.json` con valor vacio `""` o `null`
3. En `appsettings.Development.json` usar un valor de desarrollo obvio y no real:
   ```json
   "MiSecreto": "dev-only-no-usar-en-produccion"
   ```
4. Decirle al usuario exactamente:
   > "Necesitas agregar `NOMBRE_VARIABLE` en tu archivo `.env` (que esta en `.gitignore`).
   > El valor debe ser [descripcion: ej. minimo 32 caracteres aleatorios].
   > Podes generarlo con: `openssl rand -base64 32`"

El archivo `.env` nunca se commitea. `.env.example` si — sin valores reales.

## REGLA IRROMPIBLE — Nada hardcodeado, ni siquiera datos de seed

Ademas de secretos, NUNCA hardcodear en codigo fuente:
- Credenciales de usuarios de prueba/seed (admin, visor, etc.)
- Datos de ejemplo que despues se usan para login real
- Cualquier email, password, o dato de negocio fijo que el usuario final vaya a necesitar cambiar

Si se necesita un usuario inicial (ej: primer admin), la logica de seed debe leer los valores desde
variables de entorno (mismo mecanismo que un secreto — ver regla anterior) y no crear nada si esas
variables no estan seteadas. La contrasenia jamas se guarda en texto plano — siempre pasa por el
mismo `IPasswordHasher` que usa el resto del sistema.

## Seguridad — decisiones

- **Archivos:** NUNCA servir como estatico. Todo pasa por `GET /documentos/{id}/file` con JWT validado.
- **Uploads:** validar MIME + extension + tamanio. Renombrar archivos al guardar (nunca usar nombre original).
- **Audit log:** registrar quien vio que legajo y cuando.
- **Env vars:** connection string, JWT secret y cualquier secreto — nunca hardcodeado.
- **Logs:** nunca loguear datos personales (DNI, CUIL, etc.).
- **HTTPS:** requerido en produccion. En local Docker sin cert esta bien.
- **CORS:** dominios explicitos en produccion, nunca `AllowAnyOrigin`.
- **Ley 25.326:** datos personales sensibles — cumplir con proteccion de datos personales Argentina.

## Infraestructura

- Docker compose: servicios `api`, `frontend`, `db`, volumen `storage` para archivos
- Archivos almacenados en volumen Docker montado en `/app/uploads` (BasePath en appsettings.json), volumen `los-ralos-api-prod-lbxh3s-uploads` en prod. Backup semanal via cron en VPS (tar), ver detalle en memoria `infra/backup-dokploy`
- Migrations automáticas en startup (`context.Database.Migrate()`)
- Configuración via variables de entorno

## Frontend — stack definitivo

- **React 18 + Vite** — bundler y UI
- **React Router v6** — routing client-side
- **shadcn/ui + Tailwind CSS** — componentes y estilos (init: `npx shadcn@latest init --template vite --preset base-nova`)
- **TanStack Query v5** — data fetching, cache, loading/error states. NO usar useEffect para fetch
- **React Hook Form v7 + Zod v3** — formularios y validación
- **Axios** — HTTP client con interceptor JWT automático

## Frontend — convenciones de diseño

- **Mobile-first:** diseñar primero para móvil, escalar a desktop con breakpoints Tailwind
- **Responsive obligatorio:** usable en celular Y en PC
- **Skills a usar:** `ui-ux-pro-max` + `frontend-design` en fase de diseño visual (paso 10)
- **Patrones React:** lazy loading de rutas, Error Boundaries, Skeleton en loading, keys con GUID nunca con índice

## Convenciones de desarrollo

- DTOs: patrón `<Entidad>Request` / `<Entidad>Response`
- Mapeos: extension methods explícitos (sin AutoMapper)
- Errores: middleware global con excepciones tipadas (`NotFoundException` 404, `ValidationException` 400)
- StackTrace: solo en Development
- Repositorios: interfaces en Application, implementación en Infrastructure
- Controllers: nunca tocan DbContext ni reciben entidades — siempre DTOs

## Decisiones — ver spec Sec. 14

Decisiones pendientes y resueltas en `docs/specs/2026-06-28-legajos-digitales-design.md` Sec. 14.
No duplicar aqui — el spec es la fuente de verdad.
