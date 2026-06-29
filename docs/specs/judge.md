# Judgment Day — Round 1
## Target: `docs/specs/2026-06-28-legajos-digitales-design.md`
## Fecha: 2026-06-28
## Skill Resolution: none — sin registry, standards desde CLAUDE.md

---

## Tabla de Veredicto

| Finding | A | B | Severity | Estado |
|---------|---|---|----------|--------|
| DNI expuesto en resultados de busqueda (contradice Sec. 7 A04) | CRITICAL | CRITICAL | **CRITICAL** | **Confirmado** |
| JWT logout no invalida el token | CRITICAL | CRITICAL | **CRITICAL** | **Confirmado** |
| Paginacion mezcla cursor + offset — O(1) es mentira | CRITICAL | WARNING | **CRITICAL** | **Confirmado** |
| `useDeferredValue` no throttlea requests HTTP — hammerea la API por keystroke | WARNING | CRITICAL | **CRITICAL** | **Confirmado** |
| AuditLog falta acciones de gestion de usuarios (CrearUsuario, DesactivarUsuario, CambiarRol, ResetPassword) | WARNING | WARNING | **WARNING (real)** | **Confirmado** |
| Verificar `Activo` en cada request — no especifica mecanismo (DB hit por request) | WARNING | WARNING | **WARNING (real)** | **Confirmado** |
| DNI regex rechaza DNIs de 7 digitos (antes de los 90s) | WARNING | SUGGESTION | **WARNING (real)** | **Confirmado** |
| Content-Length no confiable para gate de tamanio de archivo | WARNING | WARNING (th) | **WARNING (real)** | **Confirmado** |
| Rate limiting por IP no funciona detras de Nginx sin `UseForwardedHeaders()` | WARNING | — | WARNING (real) | Sospechoso |
| EF Core mapea enums a `int` — check constraint `'Asistencial'` siempre falla en insert | WARNING | — | WARNING (real) | Sospechoso |
| PATCH usa mismo DTO que POST — semantica parcial indefinida | WARNING | — | WARNING (real) | Sospechoso |
| Login fallido: `email_intento` no tiene campo en entidad AuditLog | — | CRITICAL | CRITICAL | Sospechoso |
| DELETE documento es hard delete — rompe FK en AuditLog | — | WARNING | WARNING (real) | Sospechoso |
| Sin constraint unicidad `(ProfesionalId, TipoDocumento)` — 2 DniFrente posibles | — | WARNING | WARNING (real) | Sospechoso |
| `localStorage` JWT decidido en Sec.10 pero pendiente en Sec.14 — contradiccion | — | WARNING | WARNING (real) | Sospechoso |
| AuditLog en paso 11 pero Auth (paso 2) ya genera eventos auditables | — | WARNING | WARNING (real) | Sospechoso |
| `FechaActualizacion` marcada "auto" — EF Core NO la actualiza automaticamente | — | WARNING | WARNING (real) | Sospechoso |
| PDF en `<iframe>` roto en iOS Safari — contradice mobile-first | — | WARNING | WARNING (real) | Sospechoso |
| docker-compose: `api` sin expose ni healthcheck; `frontend` depends_on sin condition | WARNING | — | WARNING (real) | Sospechoso |
| Orden de implementacion inconsistente entre tabla header y Sec. 13 | WARNING | — | WARNING (real) | Sospechoso |
| `ConfigureAwait(false)` — razonamiento incorrecto (ASP.NET Core no tiene SynchronizationContext en ningun lado) | — | WARNING (th) | WARNING (th) | INFO |
| Tipo `Otro` — sin lista de MIMEs permitidos | WARNING (th) | WARNING | WARNING (th) | INFO |
| `NombreOriginal` — sin sanitizacion especificada | SUGGESTION | — | SUGGESTION | INFO |
| `Content-Disposition` inline vs attachment no especificado | SUGGESTION | — | SUGGESTION | INFO |
| `FechaActualizacion` faltante en entidad Usuario | SUGGESTION | — | SUGGESTION | INFO |
| Sin endpoint `GET /api/v1/audit` definido | — | SUGGESTION | SUGGESTION | INFO |
| Sin politica de retencion de datos (Ley 25.326 Art. 14/17) | — | SUGGESTION | SUGGESTION | INFO |

