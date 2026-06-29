# Spec: Legajos Digitales — Hospital Los Ralos

**Fecha:** 2026-06-28  
**Proyecto:** Sistema de Gestion Digital de Legajos de Personal  
**Hospital:** Los Ralos - SI.PRO.SA / Ministerio de Salud Publica de Tucuman  
**Desarrollador:** Sebastian Zelarayan  
**Estado:** Aprobado para implementacion (v2 — post judgment-day 2026-06-29)

---

## Decisiones clave (resumen de una vista)

| Area | Decision | Razon |
|------|----------|-------|
| PKs | GUID v4 | Previene enumeracion de datos sensibles (DNI, documentos) |
| Auth | JWT 2hs, sin refresh | MVP. Al expirar → redirect login |
| Passwords | BCrypt cost 12 | Estandar seguro para credenciales |
| Busqueda | pg_trgm + GIN index | ILIKE en apellido no funciona con B-tree |
| Paginacion | Cursor-based puro | O(1) — sin COUNT(*). Sin pagina/totalPaginas en response |
| Archivos | Solo via API autenticada | Nginx nunca sirve /uploads directo |
| Upload | Magic bytes + UUID rename | Previene path traversal y file spoofing |
| Roles | admin / visor | Admin: CRUD. Visor: solo GET |
| Tipos legajo | Asistencial / Administrativo | Asistencial tiene Titulo; Administrativo tiene Resoluciones |
| ORM | EF Core + migrations auto | `context.Database.Migrate()` en startup |
| DB search | ILIKE con pg_trgm | Busqueda parcial por apellido (ej: "rod" encuentra "Rodriguez") |
| API | REST `/api/v1/` | Sin CQRS, sin MediatR. Services directos |
| Frontend fetch | TanStack Query v5 | Nunca useEffect para fetching |
| Search UI | useDebounce 300ms + useDeferredValue | Debounce throttlea requests; useDeferredValue prioriza el render |
| PDF viewer | React.lazy() | Carga pesada — solo cuando el usuario abre el modal |
| Iconos | Lucide (via shadcn) | Sin emojis como iconos |
| Audit | Append-only AuditLog | Quien vio que legajo y cuando. Sin borrado. Infraestructura en Paso 2 |
| JWT logout | Riesgo aceptado MVP | Token sigue valido 2hs post-logout. Sin denylist en MVP — documentado |
| Ley 25.326 | Datos personales protegidos | Nunca loguear DNI/CUIL. HTTPS en prod. Retencion: 5 anos post-desactivacion |

## Orden de implementacion (referencia rapida)

Ver **Seccion 13** — tabla autoritativa. Resumen:

| Paso | Que construir |
|------|---------------|
| 1 | Infra .NET + Docker + PostgreSQL + pg_trgm |
| 2 | AuditLog (tabla infra) + Auth backend |
| 3 | CRUD Profesionales |
| 4 | File storage + upload |
| 5-8 | Frontend (base, busqueda, perfil, admin) |
| 9 | Gestion usuarios |
| 10 | Diseno visual |
| 11 | Audit log UI |
| 12 | QA + Hardening |

---

## 1. Objetivo

Digitalizar los legajos del personal del Hospital Los Ralos en una aplicación web interna. El sistema permite al área de RRHH/Administración cargar y gestionar los legajos, y a cualquier usuario autorizado consultarlos mediante búsqueda por apellido.

### Problema actual
Los legajos físicos (carpetas con documentos escaneados y formularios) son difíciles de consultar, se deterioran, y no hay forma rápida de buscar a un profesional o verificar que su documentación está completa.

### Qué resuelve este sistema
- Acceso inmediato a cualquier legajo por apellido
- Visibilidad del estado documental de cada agente (qué documentos están cargados, cuáles faltan)
- Centralización segura de documentos sensibles (DNI, títulos, declaraciones juradas)
- Trazabilidad de quién accedió a qué legajo y cuándo

---

## 2. Usuarios y Roles

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| `admin` | Personal de RRHH/Administración | CRUD completo: profesionales, documentos, usuarios |
| `visor` | Usuarios autorizados de solo lectura | Solo GET: buscar, ver datos, ver documentos |

- Usuarios creados únicamente por un `admin`. No hay autoregistro.
- Un admin puede activar/desactivar usuarios.

---

## 3. Tipos de Legajo

| Tipo | Descripción | Documentos específicos |
|------|-------------|----------------------|
| `Asistencial` | Profesionales de salud (odontólogos, médicos, enfermeros) | Título profesional |
| `Administrativo` | Personal administrativo y de apoyo | Resoluciones de expediente |

Ambos tipos comparten el núcleo de documentos obligatorios.

---

## 4. Modelo de Datos

### 4.1 Entidad: Profesional

```
Id                 Guid        PK — ver nota sobre estrategia de PK
Apellido           string      requerido, max 100
Nombre             string      requerido, max 100
Dni                string      requerido, ÚNICO a nivel DB, formato "XX.XXX.XXX"
Cuil               string      requerido, ÚNICO a nivel DB, formato "XX-XXXXXXXX-X"
FechaNacimiento    DateOnly    requerido
Sexo               enum        Masculino | Femenino | Otro
EstadoCivil        enum        Soltero | Casado | Divorciado | Viudo | Otro
Domicilio          string      max 200
Barrio             string      max 100, nullable
Localidad          string      max 100
Provincia          string      max 100, default "Tucumán"
CodigoPostal       string      max 10, nullable
Telefono           string      max 20, nullable
Email              string      max 150, nullable
Funcion            string      requerido, max 100 (ej: "Odontóloga", "Administrativo")
Servicio           string      max 100, nullable (ej: "Consultorio", "Dirección")
Nivel              enum        Secundario | Terciario | Universitario
Planta             enum        Transitorio | PermanenteInterino | PermanenteEfectivo
NroExpediente      string      max 50, nullable (ej: "1245/2025")
Tipo               enum        Asistencial | Administrativo
Activo             bool        default true
FechaCreacion      DateTime    auto, UTC
FechaActualizacion DateTime    actualizado explicitamente en cada modificacion (ver Sec. 9 — SaveChangesInterceptor)
```

### 4.2 Entidad: Documento

```
Id             Guid      PK
ProfesionalId  Guid      FK → Profesional, requerido, INDEXADO
TipoDocumento  enum      ver lista abajo — UNIQUE junto con ProfesionalId
UrlArchivo     string    ruta relativa interna — nunca URL publica
NombreOriginal string    nombre sanitizado del archivo (strip chars no-printable, max 255 chars)
ContentType    string    MIME type validado via magic bytes
TamanioBytes   long      tamanio en bytes
FechaCarga     DateTime  auto, UTC
CargadoPorId   Guid      FK → Usuario, INDEXADO
EliminadoEn   DateTime? nullable — soft delete. Archivo fisico eliminado, registro retenido para AuditLog
```

**Tipos de documento:**
```
DniFrente | DniDorso | Titulo | DeclaracionJurada |
ConstanciaCuil | DjGrupoFamiliar | Resolucion | Otro
```

> `Titulo` aplica principalmente a Asistenciales. `Resolucion` a Administrativos. Sin restricción en código — solo se muestra diferenciado.

### 4.3 Entidad: Usuario

```
Id                 Guid      PK
Nombre             string    requerido, max 100
Email              string    requerido, ÚNICO a nivel DB, max 150
PasswordHash       string    BCrypt hash
Rol                enum      Admin | Visor
Activo             bool      default true
FechaCreacion      DateTime  auto, UTC
FechaActualizacion DateTime  actualizado explicitamente en cada cambio (SaveChangesInterceptor — ver Sec. 9)
UltimoAcceso       DateTime? nullable, actualizado en cada login
```

### 4.4 Entidad: AuditLog

