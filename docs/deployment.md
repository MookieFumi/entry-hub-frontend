# Deploying the frontend (Cloudflare Pages)

The frontend is a static site. It does **not** use Cloudflare's own build: `.github/workflows/release.yml` builds in GitHub Actions and uploads `dist/` with `wrangler pages deploy` (direct upload). Consequences:

- The `VITE_*` values are read from **GitHub repository variables** and end up inside the compiled JavaScript. Nothing needs to be set in the Cloudflare dashboard.
- The Pages project must be of type _Direct Upload_. **Do not connect it to Git**: a Git-connected project does not accept `wrangler` uploads.

Prerequisites: the API is deployed (see `docs/deployment.md` in the [entry-hub](https://github.com/mookie-studio/entry-hub) repository) and Supabase is configured ([supabase-setup.md](supabase-setup.md)).

## 1. Create the Pages project

Either:

- Dashboard: _Workers & Pages → Create → Pages → Upload assets_, name `entry-hub-frontend`; or
- CLI: `npx wrangler@4 pages project create entry-hub-frontend --production-branch main`.

The workflow deploys with `--branch main`, so `main` must be the production branch. The URL is `https://entry-hub-frontend.pages.dev`; if the name is taken Cloudflare adds a suffix, so **copy the real URL** from the dashboard (you need it in step 4). If you use another project name, set the `CLOUDFLARE_PROJECT` variable.

## 2. Token, secrets and variables

1. Cloudflare → _My Profile → API Tokens → Create Token_ with **Account · Cloudflare Pages · Edit**, limited to your account. Copy it (it is shown once).
2. The **Account ID** is in the right-hand sidebar of the Workers & Pages overview.

In this repository, _Settings → Secrets and variables → Actions_:

| Type     | Name                     | Value                                                                             |
| -------- | ------------------------ | --------------------------------------------------------------------------------- |
| Secret   | `CLOUDFLARE_API_TOKEN`   | The token from step 1                                                             |
| Secret   | `CLOUDFLARE_ACCOUNT_ID`  | The account id                                                                    |
| Variable | `VITE_API_URL`           | The API URL, e.g. `https://<app>.azurewebsites.net` (no trailing slash)           |
| Variable | `VITE_SUPABASE_URL`      | `https://<project-ref>.supabase.co`                                               |
| Variable | `VITE_SUPABASE_ANON_KEY` | The **publishable/anon** key (public by design). **Never** the `service_role` key |
| Variable | `CLOUDFLARE_PROJECT`     | Only if the project name is not `entry-hub-frontend`                              |
| Variable | `CLOUDFLARE_DEPLOY`      | `true`. Create it **last**                                                        |

While `CLOUDFLARE_DEPLOY` does not exist, a tag only creates the GitHub release with the zip.

## 3. First release

```bash
git tag v1.0.0 && git push origin v1.0.0
```

`release.yml` repeats lint, types, the contract check (`api:check`) and tests, builds, creates the GitHub release with `entry-hub-frontend-v1.0.0.zip` and publishes to Pages. The tag must look like `vX.Y.Z`. `public/_redirects` makes SPA routes work on reload, and `public/_headers` sets `nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY` and `Permissions-Policy`.

Smoke test: open the Pages URL, sign in, and check that `/status` is green.

## 4. CORS on the API and Supabase redirect URLs

With the real Pages URL:

**API CORS.** The allowed-origins list is empty by default, so the browser blocks every call until you add the origin (`*` is rejected: the API will not start). With the Azure CLI:

```bash
az webapp config appsettings set -g <resource-group> -n <app> --settings \
  "Cors__AllowedOrigins__0=https://entry-hub-frontend.pages.dev"
az webapp restart -g <resource-group> -n <app>
```

Use the exact origin: no trailing slash and the right scheme. Preview deployments are not needed because `release.yml` only publishes `main`.

**Supabase.** In _Authentication → URL Configuration_ set the **Site URL** to the production URL and add it, plus `http://localhost:5173`, to the **Redirect URLs**.

Done when you can sign in with a demo user and see the rooms of the tenant.

## Troubleshooting

| Symptom                                                  | Likely cause                                                                              | What to do                                                                      |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| The Cloudflare step is skipped                           | `CLOUDFLARE_DEPLOY` is not exactly `true`                                                 | Create the repository variable                                                  |
| "project not found" or an authentication error on deploy | Different project name, project connected to Git, or token without Pages · Edit           | Create the project as _Direct Upload_, check `CLOUDFLARE_PROJECT` and the token |
| The site loads but calls `localhost`                     | The `VITE_*` variables did not exist when it was built                                    | Create them and publish a new tag (they are compiled in)                        |
| CORS error in the browser                                | The origin is not in `Cors__AllowedOrigins__N`                                            | Add the exact origin and restart the API                                        |
| 403 on `/me`, "Account has no customer"                  | The token has no `tenant_id` (user missing from `private.user_tenants`, or hook disabled) | See [supabase-setup.md](supabase-setup.md), section 3                           |
| 404 when reloading a route                               | `public/_redirects` missing from `dist/`                                                  | Check that the file is in the build output                                      |
| First API call takes 10 to 30 seconds                    | Cold start of the free App Service plan                                                   | Warm it up before a demo                                                        |
| Login fails or Supabase shows the project as paused      | The free plan pauses after a week without activity                                        | Resume it in the dashboard; check that the API `keep-alive` workflow runs       |
| Rollback says "no earlier tag"                           | It is the first tag                                                                       | Fix and push a new tag                                                          |