---

## Resumen

| Categoria | Cantidad |
|-----------|----------|
| CRITICAL confirmados | 4 |
| WARNING (real) confirmados | 4 |
| Sospechosos (1 solo juez) | 12 |
| INFO / WARNING (theoretical) | 2 |
| SUGGESTION | 5 |

---

## Detalle completo — Juez A

### [A-1] CRITICAL — Seccion 5.2 vs Seccion 7 A04
**DNI expuesto en resultados de busqueda contradice politica de seguridad**

Seccion 5.2 lista columnas de la tabla de resultados: "Apellido+Nombre, Funcion/Servicio, DNI, N° Expediente, Tipo". Seccion 7 A04 dice explicitamente: "Busqueda por apellido no revela datos sensibles (DNI, CUIL) en los resultados de lista — solo nombre, funcion, tipo, expediente." Contradiccion directa. DNI es sensible bajo Ley 25.326. Como esta especificado, se va a exponer en la lista.

**Fix:** Eliminar DNI del DTO ProfesionalResumen y de la tabla de busqueda. Solo en el perfil autenticado que genera audit log.

---

### [A-2] CRITICAL — Seccion 5.3
**PDF viewer incompatible con autenticacion JWT**

El spec dice PDFs se sirven via `GET /api/v1/documentos/{id}/file` requiriendo `Authorization: Bearer {token}`, y se muestran en `<iframe>` o `<embed>` dentro de un modal. `<iframe>` y `<embed>` hacen requests GET iniciados por el browser que no pueden llevar headers custom — el header Authorization no se envia. El browser recibe 401 y el PDF no renderiza.

**Fix:** Fetchear el archivo via axios (con el interceptor), crear `URL.createObjectURL(blob)`, pasar el blob URL al `<iframe>`. Revocar despues de cerrar.

---

### [A-3] CRITICAL — Seccion 6, Auth
**JWT logout no invalida el token**

`POST /api/v1/auth/logout` escribe un audit log y retorna 204. JWTs son stateless y criptograficamente validos hasta su expiracion de 2hs. El spec no define ningun blacklist ni revocation store. Un token robado permanece usable por hasta 2hs despues del logout. Especialmente peligroso en workstations compartidas de hospital.

**Fix:** Documentar como riesgo aceptado de MVP explicitamente, O implementar revocation list (ej: Redis set de JTI invalidados verificado en el JWT middleware).

---

### [A-4] CRITICAL — Seccion 6, Pagination Response
**Cursor-based y offset-based mezclados — O(1) es falso**

La respuesta de colecciones incluye `cursor` (cursor-based) Y `pagina`, `totalPaginas`, `total` (offset-based). Obtener `total: 47` requiere `COUNT(*)` sobre el resultado filtrado completo — esto es O(n), no O(1). Contradice la razon declarada para elegir cursor-based. No se pueden tener ambas semanticas sin ejecutar ambas queries.

**Fix:** Elegir uno. Si cursor-based: eliminar `pagina`, `totalPaginas`, `total`. Si la UI necesita el total, documentar que viene de una query COUNT separada y aceptar el costo O(n).

---

### [A-5] WARNING (real) — Seccion 6, Profesionales
**PATCH usa ProfesionalRequest — semantica de update parcial indefinida**

El spec usa `ProfesionalRequest` como body para POST (crear) y PATCH (actualizar). Si todos los campos son requeridos, PATCH no puede ser parcial. Si todos son opcionales para PATCH, el POST rompe validacion. El spec nunca define un `PatchProfesionalRequest` separado ni clarifica que campos son nullable en PATCH.