```
Id             Guid     PK
UsuarioId      Guid?    FK → Usuario, INDEXADO, nullable (null para logins fallidos — no hay usuario)
NombreUsuario  string?  snapshot del nombre al momento de la accion, nullable (null para logins fallidos)
Accion         enum     VerLegajo | VerDocumento | SubirDocumento | EditarProfesional |
                        CrearProfesional | EliminarDocumento | DesactivarProfesional |
                        Login | LoginFallido | Logout |
                        CrearUsuario | DesactivarUsuario | ActivarUsuario | CambiarRol | ResetearPassword
ProfesionalId  Guid?    nullable (no aplica para Login/Logout/gestion usuarios), INDEXADO
DetalleExtra   string?  nullable. Usos:
                        - LoginFallido: hash HMAC-SHA256 del email intentado (clave desde env var)
                        - EliminarDocumento/VerDocumento: tipo de documento
                        - CambiarRol: "Admin→Visor" o "Visor→Admin"
                        - EditarProfesional: lista de campos modificados
Timestamp      DateTime UTC, INDEXADO (para queries por rango de fecha)
IpOrigen       string?  nullable
```

> **LoginFallido y UsuarioId nulo:** en un login fallido no hay usuario autenticado. El email intentado
> se hashea con HMAC-SHA256 (clave en env var `AUDIT_HMAC_KEY`) antes de guardarse en `DetalleExtra` —
> permite correlacionar multiples fallas del mismo email sin exponer el dato en claro.

### 4.5 Estrategia de PKs y Búsqueda — Decisiones de Base de Datos

#### Primary Keys: UUID v4 con consideración de fragmentación

UUID v4 (random) causa **fragmentación de índices** en PostgreSQL porque las inserciones no son secuenciales. La alternativa óptima es **UUIDv7** (time-ordered, sin fragmentación).

Para este proyecto (100-500 registros) la fragmentación no es crítica en el MVP. Se usa UUID v4 ahora y se puede migrar a UUIDv7 con la extensión `pg_uuidv7` si el volumen crece significativamente. La seguridad de no exponer IDs secuenciales justifica el costo.

```sql
-- EF Core genera automáticamente con ValueGeneratedOnAdd()
-- En PostgreSQL: gen_random_uuid() como default
```

#### Búsqueda por apellido: pg_trgm + GIN index

`ILIKE '%apellido%'` **no puede usar índices B-tree** y hace full table scan. Para búsqueda parcial (ej: "Loz" encuentra "Lozano") se requiere la extensión `pg_trgm` con índice GIN:

```sql
-- Activar extensión (una sola vez en migration)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Índice trigram en apellido (case-insensitive automático con pg_trgm)
CREATE INDEX idx_profesional_apellido_trgm
ON profesionales USING GIN (apellido gin_trgm_ops);

-- La query EF Core generará algo equivalente a:
-- WHERE apellido ILIKE '%loz%'  ← usa el índice GIN automáticamente
```

#### Índices requeridos

```sql
-- Búsqueda principal (crítico)
CREATE INDEX idx_profesional_apellido_trgm ON profesionales USING GIN (apellido gin_trgm_ops);

-- FK en Documento (siempre indexar el lado referenciante)
CREATE INDEX idx_documento_profesional_id ON documentos (profesional_id);
CREATE INDEX idx_documento_cargado_por_id ON documentos (cargado_por_id);

-- FK y queries en AuditLog
CREATE INDEX idx_auditlog_usuario_id ON audit_logs (usuario_id);
CREATE INDEX idx_auditlog_profesional_id ON audit_logs (profesional_id);
CREATE INDEX idx_auditlog_timestamp ON audit_logs (timestamp DESC);

-- Filtros frecuentes en búsqueda
CREATE INDEX idx_profesional_tipo ON profesionales (tipo);
CREATE INDEX idx_profesional_activo ON profesionales (activo) WHERE activo = true;
```

#### Tipos de datos PostgreSQL (schema-data-types)

Reglas aplicadas a las entidades de este proyecto:

| Campo | Tipo correcto | Tipo incorrecto | Razon |
|-------|---------------|-----------------|-------|
| strings (Apellido, Nombre, etc.) | `text` | `varchar(n)` | Sin limite artificial. Mismo rendimiento. EF Core: `HasMaxLength()` agrega check en capa app, no en tipo DB |
| fechas con hora | `timestamptz` | `timestamp` | Siempre timezone-aware. Sin esto, UTC se guarda bien pero al leer puede confundirse |
| fechas sin hora | `date` | `timestamp` | `FechaNacimiento` no necesita hora |
| booleanos | `boolean` | `varchar` / `int` | 1 byte, semanticamente correcto |
| tamanio archivo | `bigint` | `int` | `int` desborda a 2GB. Un archivo PDF grande puede ser varios MB — a escala `bigint` es correcto |

**Configuracion critica en Npgsql/EF Core:**
```csharp
// En AppDbContext.OnModelCreating o en Program.cs al registrar Npgsql:
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", false); // NUNCA habilitar
// Con esto, DateTime en C# → timestamptz en PostgreSQL automaticamente
// Siempre guardar/leer como UTC: DateTime.UtcNow, no DateTime.Now
```

#### Constraints a nivel de base de datos

Los constraints deben existir en la DB, no solo en la capa de aplicacion:

```sql
-- Unicidad de identificadores
ALTER TABLE profesionales ADD CONSTRAINT uq_profesional_dni UNIQUE (dni);
ALTER TABLE profesionales ADD CONSTRAINT uq_profesional_cuil UNIQUE (cuil);
ALTER TABLE usuarios ADD CONSTRAINT uq_usuario_email UNIQUE (email);

-- Un solo documento por tipo por profesional (un Profesional no puede tener 2 DniFrente)
ALTER TABLE documentos ADD CONSTRAINT uq_documento_profesional_tipo
  UNIQUE (profesional_id, tipo_documento);
```

> **CRITICO — EF Core mapea enums a `int` por defecto.** El check constraint `CHECK (tipo IN ('Asistencial', 'Administrativo'))` NUNCA va a funcionar si la columna contiene `0` y `1`. Se requiere `HasConversion<string>()` en la entity configuration de TODOS los campos enum:

```csharp
// En ProfesionalConfiguration.cs (IEntityTypeConfiguration<Profesional>)
builder.Property(p => p.Tipo)
    .HasConversion<string>()   // guarda "Asistencial" / "Administrativo" en DB
    .HasMaxLength(30);

builder.HasCheckConstraint("chk_profesional_tipo",
    "tipo IN ('Asistencial', 'Administrativo')");

// Idem para todos los enums: Sexo, EstadoCivil, Nivel, Planta, Rol, TipoDocumento, Accion
```

EF Core genera los constraints de unicidad via `HasIndex().IsUnique()` en las configuraciones.

---

## 5. Pantallas y Funcionalidades

### 5.1 Login

- Email + contraseña → JWT + rol + nombre en respuesta
- Error incorrecto: mensaje genérico "Credenciales inválidas" (no indicar si el email existe)
- Sin "olvidé mi contraseña" en MVP — el admin resetea manualmente

### 5.2 Búsqueda de Profesionales

**Roles:** admin y visor

- Busqueda parcial por apellido (case-insensitive), debounce 300ms
- Resultados: tabla con Apellido+Nombre, Funcion/Servicio, N° Expediente, Tipo, boton "Ver legajo"

> **Seguridad A04:** DNI y CUIL NO aparecen en los resultados de lista. Solo en el perfil individual,
> que requiere autenticacion y genera audit log. Contradiccion con version anterior del spec — eliminada.
- Filtros colapsables: Tipo, Función, Planta
- Paginación: 20 resultados por página con navegación (ver formato en sección API)
- Sin resultados: "No se encontraron profesionales con ese apellido"
- Botón "Nuevo profesional" visible solo para `admin`

### 5.3 Perfil del Profesional

**Roles:** admin y visor (con diferencias)

**Layout:**
- Topbar: breadcrumb, nombre completo, N° expediente, botón "Editar" (solo admin)
- Columna izquierda: Identificación, Contacto, Cargo
- Columna derecha: grid de documentos por tipo

