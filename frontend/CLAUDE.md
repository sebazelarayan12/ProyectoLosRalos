# Legajos Digitales Frontend — AI Agent Ruleset

Ver spec en `docs/specs/2026-06-28-legajos-digitales-design.md` Sec. 10 para stack y convenciones frontend.

## Estructura — screaming architecture

Carpetas top-level dentro de `src/` scream por dominio/feature, no por capa tecnica:

```
features/<nombre>/
  components/   <- componentes propios de la feature (+ __tests__ al lado)
  context/       <- contexto de React si la feature lo necesita
  pages/         <- componentes montados directamente por una ruta
```

`lib/` es infraestructura transversal sin logica de negocio (cliente axios, utils de shadcn).
`components/ui/` es el kit shadcn generado (ruta fija por `components.json` — no reorganizar).
`routes/AppRouter.tsx` es composicion de la app (conecta features entre si), no logica de dominio.
`hooks/` (top-level) es exclusivamente para hooks genericos reutilizables entre features (ej.
`useDebounce`) — alias ya reservado por `components.json` para hooks propios de shadcn. Un hook
atado a una sola feature (ej. `useProfesionales`) va dentro de `features/<nombre>/hooks/`, nunca
en el `hooks/` top-level.

Al agregar una feature nueva (busqueda, perfil, documentos, usuarios): crear `features/<nombre>/`
con el mismo patron (`api/`, `components/`, `hooks/`, `pages/` segun necesite). No crear otras
carpetas tecnicas top-level (`contexts/`, `pages/` sueltas en `src/`) — eso vuelve a layered
architecture.

## Reutilizacion de componentes — obligatorio

**Regla irrompible: nunca duplicar codigo.** Antes de escribir un componente, hook o helper nuevo,
buscar si ya existe algo reutilizable (`src/components/`, `src/hooks/`, `lib/`). Si dos o mas
lugares necesitan la misma logica/markup, extraerla — no copiar y pegar con variaciones.

Arbol de decision — donde va un componente nuevo:

```
Se usa en una sola feature?
  -> features/<nombre>/components/

Se usa en 2+ features o pantallas, y es generico (compuesto con components/ui/)?
  -> src/components/ (ej: SelectField.tsx)

Es un primitivo shadcn sin logica propia?
  -> components/ui/ (via `npx shadcn add`, nunca a mano)
```

Arbol de decision — donde va un hook nuevo:

```
Logica de fetching/estado atada a una sola feature?
  -> features/<nombre>/hooks/

Utilidad generica reutilizable entre features (ej: useDebounce)?
  -> src/hooks/
```

Antes de dar un paso por completado, revisar si quedo JSX o logica casi identica repetida en 2+
archivos (mismo Field+Select, mismo bloque de validacion, mismas keys de localStorage) y extraerla
en ese momento — no dejarlo para "despues". Ejemplos ya resueltos en este proyecto:
- `SelectField` (`src/components/SelectField.tsx`) — Field + Select + opciones, usado por
  `FiltrosProfesionales` (Tipo y Planta). Reusar aca antes de escribir otro Select con label.
- `AUTH_TOKEN_KEY` / `AUTH_USUARIO_KEY` (`src/lib/authStorage.ts`) — unica fuente de verdad para
  las claves de `localStorage` de sesion, usada por `AuthContext` y `lib/api/index.ts`.

## Auth

- Claves de `localStorage` centralizadas en `lib/authStorage.ts` (`AUTH_TOKEN_KEY`,
  `AUTH_USUARIO_KEY`) — usadas por `features/auth/context/AuthContext.tsx` y `lib/api/index.ts`.
  Nunca declarar estas claves como string literal en otro lado.
- `lib/api/client.ts` expone `createApiClient({ getToken, onUnauthorized })` — interceptor de request
  agrega `Authorization: Bearer`, interceptor de response dispara `onUnauthorized` en 401.