**Fix:** Definir `PatchProfesionalRequest` con todos los campos nullable, o documentar que PATCH acepta solo los campos a actualizar y especificar como null vs ausente difieren.

---

### [A-6] WARNING (real) — Seccion 4.5, Constraints
**EF Core mapea enums a int — el check constraint nunca va a matchear**

El spec muestra: `CHECK (tipo IN ('Asistencial', 'Administrativo'))`. EF Core mapea enums de C# a `int` (0, 1) en PostgreSQL a menos que se configure explicitamente con `HasConversion<string>()`. Sin esa configuracion, la columna va a contener `0` y `1`, haciendo que el check constraint falle siempre en insert.

**Fix:** Agregar `HasConversion<string>()` en la entity configuration para todas las columnas enum, o eliminar el check constraint de string y confiar en el tipo enum.

---

### [A-7] WARNING (real) — Seccion 7 A08
**Content-Length es advisory y puede omitirse o falsificarse**

El spec dice "rechazar antes de leer el stream completo (header Content-Length)". Clientes HTTP pueden enviar un request sin Content-Length (chunked transfer encoding) o con un valor falso. El servidor leeria el stream completo de todas formas.

**Fix:** Leer el stream con un size cap: detener y rechazar despues de MaxFileSizeBytes consumidos, independientemente del Content-Length. Usar `Stream.CopyToAsync` con un `LimitedStream` wrapper.

---

### [A-8] WARNING (real) — Secciones 5.2 y 10
**Tres especificaciones inconsistentes para el manejo del input de busqueda**

Sec. 5.2 dice "debounce 300ms". Sec. 10 dice usar `useDeferredValue` y explicitamente que es "mejor que debounce manual". La estructura de carpetas en Sec. 10 incluye `shared/hooks/useDebounce.js` como deliverable. Los tres no pueden ser correctos simultaneamente.

**Fix:** Elegir uno. Si `useDeferredValue`, eliminar `useDebounce.js` de la estructura y actualizar Sec. 5.2. Nota: `useDeferredValue` no throttlea requests de red — difiere el render. El guard `enabled: deferredQuery.length >= 2` en la query sigue siendo necesario.

---

### [A-9] WARNING (real) — Secciones 4.4 y 7 A09
**AuditLog enum sin acciones de operaciones admin**

El enum `Accion` y la tabla de eventos de audit omiten: `DesactivarProfesional`, `CrearUsuario`, `DesactivarUsuario`, `ActivarUsuario`, `CambiarRol`, `ResetearPassword`. Todas son acciones admin con impacto directo en control de acceso y datos personales bajo Ley 25.326.

**Fix:** Agregar estas acciones al enum y a la tabla en Sec. 7 A09.

---

### [A-10] WARNING (real) — Seccion 7 A07
**Rate limiting por IP no funciona detras de Nginx sin configuracion explicita**

El spec especifica rate limiting por IP. Detras de Nginx, todos los requests llegan desde la misma IP interna de Docker a menos que `X-Forwarded-For` se forwarde explicitamente y el rate limiter de .NET se configure para leerlo via `ForwardedHeaders` middleware. Sin esto, todos los clientes comparten el mismo bucket.

**Fix:** Agregar `app.UseForwardedHeaders()` con `ForwardedHeadersOptions` configurado para la IP del proxy Nginx, y configurar el rate limiter para usar `context.Connection.RemoteIpAddress` despues del header forwarding.

---

### [A-11] WARNING (real) — Seccion 10, Formularios
**DNI regex excluye DNIs validos de 7 digitos**

El schema Zod usa `/^\d{2}\.\d{3}\.\d{3}$/` que matchea exactamente 8 digitos numericos (ej: 12.345.678). DNIs argentinos menores a 10.000.000 son de 7 digitos (ej: 5.678.901 formateado como `5.678.901`). Personal del hospital contratado antes de mediados de los 90s tiene DNIs de 7 digitos. El regex los va a rechazar.