**Grid de documentos:**
- Card por cada tipo de documento
- Con archivo: ícono + tipo + fecha de carga → click abre visor
- Sin archivo: card en gris con "Sin cargar"
- Botón "Subir documento" y zona drag & drop solo para admin

**Visor de documentos (modal):**
- Imagenes: `<img>` dentro del modal (src = blob URL generada via axios)
- PDFs: **NO** usar `<iframe>` ni `<embed>` — no pueden enviar header `Authorization` ni funcionan en iOS Safari.
  Patron correcto:
  ```js
  // 1. Fetchear con axios (lleva el JWT automaticamente)
  const blob = await api.get(`/documentos/${id}/file`, { responseType: 'blob' }).then(r => r.data)
  // 2. Crear blob URL temporal
  const url = URL.createObjectURL(blob)
  // 3. Mostrar en <iframe src={url}> — ahora es un blob local, no hay autenticacion pendiente
  // 4. Revocar al cerrar el modal
  useEffect(() => () => URL.revokeObjectURL(url), [url])
  ```
  En mobile (iOS Safari): `<iframe>` con blob URL tampoco renderiza PDF. Usar link de descarga como fallback:
  ```jsx
  {isMobile ? (
    <a href={url} download={nombreOriginal}>Abrir PDF</a>
  ) : (
    <iframe src={url} title="Documento" />
  )}
  ```
- Boton "Descargar" → `Content-Disposition: attachment` via `?download=true` (ver Sec. 6 Documentos)
- Boton "Eliminar" solo para admin (con confirmacion via `AlertDialog`)
- Archivo siempre via `GET /api/v1/documentos/{id}/file` + JWT — nunca URL directa

### 5.4 Crear / Editar Profesional

**Roles:** solo admin

- Formulario completo con todos los campos de Profesional
- Validación en cliente + servidor
- Al crear: redirige al perfil del profesional nuevo
- Al editar: campos pre-cargados con datos actuales
- Confirmación si hay cambios sin guardar al salir

### 5.5 Gestión de Usuarios

**Roles:** solo admin

- Lista: nombre, email, rol, estado (activo/inactivo), último acceso
- Crear usuario: nombre, email, contraseña temporal, rol
- Activar/desactivar (no se eliminan permanentemente)
- Cambiar rol
- Resetear contraseña (admin asigna nueva contraseña temporal)

---

## 6. API — Endpoints

### Versionado

Todos los endpoints bajo `/api/v1/`. Si en el futuro hay breaking changes, se crea `/api/v2/` sin romper clientes existentes.

### Formato de respuesta para colecciones

```json
{
  "items": [...],
  "porPagina": 20,
  "hasNextPage": true,
  "cursor": "eyJpZCI6Ii4uLiJ9"
}
```

> **Cursor-based puro.** OFFSET escanea todas las filas saltadas — O(n). Cursor es O(1).
> `pagina`, `totalPaginas`, `total` fueron eliminados: obtener `total: 47` requiere `COUNT(*)` full-scan,
> lo que anula la ventaja de cursor-based. Si la UI necesita un conteo aproximado, se puede agregar
> como query separada con cache de 60s — documentar como decision explicita, no como parte del response estandar.

### Formato de error estándar

```json
{
  "type": "ValidationError",
  "message": "Datos inválidos",
  "errors": {
    "dni": "El DNI ya existe en el sistema",
    "email": "Formato inválido"
  }
}
```

### Auth

```
POST  /api/v1/auth/login         Body: { email, password }
                                 → 200: { token, rol, nombre, expiraEn }
                                 → 401: credenciales inválidas

POST  /api/v1/auth/logout        Header: Authorization Bearer {token}
                                 → 204: (audit log de logout)

> **Riesgo aceptado MVP:** JWT es stateless. El token sigue siendo criptograficamente valido hasta
> su expiracion (2hs) aunque se haga logout. Sin denylist, un token robado post-logout es usable.
> Mitigacion: expiracion corta de 2hs. Solucion completa (fuera de MVP): Redis set de JTIs
> invalidados, verificado en el middleware de auth antes de procesar el request.
```

### Profesionales

```
GET   /api/v1/profesionales
      Query: apellido, tipo, planta, cursor, porPagina (default 20)
      → 200: PaginatedResponse<ProfesionalResumen>
      Auth: Admin | Visor

GET   /api/v1/profesionales/{id}
      → 200: ProfesionalDetalle (con lista de documentos cargados)
      → 404: no encontrado
      Auth: Admin | Visor

POST  /api/v1/profesionales
      Body: ProfesionalRequest
      → 201: { id, ... } + Location header
      → 400: errores de validación
      → 409: DNI o CUIL ya existe
      Auth: Admin

PATCH /api/v1/profesionales/{id}
      Body: ProfesionalRequest (campos a actualizar)
      → 200: ProfesionalDetalle actualizado
      → 400 | 404 | 409
      Auth: Admin

DELETE /api/v1/profesionales/{id}
       → 204: desactivación lógica (Activo = false)
       → 404
       Auth: Admin
```

> Se usa **PATCH** (actualización parcial) en lugar de PUT (reemplazo completo). PUT requeriría enviar todos los campos siempre.

### Documentos

```
GET    /api/v1/documentos/{id}/file
       Query: ?download=false (default — inline) | ?download=true (attachment)
       → 200: stream con Content-Type correcto
              Content-Disposition: inline | attachment; filename*=UTF-8''{NombreOriginal_encoded}
       → 401 | 403 | 404
       Auth: Admin | Visor
       Audit: registra VerDocumento

POST   /api/v1/profesionales/{id}/documentos
       Body: multipart/form-data { archivo, tipoDocumento }
       → 201: DocumentoResponse
       → 400: tipo invalido / archivo invalido / tipo ya existe para este profesional
       → 404: profesional no encontrado
       → 409: ya existe un documento del mismo TipoDocumento para este profesional
       Auth: Admin

DELETE /api/v1/documentos/{id}
       → 204: soft delete — marca EliminadoEn = UTC ahora. Archivo fisico eliminado.
              Registro en DB se RETIENE para referencia del AuditLog.
       → 404
       Auth: Admin
```

### Usuarios

```
GET    /api/v1/usuarios                         → 200: lista con paginacion    Auth: Admin
POST   /api/v1/usuarios                         → 201                          Auth: Admin
PATCH  /api/v1/usuarios/{id}                    → 200                          Auth: Admin
PATCH  /api/v1/usuarios/{id}/activar            → 204                          Auth: Admin
PATCH  /api/v1/usuarios/{id}/desactivar         → 204                          Auth: Admin
POST   /api/v1/usuarios/{id}/reset-password     → 204                          Auth: Admin
```

### Audit Log

```
GET    /api/v1/audit
       Query: usuario_id?, profesional_id?, desde?, hasta?, cursor, porPagina (default 50)
       → 200: PaginatedResponse<AuditLogResponse>
       Auth: Admin
```

> Pantalla de visualizacion en Sec. 5.5 (Gestion de Usuarios) o pantalla separada — a definir en implementacion.

### PATCH — DTOs diferenciados

`PATCH /api/v1/profesionales/{id}` usa `PatchProfesionalRequest` (todos los campos **nullable**):
- campos presentes en el body → se actualizan
- campos ausentes (o null) → no se modifican

`POST /api/v1/profesionales` usa `ProfesionalRequest` (campos requeridos segun validacion).

No compartir el mismo DTO entre POST y PATCH — tienen semanticas distintas.

### OpenAPI / Swagger

- Swagger UI disponible en `/swagger` solo en entorno `Development`
- En `Production`: Swagger deshabilitado
- Documentar todos los endpoints con `[ProducesResponseType]` y comentarios XML

---

## 7. Seguridad

Mapeado contra OWASP Top 10 2021. Cada subseccion indica que riesgo OWASP mitiga.

### A01 — Broken Access Control

