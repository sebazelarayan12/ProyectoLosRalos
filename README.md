<p align="center">
  <img src="frontend/public/icono.png" alt="Legajos Digitales" width="96" />
</p>

<h1 align="center">Legajos Digitales — Hospital Los Ralos</h1>

<p align="center">
  Sistema web interno para digitalizar y consultar los legajos del personal del Hospital Los Ralos (Tucumán, SI.PRO.SA).
</p>

---

## El problema

Los legajos físicos del personal (carpetas con documentación escaneada, títulos, resoluciones) son lentos de consultar, se deterioran con el tiempo y no hay forma rápida de verificar si la documentación de un agente está completa. Tampoco existe registro de quién consultó qué legajo.

Este sistema centraliza esa información en una aplicación web con:

- Búsqueda instantánea de profesionales por apellido o número de expediente.
- Visibilidad del estado documental de cada legajo (qué está cargado, qué falta).
- Carga y gestión de documentos sensibles (DNI, títulos, declaraciones juradas) con control de acceso.
- Registro de auditoría append-only: quién vio o modificó qué, y cuándo.

> [!NOTE]
> Proyecto desarrollado por un estudiante de Ingeniería en Sistemas de Información (UTN FRT) para uso interno del Hospital Los Ralos. No está pensado como producto genérico — las decisiones de diseño priorizan simplicidad y seguridad de datos personales sobre flexibilidad.

## Stack

| Capa | Tecnología |
|------|------------|
| Backend | .NET 8 Web API, Entity Framework Core |
| Base de datos | PostgreSQL 16 (`pg_trgm` para búsqueda por similitud) |
| Frontend | React 18 + Vite, TanStack Query, React Hook Form + Zod |
| UI | shadcn/ui + Tailwind CSS v4 |
| Auth | JWT (expiración corta) + BCrypt |
| Infraestructura | Docker Compose (API, frontend con Nginx, PostgreSQL) |

Arquitectura backend en 3 capas (`Api` → `Application` ← `Infrastructure`), sin CQRS ni MediatR — services directos. Frontend organizado por *screaming architecture* (`features/<dominio>/`), no por capa técnica.

## Roles

| Rol | Quién lo usa | Permisos |
|-----|--------------|----------|
| `admin` | Administrador del sistema | CRUD completo. Exclusivo en gestión de usuarios y auditoría |
| `administrativo` | Personal de RRHH/Administración | CRUD de profesionales y documentos. Sin acceso a usuarios ni auditoría |

Los usuarios se crean únicamente por un `admin` — no hay autoregistro.

## Puesta en marcha

### Con Docker (recomendado)

Requiere Docker y Docker Compose.

```bash
git clone https://github.com/sebazelarayan12/ProyectoLosRalos.git
cd ProyectoLosRalos
cp .env.example .env
```

Completá `.env` con tus propios valores (contraseña de PostgreSQL, secreto JWT, clave HMAC de auditoría — ver comentarios en `.env.example`). Después:

```bash
docker compose up -d
```

- Frontend: `http://localhost`
- API: expuesta internamente al frontend vía Nginx, nunca directo al host.

Las migraciones de base de datos se aplican automáticamente al levantar el contenedor `api`.

### Desarrollo local (sin Docker)

Requiere .NET 8 SDK, Node 20+ y una instancia de PostgreSQL 16 corriendo en `localhost:5432`.

```bash
# Backend
cd backend
cp LosRalos.Api/appsettings.Development.json.example LosRalos.Api/appsettings.Development.json
# completar ConnectionStrings, Jwt:Secret y Audit:HmacKey en ese archivo
dotnet run --project LosRalos.Api

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

> [!IMPORTANT]
> `appsettings.Development.json` y `.env` nunca se commitean — contienen secretos locales. Usá siempre los archivos `.example` como punto de partida.

## Testing

```bash
# Backend — unitarios (rápidos, sin Docker)
dotnet test --filter "FullyQualifiedName~Unit"

# Backend — integración (requiere Docker, usa Testcontainers)
dotnet test --filter "FullyQualifiedName~Integration"

# Frontend
cd frontend && npm test
```

## Seguridad

- Los archivos nunca se sirven como estáticos: todo pasa por un endpoint autenticado con JWT que valida ownership antes de responder.
- Uploads validados por *magic bytes* (no por extensión declarada) y renombrados con GUID al guardar.
- Rate limiting de login particionado por IP (5 intentos / 10 minutos).
- Sin datos personales (DNI, CUIL, domicilio) en logs.
- Cumplimiento con la Ley 25.326 de Protección de Datos Personales (Argentina): los datos sensibles de salud no deberían salir de la infraestructura del hospital — ver decisiones de despliegue en la documentación interna del proyecto.

> [!WARNING]
> Este repositorio es de uso interno para un hospital público. Si estás evaluando el código como referencia, tené en cuenta que varias decisiones (tamaño de equipo, volumen de datos, ausencia de multi-tenant) están tomadas para ese contexto específico, no para escala general.