**Fix:** Usar `/^\d{1,2}\.\d{3}\.\d{3}$/` para permitir ambos formatos, o normalizar en input (zero-pad a 8 digitos y forzar un formato canonico).

---

### [A-12] WARNING (real) — Seccion 7 A09
**Login fallido: hash del email sin algoritmo especificado**

"Login fallido: email_intento (solo hash)" — ningun algoritmo de hash especificado. SHA-256 sin salt es vulnerable a rainbow table attacks contra el keyspace pequeno de emails laborales. BCrypt preveria la correlacion entre dos entradas de audit para el mismo email. Esta decision necesita ser explicita.

**Fix:** Especificar HMAC-SHA256 con clave secreta (desde env vars) para prevenir rainbow tables mientras permite correlacionar multiples fallas del mismo email.

---

### [A-13] WARNING (real) — Seccion 7 A01
**Verificar Activo en cada request requiere DB round-trip sin estrategia documentada**

El spec correctamente requiere bloquear usuarios desactivados incluso con JWT valido. Esto requiere una query DB en cada request autenticado para verificar el campo. No se reconoce como trade-off de performance y no se menciona ninguna mitigacion (cache de corta duracion, distributed cache).

**Fix:** Documentar el trade-off explicitamente. Opcional: cachear estado de usuario en memoria con TTL de 60 segundos por UsuarioId.

---

### [A-14] WARNING (real) — Seccion 12, Docker
**api sin port mapping ni healthcheck; frontend depends_on sin condition**

El docker-compose muestra Nginx proxeando `/api/*` a `api:5000` pero el servicio `api` no tiene `ports:` ni `expose:` directive ni healthcheck. El servicio `frontend` usa `depends_on: [api]` sin `condition: service_healthy`, lo que significa que arranca inmediatamente cuando el container de api arranca — no cuando el proceso .NET esta listo para aceptar conexiones.

**Fix:** Agregar `expose: ["5000"]` y un `healthcheck` al servicio `api`. Actualizar `frontend` depends_on a `condition: service_healthy`.

---

### [A-15] WARNING (real) — Seccion header vs Seccion 13
**Orden de implementacion inconsistente entre las dos tablas**

Tabla header: Paso 1 = infra+docker+pg, Paso 2 = entidades+migracion, Paso 3 = auth. Sec. 13: Paso 1 = infra+migraciones+pg_trgm, Paso 2 = auth backend, Paso 3 = CRUD Profesionales. Las entidades/migracion se movieron silenciosamente del Paso 2 al Paso 1 y auth salto del Paso 3 al Paso 2. Quien siga la tabla del header va a construir en el orden incorrecto.

**Fix:** Eliminar una de las tablas o marcar explicitamente cual es la referencia autoritativa.

---

### [A-16] WARNING (theoretical) — Seccion 7 A08
**Tipo `Otro` de documento sin extensiones permitidas definidas**

La tabla de magic bytes cubre solo JPEG, PNG y PDF. El tipo `Otro` se acepta sin un allowlist de MIME/extension definido. Un admin con acceso podria subir tipos de archivo arbitrarios bajo `Otro`.

**Fix:** Restringir `Otro` a los mismos tipos permitidos (PDF/JPG/PNG), o definir explicitamente el set permitido y agregar `Otro` al path de validacion.

---

### [A-17] SUGGESTION — Seccion 4.3, Usuario
**Falta `FechaActualizacion` en la entidad Usuario**

`Profesional` tiene `FechaActualizacion`. `Usuario` no. Acciones admin (cambio de rol, reset de password, activar/desactivar) no dejan timestamp en la entidad — solo en el AuditLog (que ademas tiene missing action types).