- Middleware valida JWT en cada request. Sin excepcion.
- Policy `AdminOnly` en todos los endpoints de escritura (POST/PATCH/DELETE).
- Todos los endpoints de lectura requieren al menos rol `Visor` — ningun endpoint es publico.
- **Verificacion de ownership en archivos:** antes de servir `GET /api/v1/documentos/{id}/file`, verificar que el documento pertenece a un profesional existente. Un `visor` no puede adivinar GUIDs de documentos de otro sistema.
- Eliminacion logica — nunca eliminar registros de DB permanentemente (soft delete con `Activo = false`).
- Usuarios desactivados no pueden autenticarse aunque tengan token vigente — verificar `Activo` en cada request.

**Trade-off — verificacion de `Activo` por request:**
Verificar `Activo` en cada request requiere una query DB adicional por cada llamada autenticada.
Estrategia MVP: query directa (DB hit por request). Aceptable para 100-500 usuarios.
Si el volumen crece: cachear `{ usuarioId → activo }` en memoria con TTL de 60 segundos.
Esto implica que la desactivacion puede tardar hasta 60s en tomar efecto — documentar este lag al admin.

### A02 — Cryptographic Failures

- Passwords: **BCrypt cost factor 12**. Nunca MD5/SHA1/SHA256 para passwords.
- JWT firmado con `HMAC-SHA256` minimo. Clave secreta minimo **32 bytes aleatorios** desde variable de entorno.
- Archivos sensibles (DNI, titulos, DJ) solo accesibles via endpoint autenticado — Nginx NO sirve `/uploads` directamente.
- Conexion a DB con SSL habilitado en produccion (`sslmode=require` en connection string).
- Secrets exclusivamente en variables de entorno. Nunca en codigo fuente, nunca commiteados. `.env` en `.gitignore`.
- HTTPS obligatorio en produccion. En docker-compose: Nginx con certificado o detras de un reverse proxy con TLS.

### A03 — Injection

- **SQL Injection:** EF Core usa queries parametrizadas por defecto. Nunca concatenar strings en queries.
  ```csharp
  // Correcto — EF Core parametriza automaticamente
  var p = await _db.Profesionales.Where(x => x.Apellido.Contains(apellido)).ToListAsync();
  // Nunca: $"SELECT * FROM profesionales WHERE apellido LIKE '%{apellido}%'"
  ```
- **Path Traversal en uploads:** nunca usar el nombre de archivo del usuario en la ruta de storage. Siempre generar UUID interno.
  ```csharp
  // MAL — path traversal posible con nombre como "../../etc/passwd"
  var path = Path.Combine(_basePath, archivo.FileName);
  // BIEN — nombre controlado internamente
  var fileName = $"{Guid.NewGuid()}{extension}";
  var path = Path.Combine(_basePath, profesionalId.ToString(), fileName);
  ```
- **XSS:** React escapa por defecto. Nunca usar `dangerouslySetInnerHTML`. Nunca renderizar HTML de la DB.

### A04 — Insecure Design

- Busqueda por apellido no revela datos sensibles (DNI, CUIL) en los resultados de lista — solo nombre, funcion, tipo, expediente.
- Los datos completos (DNI, CUIL, domicilio) solo se muestran en el perfil, que requiere autenticacion y genera audit log.
- El endpoint de login no indica si el email existe o no — mensaje siempre generico "Credenciales invalidas".
- No hay endpoint de "olvide mi password" publico — el admin resetea manualmente (reduce superficie de ataque).

### A05 — Security Misconfiguration

- Swagger UI solo en `Development`. Deshabilitado en `Production`.
- Stack trace solo en `Development`. Respuesta generica para 500 en `Production`.
- Headers de seguridad HTTP en Nginx:
  ```nginx
  add_header X-Frame-Options "DENY";
  add_header X-Content-Type-Options "nosniff";
  add_header X-XSS-Protection "1; mode=block";
  add_header Referrer-Policy "strict-origin-when-cross-origin";
  add_header Content-Security-Policy "default-src 'self'; img-src 'self' blob: data:; script-src 'self';";
  add_header Permissions-Policy "camera=(), microphone=(), geolocation=()";
  ```
- CORS: origenes explicitos en produccion. Nunca `AllowAnyOrigin()` fuera de development.
- PostgreSQL: usuario de DB con permisos minimos (solo SELECT/INSERT/UPDATE/DELETE sobre las tablas del sistema — sin DROP, sin CREATE).

### A06 — Vulnerable and Outdated Components

- `dotnet-outdated` o `dotnet list package --vulnerable` en CI para detectar paquetes con CVEs.
- Dependabot o Renovate en el repo para actualizacion automatica de dependencias.
- `npm audit` en CI para el frontend.
- Imagen base Docker: usar `mcr.microsoft.com/dotnet/aspnet:8.0` y `node:20-alpine` — mantener actualizadas.

### A07 — Identification and Authentication Failures

- Rate limiting en login: **5 intentos fallidos por IP en 10 minutos** → HTTP 429.
- Rate limiting general: 100 requests/minuto por usuario autenticado.
- Implementar con rate limiter nativo de .NET 8 (`AddRateLimiter` en Program.cs).

> **CRITICO — detras de Nginx:** sin `UseForwardedHeaders()`, todos los requests llegan con la IP interna
> de Docker y comparten el mismo bucket. Configuracion obligatoria:
> ```csharp
> builder.Services.Configure<ForwardedHeadersOptions>(opts => {
>     opts.ForwardedHeaders = ForwardedHeaders.XForwardedFor;
>     opts.KnownProxies.Add(IPAddress.Parse("172.20.0.0/16")); // red Docker
> });
> app.UseForwardedHeaders(); // ANTES de UseRateLimiter
> ```

- JWT expiracion: **2 horas**. Al expirar → redirigir a login, limpiar localStorage.
- Usuarios desactivados: verificar `Activo = true` al validar el JWT en el middleware — no solo al hacer login.
- Password minimo: 8 caracteres, al menos 1 numero (validar en backend, no solo frontend).

### A08 — Software and Data Integrity Failures

- Validar Content-Type real del archivo (magic bytes) ademas de la extension declarada.
  **Allowlist completo** — cualquier MIME fuera de esta lista se rechaza con 400:

  | MIME Type | Extension | Magic Bytes |
  |-----------|-----------|-------------|
  | `image/jpeg` | `.jpg`, `.jpeg` | `FF D8 FF` |
  | `image/png` | `.png` | `89 50 4E 47` |
  | `application/pdf` | `.pdf` | `25 50 44 46` |

  > `TipoDocumento.Otro` usa el mismo allowlist — no hay tipos de archivo adicionales permitidos.
  > Si en el futuro se necesitan Word/TIFF, extender el allowlist explicitamente con sus magic bytes.

- Tamanio maximo: **10 MB** por archivo.
  **No confiar solo en `Content-Length`** — clientes pueden omitirlo (chunked transfer) o falsificarlo.
  Enforcar leyendo el stream con limite:
  ```csharp
  // LimitedStream wrapper — aborta al superar MaxFileSizeBytes
  await using var limited = new LimitedStream(stream, _settings.MaxFileSizeBytes);
  // Si se supera el limite, LimitedStream lanza IOException → 400
  ```
  `Content-Length` puede usarse como rechazo anticipado (antes de abrir el stream), pero no como
  unica validacion.
- No ejecutar archivos subidos bajo ningun concepto — solo leer y servir como stream.
- Subpath de storage aislado por profesional: `/uploads/{profesionalId}/{uuid}.ext` — un path no filtra documentos de otro.

### A09 — Security Logging and Monitoring Failures

