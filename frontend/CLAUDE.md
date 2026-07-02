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

Al agregar una feature nueva (busqueda, perfil, documentos, usuarios): crear `features/<nombre>/`
con el mismo patron. No crear carpetas tecnicas top-level (`hooks/`, `contexts/`, `pages/` sueltas
en `src/`) — eso vuelve a layered architecture.

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
- Dependencia `lucide-react` sin uso todavia — se necesita en el paso de diseno visual (spec Sec. 11,
  Iconos: CRITICO). Se deja instalada para evitar remover/reinstalar en 1-2 pasos.
