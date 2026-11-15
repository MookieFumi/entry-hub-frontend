# entry-hub-frontend

Frontal React de [entry-hub](https://github.com/MookieFumi/entry-hub), la API de reserva de salas. Es una demo de coste mínimo (v1.0.0).

## Stack

Vite + React 19 + TypeScript estricto · Tailwind CSS 4 · [Base UI](https://base-ui.com) (MIT, componentes sin estilos) · TanStack Query · `openapi-fetch` con tipos generados del contrato · Supabase Auth (próximamente) · Vitest + Testing Library.

El aspecto sigue el lenguaje visual de Untitled UI (tokens en `src/styles/index.css`), pero **no se copia código de Untitled UI**: el repo es público y su licencia prohíbe exponer el código de los componentes PRO.

## Empezar

```bash
npm install
cp .env.example .env.local   # ajusta VITE_API_URL
npm run dev                  # http://localhost:5173
```

La API debe tener CORS abierto para `http://localhost:5173` (`Cors:AllowedOrigins`).

## Scripts

| Comando                                 | Qué hace                                                           |
| --------------------------------------- | ------------------------------------------------------------------ |
| `npm run dev` / `build` / `preview`     | Servidor de desarrollo, build de producción y vista previa         |
| `npm run lint` · `format` · `typecheck` | ESLint, Prettier (solo comprueba) y TypeScript                     |
| `npm test`                              | Pruebas con Vitest                                                 |
| `npm run api:types`                     | Regenera `src/api/schema.d.ts` desde `contracts/EntryHub.Api.json` |
| `npm run api:check`                     | Falla si los tipos commiteados no coinciden con el contrato        |

## Contrato de la API

`contracts/EntryHub.Api.json` es una copia del contrato de la API (`contracts/EntryHub.Api.json` en entry-hub). Al cambiar la API: copia el fichero nuevo, ejecuta `npm run api:types` y commitea ambos. El CI falla si no coinciden.

## CI y releases

- `.github/workflows/ci.yml`: en cada PR y en `main` ejecuta formato, lint, tipos, comprobación del contrato, pruebas, build y `npm audit`.
- `.github/workflows/release.yml`: al crear un tag `vX.Y.Z` repite las comprobaciones, construye, crea una release de GitHub con el zip y, si está activado, despliega en Cloudflare Pages.

Para activar el despliegue: variable de repositorio `CLOUDFLARE_DEPLOY=true` y `CLOUDFLARE_PROJECT`, secretos `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID`, y variables `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (la clave anon es pública por diseño; nunca pongas la `service_role`).

## Estructura

```text
src/
  api/        cliente tipado (openapi-fetch), errores problem+json y mensajes de reglas
  components/ui/  componentes base sobre Base UI
  lib/        configuración y fechas (zona de la oficina)
  styles/     Tailwind y tokens de diseño
```

Plan completo y backlog: ver el plan del proyecto (`frontal-react-plan.md`).

## TypeScript 7

Type checking and the build use TypeScript 7 (native compiler) through the `typescript7` alias in `package.json`.
`typescript` stays on 5.x because `typescript-eslint` and `openapi-typescript` still need the JavaScript compiler API.
When both support TypeScript 7, remove the alias and move `typescript` to 7.