**Fix:** Agregar `FechaActualizacion DateTime auto, UTC` a la entidad Usuario.

---

### [A-18] SUGGESTION — Seccion 5.3, Visor
**Sin especificacion de header Content-Disposition al servir archivos**

`GET /api/v1/documentos/{id}/file` retorna un stream pero el spec no define si la respuesta usa `Content-Disposition: inline` (mostrar en browser) o `attachment` (forzar descarga). El boton "Descargar" y el visor in-modal necesitan comportamientos distintos pero llaman al mismo endpoint.

**Fix:** Agregar parametro `?download=true` que cambie entre `inline` y `attachment; filename="..."` usando el `NombreOriginal` almacenado.

---

### [A-19] SUGGESTION — Seccion 4.2, Documento
**`NombreOriginal` almacenado y mostrado sin especificacion de sanitizacion**

El spec almacena el nombre original del archivo para mostrar. Los nombres de archivo pueden contener caracteres inseguros en headers `Content-Disposition` (requiere RFC 5987 encoding para nombres no-ASCII). No se especifica normalizacion ni sanitizacion.

**Fix:** Sanitizar `NombreOriginal` en upload (strip caracteres no-printable, limite 255 chars) y usar RFC 5987 encoding al setear `Content-Disposition: attachment; filename*=UTF-8''...`.

---

## Detalle completo — Juez B

### [B-1] CRITICAL — Seccion 6 / Seccion 7 A07
**Logout cosmetic: tokens siguen validos despues de POST /api/v1/auth/logout**

El spec define `POST /api/v1/auth/logout` → escribe audit log y retorna 204. JWT es stateless. Nada invalida el token. Un token robado o interceptado permanece valido por 2hs despues del logout. El spec no menciona denylist ni revocacion con tokens de corta duracion. Para un sistema con acceso a escaneos de DNI y datos personales de trabajadores de salud, este es un vector de ataque real, no teorico.

**Fix:** Agregar server-side token denylist (Redis o tabla DB) verificada en el middleware de auth, O reconocer el riesgo explicitamente y aceptarlo como trade-off de MVP.

---

### [B-2] CRITICAL — Seccion 5.2 vs Seccion 7 A04
**Contradiccion directa: DNI mostrado en resultados pero Sec. 7 lo prohibe explicitamente**

Sec. 5.2 lista columnas de resultados: "Apellido+Nombre, Funcion/Servicio, DNI, N° Expediente, Tipo." Sec. 7 A04: "Busqueda por apellido no revela datos sensibles (DNI, CUIL) en los resultados de lista." No pueden ser ambos correctos. DNI es explicitamente sensible bajo Ley 25.326.

**Fix:** Eliminar DNI de las columnas de resultados; mostrar solo en el perfil autenticado que genera audit log entry.

---

### [B-3] CRITICAL — Seccion 7 A09 vs Seccion 4.4
**Login fallido: el campo no existe en la entidad AuditLog**

Sec. 7 A09 manda loguear logins fallidos con `email_intento (solo hash)`. La entidad AuditLog de Sec. 4.4 no tiene campo para esto. `NombreUsuario` es "snapshot del nombre al momento de la accion" — no hay usuario al momento de un login fallido. La entidad no puede almacenar este dato como esta disenada. `DetalleExtra` existe pero el spec no lo mapea a esto.

**Fix:** Mapear explicitamente el dato de login fallido a `DetalleExtra` o agregar campo nullable dedicado, y documentarlo en la definicion de la entidad.

---

### [B-4] CRITICAL — Seccion 10
**`useDeferredValue` NO hace debounce de requests de red**

Sec. 10 dice: "Mejor que debounce manual para React — React maneja la prioridad automaticamente." Esto es tecnicamente incorrecto. `useDeferredValue` difiere el *render* de UI obsoleta — no throttlea ni batchea requests de red. Con `deferredQuery` conectado al `queryKey` de TanStack Query, cada keystroke sigue disparando un fetch nuevo en el siguiente ciclo de render. Sec. 5.2 correctamente especifica debounce 300ms. Implementar Sec. 10 como esta escrito produce una busqueda que hammerea la API en cada keystroke.