- `onUnauthorized` (en `lib/api/index.ts`) limpia localStorage y fuerza `window.location.href = '/login'`
  (hard navigation, no usa React Router) — asi el estado de `AuthContext` se re-lee desde localStorage
  al recargar, sin necesidad de sincronizar contexto manualmente.

## React doctor — advertencias aceptadas (Paso 5)

- `src/components/ui/field.tsx` (useMemo antes de early return) y `src/components/ui/button.tsx`
  (export de `buttonVariants` junto al componente) son boilerplate generado por `shadcn init` —
  patron estandar de shadcn, no se tocan a mano salvo que un cambio real lo requiera.
- `lucide-react` ya esta en uso (los componentes `select.tsx` y `pagination.tsx` generados por
  shadcn lo importan para sus iconos) — advertencia de Paso 5 resuelta, no requiere accion.

## Radix + jsdom — polyfills obligatorios (Paso 6)

`src/test/setup.ts` polyfillea `hasPointerCapture`, `setPointerCapture`, `releasePointerCapture` y
`scrollIntoView` en `Element.prototype`. Sin esto, cualquier test que interactue con `Select` (y
probablemente `Combobox`, `DropdownMenu`, etc. de Radix) falla en jsdom con errores de puntero. Ya
esta resuelto a nivel global — no hay que repetirlo por test.

## Iframe de PDF — sin atributo sandbox (Paso 8)

`sandbox=""` en el iframe de `VisorDocumentoModal.tsx` (agregado por recomendacion de react-doctor)
rompia el render de PDF en Chrome/Brave con "(blocked:other)" en Network, incluso probando
`allow-scripts` y `allow-scripts allow-same-origin`. Root cause confirmado: el visor PDF nativo de
Chromium (PDFium) rechaza cargar dentro de CUALQUIER iframe sandboxeado, sin importar los flags.
Firefox (PDF.js) no tiene esa restriccion — por eso andaba ahi pero no en Chrome/Brave. Fix final:
sacar el atributo `sandbox` por completo. El contenido es un blob generado por nosotros desde un
archivo ya validado en backend (MIME + magic bytes), no HTML arbitrario de tercero, asi que el
sandbox no sumaba proteccion real. Si react-doctor vuelve a marcarlo, es falso positivo — dejar
documentado aca.

## React doctor — advertencias aceptadas (Paso 8)

- `VisorDocumentoModal.tsx` — "Mutation without cache invalidation" en `eliminarMutation`: falso
  positivo. La invalidacion de `['profesional', id]` se delega al caller via el callback
  `onEliminado` (el modal no conoce esa query key, es responsabilidad de `PerfilProfesionalPage`).
- `VisorDocumentoModal.tsx` — "State synced to a prop inside an effect" en el `useEffect` que arma
  el blob URL: falso positivo. No es un ajuste de estado derivado de un prop — `URL.createObjectURL`
  crea un recurso del browser que exige `revokeObjectURL` en el cleanup al cambiar `blob`. Es el caso
  de "Synchronizing with an Effect" documentado por React, no el anti-patron de "adjusting state".
- `VisorDocumentoModal.tsx` — "iframe missing sandbox attribute": falso positivo, ver seccion
  "Iframe de PDF — sin atributo sandbox" arriba. Sandbox rompe el render nativo de PDF en
  Chromium. No agregar sandbox de vuelta aunque react-doctor lo siga marcando.

## Paginacion cursor-based en UI (Paso 6)

`PaginationPrevious`/`PaginationNext` de shadcn son para links reales (`<a href>`) navegables por
URL. Nuestra paginacion es cursor-based con estado en memoria (sin URL por pagina), asi que
`PaginacionResultados` usa `Button` simple con `disabled` dentro del wrapper `Pagination` (mantiene
el rol de accesibilidad `nav`) en lugar de `PaginationLink`. El historial de cursores para "Anterior"
se maneja con una pila en el estado del componente (`historial: (string | undefined)[]`), reseteada
en los handlers de cambio de apellido/filtros (no en `useEffect` — sigue el patron
`rerender-move-effect-to-event` de vercel-react-best-practices).
