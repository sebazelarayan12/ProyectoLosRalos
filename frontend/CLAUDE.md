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

## Auth

- Token + usuario en `localStorage` bajo las claves `auth_token` / `auth_usuario` — usadas tanto en
  `features/auth/context/AuthContext.tsx` como en `lib/api/index.ts`. Si se cambia una, cambiar la
  otra (no estan centralizadas en una constante compartida todavia).
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

## Paginacion cursor-based en UI (Paso 6)

`PaginationPrevious`/`PaginationNext` de shadcn son para links reales (`<a href>`) navegables por
URL. Nuestra paginacion es cursor-based con estado en memoria (sin URL por pagina), asi que
`PaginacionResultados` usa `Button` simple con `disabled` dentro del wrapper `Pagination` (mantiene
el rol de accesibilidad `nav`) en lugar de `PaginationLink`. El historial de cursores para "Anterior"
se maneja con una pila en el estado del componente (`historial: (string | undefined)[]`), reseteada
en los handlers de cambio de apellido/filtros (no en `useEffect` — sigue el patron
`rerender-move-effect-to-event` de vercel-react-best-practices).