**Fix:** Mantener debounce (via hook `useDebounce` o libreria) para el query key. `useDeferredValue` es apropiado para el display de resultados para no bloquear el input, no como sustituto del debounce.

---

### [B-5] WARNING (real) — Seccion 6 (formato de paginacion)
**Cursor-based y page numbers son mutuamente excluyentes en el schema de respuesta**

La tabla de decisiones dice "Cursor-based — O(1) vs O(n) de OFFSET." El formato de respuesta incluye tanto `cursor` COMO `pagina: 1`, `totalPaginas: 3`. No se puede saber el total de paginas sin hacer un `COUNT(*)` scan — exactamente el trabajo O(n) que cursor pagination evita. Incluir `total` y `totalPaginas` fuerza una query de conteo completo en cada llamada de busqueda.

**Fix:** Elegir uno. Si cursor-based, eliminar `pagina` y `totalPaginas`; retornar solo `cursor`, `hasNextPage`, y opcionalmente `total` con un conteo cacheado/aproximado.

---

### [B-6] WARNING (real) — Seccion 6 Documentos vs Seccion 7 A09
**DELETE de documento es hard delete; rompe auditabilidad**

`DELETE /api/v1/documentos/{id}` → "elimina archivo fisico + registro en DB." El AuditLog registra `EliminarDocumento` con `documento_id`. Si el registro en DB se elimina permanentemente, el audit log referencia una fila inexistente — la FK o rompe (si esta enforced) o queda como dangling reference. Todas las otras entidades usan soft delete. Esta es la unica excepcion y es inconsistente.

**Fix:** Soft delete en documentos (agregar campo `Activo` o `EliminadoEn`); eliminar el archivo fisico pero retener el registro en DB para referencia del audit.

---

### [B-7] WARNING (real) — Seccion 7 A01
**Verificar Activo en cada request requiere lookup DB — sin diseno para esto**

"Verificar Activo en cada request." El JWT payload no contiene `Activo`. Esto requiere una query DB en cada request autenticado. El spec no aborda como el middleware realiza esta verificacion (estrategia de caching, tabla separada, etc.) ni el impacto en latencia. Implementado de forma naive, es un DB hit en cada llamada a la API.

**Fix:** Especificar el mecanismo — ej: cachear estado de usuario en Redis con TTL corto, O aceptar que la desactivacion tarda hasta 2hs en tomar efecto (expiracion del token) y documentarlo como decision explicita.

---

### [B-8] WARNING (real) — Seccion 4.4
**AuditLog enum sin todos los eventos de gestion de usuarios**

Sec. 5.5 cubre crear usuarios, desactivar usuarios, cambiar roles, resetear passwords — todas acciones admin sobre datos sensibles. El enum `Accion` de Sec. 4.4 no tiene valores para `CrearUsuario`, `DesactivarUsuario`, `CambiarRol`, `ResetPassword`. La tabla de audit de Sec. 7 A09 tambien los omite. Las acciones admin sobre el roster de usuarios son exactamente los eventos que la Ley 25.326 y la seguridad interna requieren trazar.

**Fix:** Agregar los valores de accion faltantes al enum y a la tabla de A09.

---

### [B-9] WARNING (real) — Seccion 4.2
**Sin constraint de unicidad: multiples documentos del mismo tipo por profesional son posibles**

El spec no dice si un `Profesional` puede tener dos documentos `DniFrente`. No hay `UNIQUE(ProfesionalId, TipoDocumento)` mencionado ni regla a nivel de aplicacion. El diseno de UI muestra una card por tipo (implica uno por tipo) pero el modelo de datos permite ilimitados. Subir un segundo documento del mismo tipo crearia inconsistencia entre lo que muestra la UI y lo almacenado.

