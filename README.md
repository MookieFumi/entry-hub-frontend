# entry-hub-frontend

React frontend of [entry-hub](https://github.com/mookie-studio/entry-hub), the room-booking API. It is a minimal-cost demo (v1.0.0). The user interface is in Spanish; code, issues and pull requests are in English.

## Stack

Vite + React 19 + strict TypeScript · Tailwind CSS 4 · [Base UI](https://base-ui.com) (MIT, unstyled components) · TanStack Query · `openapi-fetch` with types generated from the contract · Supabase Auth · Vitest + Testing Library.

The look follows the visual language of Untitled UI (tokens in `src/styles/index.css`), but **no Untitled UI code is copied**: the repository is public and its license forbids exposing the code of the PRO components.

## Getting started

```bash
npm install
cp .env.example .env.local   # set VITE_API_URL
npm run dev                  # http://localhost:5173
```

The API must allow CORS for `http://localhost:5173` (`Cors:AllowedOrigins`).

Without the Supabase variables, the login screen accepts a token pasted from `dotnet user-jwts` (development mode). To sign in with Supabase Auth, see [docs/supabase-setup.md](docs/supabase-setup.md).

## Scripts

| Command                                 | What it does                                                         |
| --------------------------------------- | -------------------------------------------------------------------- |
| `npm run dev` / `build` / `preview`     | Development server, production build and preview                     |
| `npm run lint` · `format` · `typecheck` | ESLint, Prettier (check only) and TypeScript                         |
| `npm test`                              | Tests with Vitest                                                    |
| `npm run e2e`                           | Playwright end-to-end tests and axe accessibility checks             |
| `npm run api:types`                     | Regenerates `src/api/schema.d.ts` from `contracts/EntryHub.Api.json` |
| `npm run api:check`                     | Fails if the committed types do not match the contract               |

## End-to-end tests

`npm run e2e` starts the app with the API simulated in the browser (`e2e/fake-api.ts`), so no backend is needed. It covers sign-in, booking, cancellation, room creation and axe accessibility checks (no serious violations) on the key screens. Locally, install the browser once with `npx playwright install chromium`, or point `PW_CHROMIUM_PATH` to an existing Chromium. `@axe-core/playwright` is MPL-2.0 and is a development dependency only; it is not shipped in the app.

## API contract

`contracts/EntryHub.Api.json` is a copy of the API contract (`contracts/EntryHub.Api.json` in entry-hub). When the API changes: copy the new file, run `npm run api:types` and commit both. CI fails if they do not match.

## CI and releases

- `.github/workflows/ci.yml`: on every PR and on `main` it runs format, lint, types, contract check, tests, build and `npm audit`.
- `.github/workflows/release.yml`: when a `vX.Y.Z` tag is created it repeats the checks, builds, creates a GitHub release with the zip and, if enabled, deploys to Cloudflare Pages.

To enable deployment, follow [docs/deployment.md](docs/deployment.md). In short: repository variables `CLOUDFLARE_DEPLOY=true` and `CLOUDFLARE_PROJECT`, secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, and variables `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (the anon key is public by design; never use the `service_role` key).

## Structure

```text
src/
  api/            typed client (openapi-fetch), problem+json errors and rule messages
  components/ui/  base components on top of Base UI
  lib/            configuration, dates and time zones (office zone)
  styles/         Tailwind and design tokens
```

Full plan and backlog: the project plan (`frontal-react-plan.md`) and the GitHub issues.

## TypeScript 7

Type checking and the build use TypeScript 7 (native compiler) through the `typescript7` alias in `package.json`.
`typescript` stays on 5.x because `typescript-eslint` and `openapi-typescript` still need the JavaScript compiler API.
When both support TypeScript 7, remove the alias and move `typescript` to 7.