- **AuditLog obligatorio** en estos eventos:

  | Evento (Accion enum) | Datos a loguear |
  |----------------------|-----------------|
  | `Login` | usuario_id, ip, timestamp |
  | `LoginFallido` | UsuarioId=null, DetalleExtra=HMAC-SHA256(email, AUDIT_HMAC_KEY), ip, timestamp |
  | `Logout` | usuario_id, ip, timestamp |
  | `VerLegajo` | usuario_id, profesional_id, timestamp |
  | `VerDocumento` | usuario_id, documento_id, DetalleExtra=tipo_doc, timestamp |
  | `SubirDocumento` | usuario_id, profesional_id, DetalleExtra=tipo_doc+tamanio, timestamp |
  | `EliminarDocumento` | usuario_id, documento_id, DetalleExtra=tipo_doc, timestamp |
  | `EditarProfesional` | usuario_id, profesional_id, DetalleExtra=campos_modificados (sin valores), timestamp |
  | `DesactivarProfesional` | usuario_id, profesional_id, timestamp |
  | `CrearUsuario` | usuario_id (admin), DetalleExtra=id_usuario_creado, timestamp |
  | `DesactivarUsuario` | usuario_id (admin), DetalleExtra=id_usuario_afectado, timestamp |
  | `ActivarUsuario` | usuario_id (admin), DetalleExtra=id_usuario_afectado, timestamp |
  | `CambiarRol` | usuario_id (admin), DetalleExtra="id:RolAnterior→RolNuevo", timestamp |
  | `ResetearPassword` | usuario_id (admin), DetalleExtra=id_usuario_afectado, timestamp |

  > **LoginFallido:** `email_intento` se hashea con **HMAC-SHA256** (clave `AUDIT_HMAC_KEY` desde env var).
  > SHA-256 sin salt seria vulnerable a rainbow tables sobre el espacio pequeno de emails laborales.
  > HMAC con clave secreta permite correlacionar multiples fallas del mismo email sin exponer el dato en claro.

- Nunca loguear: DNI, CUIL, domicilio, email del profesional, ni el contenido de ningun archivo.
- Timestamps siempre en **UTC**.
- AuditLog es append-only — ningun rol puede eliminar registros de audit.

### A10 — Server-Side Request Forgery (SSRF)

- El sistema no hace requests a URLs externas basadas en input del usuario → riesgo bajo.
- El unico request externo es la lectura de archivos del filesystem interno — path validado con `Path.GetFullPath` y verificacion de que el path resultante empieza con el directorio base permitido:
  ```csharp
  var fullPath = Path.GetFullPath(path);
  if (!fullPath.StartsWith(_allowedBasePath))
      throw new ForbiddenException("Ruta de archivo no permitida");
  ```

### Checklist pre-deploy

- [ ] `.env` no commiteado (verificar `.gitignore`)
- [ ] `JWT_SECRET` minimo 32 chars aleatorios
- [ ] `AUDIT_HMAC_KEY` minimo 32 chars aleatorios (separado de JWT_SECRET)
- [ ] Swagger deshabilitado en `Production`
- [ ] Nginx headers de seguridad configurados
- [ ] HTTPS activo con certificado valido
- [ ] DB user con permisos minimos
- [ ] SSL en connection string de produccion
- [ ] `UseForwardedHeaders()` configurado (rate limiting por IP correcto detras de Nginx)
- [ ] Rate limiting activo y probado (verificar que 6 logins fallidos → 429)
- [ ] AuditLog funcionando — verificar en staging que login genera entrada
- [ ] Healthchecks de Docker activos (`docker compose ps` muestra "healthy")
- [ ] DNI en resultados de busqueda ausente (verificar que la lista NO muestra DNI)
- [ ] PDF viewer funciona en mobile (probar en iOS Safari)
- [ ] `dotnet list package --vulnerable` sin resultados criticos
- [ ] `npm audit` sin vulnerabilidades altas
- [ ] Stack trace no expuesto en produccion (testear con request a endpoint inexistente)

---

## 8. Testing

### Filosofía: TDD

Escribir el test **antes** de la implementación. Ver fallar el test. Escribir el mínimo código para pasarlo. Refactorizar.

> "Si no viste fallar el test, no sabés si testea lo que creés que testea."

### Backend: xUnit + FluentAssertions + NSubstitute

```
LosRalos.Tests/
├── Unit/
│   ├── Services/          ← testean lógica de Application con repos mockeados
│   └── Validators/        ← testean validaciones de inputs
└── Integration/
    ├── Api/               ← testean endpoints completos con WebApplicationFactory
    └── Repositories/      ← testean queries contra DB real (TestContainers)
```

**Stack:**
- `xunit` — framework de tests
- `FluentAssertions` — asserts legibles (`result.Should().Be(...)`)
- `NSubstitute` — mocking de interfaces (`Substitute.For<IRepository>()`)
- `Testcontainers.PostgreSql` — PostgreSQL real en Docker para integration tests

**Qué testear obligatoriamente:**
- Services: toda la lógica de negocio (crear profesional, validaciones, etc.)
- Auth: login correcto, credenciales inválidas, token expirado
- File upload: tipo válido, tipo inválido, tamaño excedido
- Búsqueda: con resultados, sin resultados, paginación
- Autorización: endpoint admin bloqueado para visor

### Frontend: Vitest + React Testing Library

```
src/
└── features/
    ├── auth/
    │   └── __tests__/
    │       └── LoginForm.test.jsx
    ├── profesionales/
    │   └── __tests__/
    │       ├── BusquedaProfesionales.test.jsx
    │       └── PerfilProfesional.test.jsx
    └── documentos/
        └── __tests__/
            └── DocumentoCard.test.jsx
```

**Stack:**
- `vitest` — runner rápido, compatible con Vite
- `@testing-library/react` — testear comportamiento, no implementación
- `@testing-library/user-event` — simular interacciones reales
- `msw` (Mock Service Worker) — interceptar llamadas a la API en tests

**Qué testear obligatoriamente:**
- LoginForm: submit con credenciales válidas, submit con error, campos requeridos
- BusquedaProfesionales: debounce, muestra resultados, sin resultados, loading state
- DocumentoCard: muestra estado cargado / sin cargar correctamente
- PrivateRoute: redirige a login si no hay token

### Regla

> Todo bug encontrado en QA o producción → primero escribir el test que lo reproduce, luego corregirlo.

---

## 9. Arquitectura Backend

### Estructura de proyectos

```
LosRalos.sln
├── LosRalos.Api/               ← Controllers, Program.cs, middlewares
│   ├── Controllers/
│   ├── Middleware/             ← GlobalExceptionHandler, RateLimiting
│   └── Program.cs
├── LosRalos.Application/       ← Services, interfaces, entidades, DTOs, validaciones, excepciones
│   ├── Entities/
│   ├── Interfaces/             ← IRepositories, IFileStorage
│   ├── Services/
│   ├── DTOs/
│   └── Exceptions/             ← NotFoundException, ValidationException, ForbiddenException
├── LosRalos.Infrastructure/    ← EF Core, repositorios, file storage
│   ├── Persistence/
│   │   ├── AppDbContext.cs
│   │   ├── Configurations/     ← IEntityTypeConfiguration<T> por entidad
│   │   └── Repositories/
│   └── Storage/                ← FileStorageService (implementa IFileStorage)
└── LosRalos.Tests/
    ├── Unit/
    └── Integration/
```

### Convenciones

- **PKs:** `Guid`, `ValueGeneratedOnAdd()`, `HasDefaultValueSql("gen_random_uuid()")`
- **DTOs:** `ProfesionalRequest` / `ProfesionalResponse`
- **Mapeos:** extension methods explícitos (`ProfesionalMappingExtensions`), sin AutoMapper
- **Errores:** `GlobalExceptionHandlerMiddleware` con switch expression → JSON estándar
- **Stack trace:** solo en `Development`
- **Repositories:** interfaces en `Application/Interfaces/`, impl en `Infrastructure/`
- **Controllers:** nunca tocan `DbContext` ni reciben entidades — siempre DTOs
- **Migrations:** automáticas en startup con `context.Database.Migrate()`
- **Swagger:** disponible solo en `Development`

### EF Core — reglas de queries

#### N+1: siempre `.Include()` explicito

EF Core no carga relaciones automaticamente. Sin `.Include()`, cargar documentos de N profesionales = N+1 queries a la DB.

```csharp
// MAL — N+1: una query para profesionales + una query por cada uno para sus documentos
var profesionales = await _db.Profesionales.ToListAsync();
foreach (var p in profesionales)
{
    var docs = p.Documentos; // lazy load: query por cada profesional
}

// BIEN — 2 queries total (JOIN en DB)
var profesionales = await _db.Profesionales
    .Include(p => p.Documentos)
    .ToListAsync();
```