**Fix:** Definir explicitamente — si uno por tipo, agregar el unique constraint; si multiples, explicar el comportamiento del grid en la UI.

---

### [B-10] WARNING (real) — Seccion 7 A08
**Magic bytes cubre solo 3 MIME types sin politica de rechazo para el resto**

La tabla cubre JPEG, PNG y PDF. El enum `TipoDocumento` incluye `DeclaracionJurada`, `ConstanciaCuil`, `DjGrupoFamiliar`, `Resolucion` — que en la practica podrian ser documentos Word, TIFFs escaneados, etc. El spec no dice que pasa cuando los magic bytes de un archivo no matchean uno de los tres tipos listados: es rechazado? Hay un allowlist mas amplio? Sin esto, las implementaciones van a divergir o permitir tipos de archivo no validados.

**Fix:** Definir el allowlist completo de MIME types y declarar explicitamente que cualquier cosa fuera de el es rechazada con 400.

---

### [B-11] WARNING (real) — Seccion 10 vs Seccion 14
**localStorage JWT decidido en Sec.10 pero listado como decision pendiente en Sec.14**

Sec. 10 dice: "JWT en localStorage (MVP — mas simple)." Sec. 14 lista "JWT en localStorage (simple) o httpOnly cookie (mas seguro vs XSS)?" como decision pendiente. El spec no puede tener algo a la vez decidido y pendiente. La seccion de implementacion prescribe un enfoque concreto (y con menos seguridad) mientras la seccion de decisiones senala incertidumbre.

**Fix:** Resolver la decision; si se queda con localStorage para MVP, eliminarla de Sec. 14 y documentar el riesgo XSS aceptado explicitamente.

---

### [B-12] WARNING (real) — Seccion 13 (orden de implementacion)
**AuditLog diferido al paso 11 pero requerido desde el paso 2**

Login (paso 2) debe registrar eventos `Login` y `Login fallido`. Upload de documentos (paso 4) debe registrar `SubirDocumento`. Pero AuditLog es el paso 11. Seis pasos de implementacion producen eventos auditables sin infraestructura de audit en lugar. Si se testea incrementalmente, puede haber builds intermedios deployados sin audit.

**Fix:** Implementar la tabla AuditLog y la infraestructura de escritura append-only en el paso 2 junto con Auth; dejar la pantalla de visualizacion para el paso 11.

---

### [B-13] WARNING (real) — Seccion 9
**`FechaActualizacion` sin mecanismo de actualizacion especificado**

`FechaActualizacion DateTime auto, UTC` — EF Core NO actualiza automaticamente campos timestamp en modificacion. Sin un `SaveChangesInterceptor`, una `.HasComputedColumnSql()`, o asignacion explicita en la capa de servicios, este campo nunca se va a actualizar despues de la creacion. La palabra "auto" implica que pasa automaticamente, pero EF Core no hace esto out of the box.

**Fix:** Especificar la implementacion — ya sea un `SaveChangesInterceptor` o asignacion explicita en la capa de servicio; eliminar el ambiguo "auto".

---

### [B-14] WARNING (real) — Seccion 5.3 / Seccion 7 A05
**PDF en iframe no funciona en la mayoria de browsers mobile — contradice mobile-first**

Sec. 5.3 especifica: "PDFs: `<iframe>` o `<embed>` dentro del modal." Sec. 11 manda mobile-first (375px primero). iOS Safari no renderiza PDFs en `<iframe>` o `<embed>` — o dispara una descarga o falla silenciosamente. Chrome en Android tiene comportamiento inconsistente. El formato primario de documentos (documentos escaneados son mayormente PDFs) rompe en mobile, lo que contradice el mandato explicito de mobile-first.

**Fix:** Usar un renderer JS de PDF (ej: `react-pdf` / `pdfjs-dist`) para mobile o detectar la plataforma y caer en un link de descarga; eliminar `<iframe>` como mecanismo de display primario.

---

### [B-15] WARNING (theoretical) — Seccion 7 A08
**Content-Length es poco confiable como gate de tamanio**

"Rechazar antes de leer el stream completo (header Content-Length)." En un request `multipart/form-data`, el `Content-Length` es el tamanio total del body incluyendo boundaries y otros campos, no solo el archivo. Un cliente tambien puede enviar chunked transfer sin Content-Length. Depender solo del header es bypasseable.

**Fix:** Usar Content-Length como rechazo anticipado pero enforcer el limite de tamanio contando bytes al leer el stream y abortando sobre el threshold.

---

### [B-16] WARNING (theoretical) — Seccion 9
**Razonamiento de `ConfigureAwait(false)` es tecnicamente incorrecto**

El spec dice: "(no en Controllers — no hay SynchronizationContext en ASP.NET)." ASP.NET Core no tiene SynchronizationContext en ningun lado — ni en controllers, ni en services, ni en repositories. La distincion implica que los controllers tienen un SynchronizationContext cuando no lo tienen. `ConfigureAwait(false)` en codigo ASP.NET Core es un no-op en cualquier caso. La regla va a causar uso inconsistente sin ningun beneficio real.

**Fix:** Eliminar la distincion entre parentesis; si `ConfigureAwait(false)` se requiere como convencion de estilo (ej: portabilidad a libraries), aplicarlo uniformemente o eliminarlo y agregar un comentario explicando que es no-op en ASP.NET Core.

---

### [B-17] SUGGESTION — Seccion 4.1
**DNI regex acepta solo DNIs de 8 digitos; rechaza DNIs de 7 digitos (emitidos antes de los 90s)**

El regex Zod `/^\d{2}\.\d{3}\.\d{3}$/` y el formato "XX.XXX.XXX" fuerzan exactamente 8 digitos. DNIs argentinos mas viejos son de 7 digitos (formato X.XXX.XXX). Personal del hospital con DNIs mas viejos va a fallar la validacion.

**Fix:** Usar `/^\d{1,2}\.\d{3}\.\d{3}$/` o almacenar DNI solo como digitos internamente y formatear para display.

---

### [B-18] SUGGESTION — Seccion 6
**Sin endpoint de API definido para ver el AuditLog**

Sec. 5.5 no tiene pantalla de audit log, Sec. 6 no tiene endpoint de audit log, pero Sec. 13 paso 11 dice "visualizacion." No hay nada contra que implementar. Un admin deberia poder ver quien accedio a que legajo — ese es un objetivo declarado en Sec. 1.

**Fix:** Agregar `GET /api/v1/audit` con filtros (usuario_id, profesional_id, desde, hasta) y la pantalla admin correspondiente en Sec. 5.

---

### [B-19] SUGGESTION — Seccion 7 / Seccion 1
**Sin politica de derechos de sujetos de datos ni retencion definida (Ley 25.326)**

La Ley 25.326 Art. 14 otorga a los sujetos el derecho de acceder y corregir sus datos personales. Art. 17 da el derecho de solicitar eliminacion. El sistema almacena escaneos de DNI, CUIL, domicilio y documentos personales — todos cubiertos por la ley. El spec menciona la ley en la tabla de decisiones pero no contiene politica de retencion, periodos, ni procedimiento para que un profesional ejerza sus derechos.

**Fix:** Agregar seccion breve definiendo politica de retencion (cuanto tiempo se mantienen registros despues de desactivacion) y procedimiento manual para ejercer derechos de Art. 14/17.

---

## Estado del Juicio

**JUDGMENT: PENDIENTE** — 4 CRITICALs confirmados deben corregirse antes de aprobacion.

Proximos pasos: corregir los 4 confirmados en el spec, luego re-juzgar en paralelo.