Casos de este proyecto donde aplica:

| Query | Include necesario |
|-------|-------------------|
| Perfil del profesional | `.Include(p => p.Documentos)` |
| AuditLog con nombre de usuario | `.Include(a => a.Usuario)` |
| Documento con datos del profesional | `.Include(d => d.Profesional)` |

Si solo se necesitan algunos campos del relacionado, usar `.Select()` en vez de `.Include()` — evita traer datos innecesarios:

```csharp
// Mejor que Include cuando solo necesitas campos especificos
var result = await _db.Profesionales
    .Select(p => new ProfesionalListResponse
    {
        Id = p.Id,
        Apellido = p.Apellido,
        Nombre = p.Nombre,
        CantidadDocumentos = p.Documentos.Count() // SQL COUNT, no carga entidades
    })
    .ToListAsync();
```

#### Connection pooling

Npgsql (el driver PostgreSQL para .NET) tiene connection pool interno activado por defecto. Para 100-500 usuarios no se necesita PgBouncer externo. Configuracion suficiente en connection string:

```
Host=db;Database=losralos;Username=losralos_user;Password=...;
Maximum Pool Size=20;Minimum Pool Size=2;Connection Idle Lifetime=300;
```

Si en el futuro el hospital escala y hay problemas de conexiones, agregar PgBouncer en docker-compose como proxy entre `api` y `db`.

### Convenciones C# — dotnet-best-practices

**Primary constructor syntax para DI** (C# 12):
```csharp
// Correcto — primary constructor
public class ProfesionalService(
    IProfesionalRepository repo,
    IFileStorage fileStorage,
    ILogger<ProfesionalService> logger) : IProfesionalService
{
    // sin campo _repo ni constructor body — C# lo resuelve
}
```

**async/await en todo I/O con `ConfigureAwait(false)`:**
```csharp
// ASP.NET Core no tiene SynchronizationContext en ningun lado (ni controllers, ni services, ni repos).
// ConfigureAwait(false) es tecnicamente un no-op en ASP.NET Core.
// Se usa igual como convencion de estilo para portabilidad a librerias:
var profesional = await _repo.GetByIdAsync(id, ct).ConfigureAwait(false);
// Aplicar de forma UNIFORME — en controllers Y en services/repos. No hacer distincion.
```

**Logging estructurado con `ILogger<T>`:**
```csharp
// Correcto — structured logging (nunca string interpolation en logs)
_logger.LogInformation("Profesional {ProfesionalId} accedido por {UsuarioId}", id, usuarioId);

// NUNCA loguear datos personales
// ❌ _logger.LogInformation("DNI: {Dni}", profesional.Dni);
```

**Strongly-typed configuration con `IOptions<T>`:**
```csharp
// appsettings.json
{ "Jwt": { "Secret": "...", "ExpiresInHours": 2 },
  "Storage": { "BasePath": "/app/uploads", "MaxFileSizeBytes": 10485760 } }

// AppSettings classes en Application/
public class JwtSettings { public string Secret { get; set; } = ""; public int ExpiresInHours { get; set; } = 2; }
public class StorageSettings { public string BasePath { get; set; } = ""; public long MaxFileSizeBytes { get; set; } }

// Registro en Program.cs
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<StorageSettings>(builder.Configuration.GetSection("Storage"));
```

**Service lifetimes explícitos:**

| Tipo | Lifetime | Razón |
|------|----------|-------|
| `AppDbContext` | Scoped | Una instancia por request |
| Repositories | Scoped | Dependen de DbContext |
| Services (Application) | Scoped | Dependen de repos |
| `FileStorageService` | Singleton | Sin estado mutable |
| `JwtService` | Singleton | Sin estado mutable |

**XML docs en controllers y public interfaces:**
```csharp
/// <summary>Retorna el detalle completo de un profesional incluyendo sus documentos.</summary>
/// <param name="id">GUID del profesional.</param>
/// <returns>ProfesionalDetalleResponse con datos y lista de documentos.</returns>
[HttpGet("{id}")]
[ProducesResponseType<ProfesionalDetalleResponse>(200)]
[ProducesResponseType(404)]
public async Task<IActionResult> GetById(Guid id, CancellationToken ct) { ... }
```

**`IDisposable` / `IAsyncDisposable` para streams:**
```csharp
// FileStorageService — liberar stream del archivo
await using var fileStream = new FileStream(path, FileMode.Open, FileAccess.Read);
// No retener streams mas alla de lo necesario
```

**`FechaActualizacion` — EF Core NO actualiza timestamps automaticamente:**
EF Core no tiene comportamiento "auto-update" para campos DateTime en modificacion. La palabra "auto"
en las entidades significa que se actualiza via `SaveChangesInterceptor`:

```csharp
// En Infrastructure/Persistence/
public class TimestampInterceptor : SaveChangesInterceptor
{
    public override InterceptionResult<int> SavingChanges(
        DbContextEventData data, InterceptionResult<int> result)
    {
        var entries = data.Context!.ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Modified);

        foreach (var entry in entries)
        {
            if (entry.Properties.Any(p => p.Metadata.Name == "FechaActualizacion"))
                entry.Property("FechaActualizacion").CurrentValue = DateTime.UtcNow;
        }
        return base.SavingChanges(data, result);
    }
}

// Registrar en Program.cs o en AppDbContext
builder.Services.AddSingleton<TimestampInterceptor>();
// En AppDbContext: optionsBuilder.AddInterceptors(interceptor)
```

Aplica a `Profesional.FechaActualizacion` y `Usuario.FechaActualizacion`.

---

## 10. Arquitectura Frontend

### Stack completo

| Librería | Versión | Propósito |
|----------|---------|-----------|
| React | 18 | UI |
| Vite | latest | Bundler + dev server |
| React Router | v6 | Routing client-side |
| **shadcn/ui** | latest | Componentes UI (ver tabla de componentes) |
| **Tailwind CSS** | v3 | Estilos (requerido por shadcn) |
| **TanStack Query** | v5 | Data fetching, cache, loading/error states |
| **React Hook Form** | v7 | Manejo de formularios |
| **Zod** | v3 | Validación de esquemas (compartida con RHF) |
| **Axios** | latest | HTTP client con interceptores JWT |

> Se reemplaza "CSS propio" por **shadcn/ui + Tailwind**. shadcn agrega los componentes como código fuente al proyecto — control total, sin vendor lock-in. TanStack Query elimina los `useEffect` manuales para data fetching y provee cache, retry, y loading states automáticos.

### Componentes shadcn/ui por pantalla

| Pantalla | Componentes shadcn |
|----------|--------------------|
| Login | `Card`, `Input`, `Button`, `Form` |
| Búsqueda | `Input`, `Table`, `Badge`, `Button`, `Skeleton`, `Pagination`, `Sheet` (filtros) |
| Perfil | `Card`, `Badge`, `Dialog` (visor), `Button`, `Skeleton` |
| Crear/Editar | `Form`, `Input`, `Select`, `Button`, `AlertDialog` (cancelar con cambios) |
| Subir documento | `Dialog`, `Button` (drag & drop custom sobre base shadcn) |
| Eliminar documento | `AlertDialog` (confirmación) |
| Gestión usuarios | `Table`, `Dialog`, `Badge`, `Button`, `Form` |
| Global | `Sonner` (toasts), `Tooltip`, `Breadcrumb`, `Separator`, `Avatar` |

### Inicialización shadcn

```bash
npx shadcn@latest init --template vite --preset base-nova
```

### Estructura de carpetas (feature-based)

```
src/
├── features/
│   ├── auth/
│   │   ├── components/     ← LoginForm.jsx
│   │   ├── hooks/          ← useAuth.js
│   │   └── __tests__/
│   ├── profesionales/
│   │   ├── components/     ← BusquedaProfesionales.jsx, PerfilProfesional.jsx, ProfesionalForm.jsx
│   │   ├── hooks/          ← useProfesionales.js, useProfesional.js
│   │   └── __tests__/
│   ├── documentos/
│   │   ├── components/     ← DocumentoCard.jsx, DocumentoVisor.jsx, DocumentoUpload.jsx
│   │   └── __tests__/
│   └── usuarios/
│       ├── components/     ← UsuariosList.jsx, UsuarioForm.jsx
│       └── __tests__/
├── shared/
│   ├── components/         ← PrivateRoute.jsx, AdminRoute.jsx, PageSkeleton.jsx
│   ├── hooks/              ← useDebounce.js
│   └── utils/              ← formatDni.js, formatCuil.js, formatFecha.js
├── lib/
│   ├── axios.js            ← instancia configurada con interceptor JWT
│   └── queryClient.js      ← TanStack Query client config
└── App.jsx
```

### Data fetching con TanStack Query

```jsx
// useProfesionales.js — ejemplo del patrón
const { data, isLoading, error } = useQuery({
  queryKey: ['profesionales', { apellido, tipo }],
  queryFn: () => api.get('/profesionales', { params: { apellido, tipo } }),
  staleTime: 1000 * 60 * 2,  // 2 minutos de cache
})
```

No usar `useEffect` para data fetching. TanStack Query maneja cache, retry, loading state, y errores.

### Formularios con React Hook Form + Zod

```jsx
const schema = z.object({
  apellido: z.string().min(1).max(100),
  // \d{1,2} acepta DNIs de 7 digitos (antes de los 90s, ej: 5.678.901) y de 8 (ej: 12.345.678)
  dni: z.string().regex(/^\d{1,2}\.\d{3}\.\d{3}$/),
  cuil: z.string().regex(/^\d{2}-\d{8}-\d{1}$/),
})

const form = useForm({ resolver: zodResolver(schema) })
```

Mismas reglas de validación que el backend (Zod en frontend, FluentValidation en C#).

### Patrones React obligatorios (react-doctor + vercel-react-best-practices)

**Lazy loading de rutas y componentes pesados:**
```jsx
// Rutas — code splitting automático
const PerfilProfesional = React.lazy(() => import('./features/profesionales/PerfilProfesional'))
const ProfesionalForm = React.lazy(() => import('./features/profesionales/ProfesionalForm'))

// DocumentoVisor — dynamic import porque incluye PDF viewer (pesado)
const DocumentoVisor = React.lazy(() => import('./features/documentos/DocumentoVisor'))
// Usar dentro de Dialog — solo se carga cuando el usuario abre el modal
```

**Busqueda — debounce para requests, useDeferredValue para render:**

> **CRITICO — `useDeferredValue` NO throttlea requests de red.** Difiere el *render* de UI obsoleta,
> no batchea fetches. Conectar `deferredQuery` directamente al `queryKey` produce un fetch por keystroke.

Patron correcto: `useDebounce` para el query key (controla los fetches), `useDeferredValue` para el
display (mantiene el input responsive sin bloquear):

```jsx
// shared/hooks/useDebounce.js — retiene el valor hasta que el usuario deja de tipear
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

// BusquedaProfesionales.jsx
const [query, setQuery] = useState('')
const debouncedQuery = useDebounce(query, 300)        // controla los fetches
const deferredQuery = useDeferredValue(debouncedQuery) // diferencia render stale vs fresco

const { data } = useQuery({
  queryKey: ['profesionales', debouncedQuery],         // fetch solo cada 300ms
  queryFn: () => api.buscar(debouncedQuery),
  enabled: debouncedQuery.length >= 2,
})

// Input no bloquea — deferredQuery muestra resultados anteriores mientras carga los nuevos
const isStale = deferredQuery !== debouncedQuery
```

**No barrel imports — imports directos:**
```jsx
// ❌ Barrel import — incluye todo el módulo en el bundle
import { Button, Input, Card } from '@/components/ui'

// ✅ Import directo — tree-shakeable
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
```

**No definir componentes dentro de componentes:**
```jsx
// ❌ Re-crea el componente en cada render
function BusquedaProfesionales() {
  const FilaResultado = ({ profesional }) => <tr>...</tr>  // MAL
}

// ✅ Componente separado
function FilaResultado({ profesional }) { return <tr>...</tr> }
function BusquedaProfesionales() { ... }
```

**Ternario, no `&&`, para renderizado condicional:**
```jsx
// ❌ Puede renderizar "0" si count es 0
{count && <Badge>{count}</Badge>}

// ✅ Siempre predecible
{count > 0 ? <Badge>{count}</Badge> : null}
```

**Promise.all para fetches independientes (no waterfall):**
```jsx
// En hooks que necesitan múltiples datos independientes
const [profesional, auditLog] = await Promise.all([
  getProfesional(id),
  getAuditLog(id)
])
```

**Otros obligatorios:**
- Error Boundary por feature — errores de red no rompen toda la app
- `<Skeleton>` de shadcn para loading > 300ms, nunca spinners genéricos
- Keys en listas: siempre `profesional.id` (Guid), nunca índice del array
- No prop drilling: Context o TanStack Query si baja más de 2 niveles
- Cleanup en `useEffect` si tiene subscripciones o timers

### Auth en frontend

- JWT en `localStorage` (MVP — más simple)
- Interceptor en axios: agrega `Authorization: Bearer {token}` en cada request automáticamente
- Response 401 → interceptor redirige a login y limpia token
- `<PrivateRoute>` y `<AdminRoute>` verifican token + rol antes de renderizar

### Fase de diseño visual

Cuando lleguemos al paso 10 del flujo de implementación:
- Invocar `ui-ux-pro-max` para definir dirección estética (tipografía, color, spacing, animaciones)
- Invocar `frontend-design` para implementación con alta fidelidad visual
- Mobile-first siempre: diseñar para 390px primero, escalar con breakpoints Tailwind (`sm:`, `md:`, `lg:`)
- Evitar fonts genéricos (Inter, Roboto, Arial) — elegir una tipografía distintiva para el contexto hospitalario
- Usar variables CSS de shadcn para theming consistente (`bg-background`, `text-muted-foreground`, etc.)

---

## 11. UX Guidelines (ui-ux-pro-max)

Estas reglas aplican al diseño e implementación de toda la UI. Se verifican en el paso 10 (diseño visual) pero informan las decisiones de estructura desde el inicio.

### Accesibilidad (CRÍTICO)
- Contraste mínimo **4.5:1** entre texto y fondo (verificar con herramienta antes de entregar)
- Focus ring visible en todos los elementos interactivos — nunca `outline: none` sin reemplazo
- `aria-label` en botones icon-only (ej: botón de eliminar documento)
- Orden de tabulación coincide con orden visual
- Color nunca es el único indicador de estado — siempre acompañar con ícono o texto
- `prefers-reduced-motion`: envolver animaciones en `@media (prefers-reduced-motion: no-preference)`
- Errores en forms: usar `aria-live="polite"` o `role="alert"` para que screen readers los lean

### Touch e Interacción (CRÍTICO)
- Targets táctiles: **mínimo 44×44px** — agrandar hit area con padding si el ícono es más chico
- Espaciado mínimo de **8px** entre targets táctiles (evitar mis-taps)
- Feedback en < 100ms ante cualquier tap (estado pressed visual)
- Botones deshabilitados durante operaciones async — nunca doble submit
- No depender de hover para interacciones primarias — todo accesible con tap

### Layout y Responsividad (ALTO)
- Breakpoints sistemáticos: **375 / 768 / 1024 / 1440px**
- `min-h-dvh` en lugar de `100vh` en mobile (evita el problema del URL bar de Safari)
- Sin scroll horizontal en ningún breakpoint
- Sidebar en pantallas ≥ 1024px, bottom nav o top nav en < 1024px
- Navegación principal siempre reachable desde cualquier pantalla (no esconderla en sub-flujos)
- Contenido principal priorizado en mobile — info secundaria en acordeón o tab

### Tipografía y Color (MEDIO)
- Body text mínimo **16px** en mobile (evita auto-zoom de iOS)
- Line-height: **1.5–1.75** para texto de lectura
- Máximo **65–75 caracteres** por línea en desktop
- Usar tokens semánticos de shadcn: `text-foreground`, `text-muted-foreground`, `bg-background` — nunca hex crudos en componentes
- Dark mode: diseñar junto con light mode desde el inicio — no asumir que los valores de light funcionan invertidos

### Íconos (CRÍTICO)
- Usar **Lucide React** (viene con shadcn) — nunca emojis como íconos estructurales
- Tamaño consistente: definir tokens `size-4` (16px), `size-5` (20px), `size-6` (24px)
- Un solo estilo de ícono en toda la app (stroke width consistente)
- Íconos interactivos siempre con label accesible (`aria-label` o texto visible)

### Formularios y Feedback (MEDIO)
- **Labels visibles siempre** — nunca solo placeholder como label (desaparece al escribir)
- Error messages debajo del campo específico, no solo en el top del form
- Errores descriptivos: **causa + cómo resolverlo** (no "Inválido" — sí "El DNI debe tener el formato XX.XXX.XXX")
- Indicar campos requeridos con asterisco (`*`) + leyenda al pie
- `AlertDialog` de shadcn para todas las acciones destructivas (eliminar documento, desactivar usuario)
- Toast (Sonner) para confirmaciones de éxito: auto-dismiss en 3-4 segundos
- Loading state en el botón de submit mientras la operación está en curso (spinner + disabled)
- En formulario largo (crear profesional): autosave o confirmación antes de salir con cambios sin guardar

### Animaciones (MEDIO)
- Duración: **150–300ms** para micro-interacciones, máximo 400ms para transiciones complejas
- Solo animar `transform` y `opacity` — nunca `width`, `height`, `top`, `left` (causa reflow)
- Máximo 1–2 elementos animados por vista simultáneamente
- Easing: `ease-out` para elementos que entran, `ease-in` para elementos que salen
- Skeleton shimmer en lugar de spinner para operaciones > 300ms

### Navegación (ALTO)
- Breadcrumb visible en el perfil del profesional (Búsqueda → Nombre del profesional)
- Back navigation predecible — preservar scroll y estado del filtro de búsqueda al volver
- El modal del visor de documentos cierra con Escape y con click fuera del modal
- Confirmación antes de cerrar un modal con cambios sin guardar
- `DialogTitle` siempre presente en Dialog/Sheet de shadcn (requerido para accesibilidad)

---

## 12. Infraestructura Docker

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:16
    volumes:
      - db_data:/var/lib/postgresql/data
    env_file: .env
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U losralos_user -d losralos"]
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    build: ./LosRalos.Api
    depends_on:
      db:
        condition: service_healthy
    expose:
      - "5000"           # visible para Nginx dentro de la red Docker, no para el host
    volumes:
      - uploads_data:/app/uploads
    env_file: .env
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:5000/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5

  frontend:
    build: ./frontend
    depends_on:
      api:
        condition: service_healthy   # espera que la API este lista, no solo que el container arranco
    ports:
      - "80:80"
    # Nginx sirve archivos estaticos de React
    # Proxy: /api/* → api:5000
    # IMPORTANTE: /uploads NO esta expuesto

volumes:
  db_data:
  uploads_data:
```

### Variables de entorno (.env — en .gitignore)

```
POSTGRES_DB=losralos
POSTGRES_USER=losralos_user
POSTGRES_PASSWORD=<strong-random>
JWT_SECRET=<minimo-32-chars-random>
AUDIT_HMAC_KEY=<minimo-32-chars-random>   # para hashear email_intento en logins fallidos
ALLOWED_ORIGINS=http://localhost
ASPNETCORE_ENVIRONMENT=Development
```

---

## 13. Flujo de Implementación

Orden incremental — validar cada paso antes de continuar:

| # | Paso | Que incluye |
|---|------|-------------|
| 1 | Infra base | Solucion .NET 3 proyectos + Tests, docker-compose, PostgreSQL, migraciones vacias, pg_trgm |
| 2 | AuditLog infra + Auth | **Tabla AuditLog primero** (append-only, sin UI). Luego login, JWT, middleware, rate limiting, tests. AuditLog aqui porque Auth ya genera eventos Login/LoginFallido |
| 3 | CRUD Profesionales | Entidad, repositorio, service, endpoints, indices, tests |
| 4 | File storage | Upload, validacion magic bytes, endpoint descarga, LimitedStream, tests |
| 5 | Frontend base | React + Vite, routing, contexto de auth, login screen, PrivateRoute |
| 6 | Frontend busqueda | useDebounce + useDeferredValue, tabla resultados (sin DNI), paginacion cursor |
| 7 | Frontend perfil | Columnas datos + grid documentos + visor modal (blob URL) |
| 8 | Frontend admin | Formulario crear/editar (PatchProfesionalRequest), drag & drop upload |
| 9 | Gestion usuarios | Backend + frontend para admin panel de usuarios |
| 10 | Diseno visual | ui-ux-pro-max + frontend-design |
| 11 | Audit log UI | Pantalla de visualizacion + endpoint GET /api/v1/audit |
| 12 | QA + Hardening | Penetration basico, verificar headers Nginx, checklist pre-deploy |

> **Referencia autoritativa:** esta tabla (Sec. 13) es el orden de implementacion. La tabla rapida
> del header es solo resumen — si hay discrepancia, esta tabla gana.

---

## 14. Decisiones

### Resueltas en este spec

| Decision | Resolucion | Razon |
|----------|------------|-------|
| JWT storage | **`localStorage` (MVP)** | Mas simple. Riesgo XSS mitigado por CSP header + no renderizar HTML de DB. Para produccion con requerimientos altos: migrar a httpOnly cookie |
| Paginacion | **Cursor-based puro** | Sin `total`/`totalPaginas` — O(n) incompatible con cursor |
| AuditLog orden | **Paso 2 (junto con Auth)** | Auth genera eventos desde el minuto 1 |
| DELETE documento | **Soft delete** | FK consistente con AuditLog |
| useDeferredValue | **Solo para render** — `useDebounce` para fetches | `useDeferredValue` no throttlea red |

### Pendientes

- [ ] Hosting definitivo (local Docker → VPS o similar)
- [ ] Dominio interno del hospital
- [ ] Seed de usuario admin inicial: migration o script separado
- [ ] Documentos "Otro": etiqueta personalizada por el admin?
- [ ] Migrar a UUIDv7 si el volumen crece (extension `pg_uuidv7`)

---

## 15. Proteccion de Datos — Ley 25.326

El sistema almacena datos personales sensibles (DNI, CUIL, domicilio, documentos personales). La Ley 25.326
de Proteccion de Datos Personales Argentina aplica en los siguientes aspectos:

### Politica de retencion

| Categoria | Tiempo de retencion | Motivo |
|-----------|---------------------|--------|
| Legajo del profesional (Profesional + Documentos) | 5 anos post-desactivacion | Requisito legal laboral |
| AuditLog | 5 anos | Trazabilidad / auditorias internas |
| Usuarios del sistema | 1 ano post-desactivacion | No almacenan datos sensibles propios |

### Derechos del titular (Art. 14 y 17)

Un profesional puede ejercer sus derechos de acceso y rectificacion. Procedimiento **manual** (MVP):
1. El profesional presenta solicitud escrita a RRHH
2. RRHH contacta al administrador del sistema
3. Admin descarga / verifica / corrige los datos usando la interfaz admin del sistema
4. Para eliminacion (Art. 17): evaluar con asesor legal si aplica excepcion por relacion laboral

No hay endpoint automatizado de solicitud de derechos en el MVP — la superficie de datos es pequena
y el proceso manual es suficiente para 100-500 agentes.

---

## 17. Out of Scope (MVP)

- Notificaciones (email/WhatsApp)
- Integración con sistemas externos (SI.PRO.SA, ANSES)
- Historial de versiones de documentos
- Exportar legajo completo a PDF
- App móvil nativa
- Dashboard con estadísticas de personal
