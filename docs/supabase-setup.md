# Supabase setup for the frontend

The frontend signs users in with Supabase Auth (email and password) and sends the access token to the API as a Bearer token. The API validates that token; the role and the tenant come from `GET /me`, never from the token decoded in the browser.

> Supabase renames menu entries from time to time. The names below are the current ones at the time of writing; if one is missing, search the dashboard for the setting.

## 1. Variables

| Variable                 | Where to find it                                                  | Notes                                                    |
| ------------------------ | ----------------------------------------------------------------- | -------------------------------------------------------- |
| `VITE_SUPABASE_URL`      | Supabase dashboard, _Project Settings → API_, **Project URL**     | Looks like `https://<project-ref>.supabase.co`           |
| `VITE_SUPABASE_ANON_KEY` | Same page, the **anon** / **publishable** key                     | Public by design. **Never** use the `service_role` key.  |
| `VITE_API_URL`           | The deployed API (App Service) or `http://localhost:5000` locally | No trailing slash. The API must allow this site in CORS. |

- **Local:** copy `.env.example` to `.env.local` and fill them in. Vite only exposes variables that start with `VITE_`.
- **Cloudflare Pages / GitHub release:** set the three as repository **variables** (they are public values, they end up in the built JavaScript). See _CI and releases_ in the README.
- **No variables at all:** the login screen switches to development mode and accepts a token pasted from `dotnet user-jwts`.

## 2. Redirect URLs

In _Authentication → URL Configuration_:

- **Site URL:** the production address of the frontend (the Cloudflare Pages domain, or the custom domain when there is one).
- **Redirect URLs:** add every origin that can sign in:
  - `http://localhost:5173` for local development;
  - the production domain;
  - `https://*.pages.dev` if you want preview deployments to sign in (wildcards are allowed in this list).

The app uses password sign-in only, so no redirect happens in the normal flow; the list matters for password-reset and magic-link emails if they are enabled later.

## 3. Accounts

- Turn **sign-ups off** (_Authentication → Sign In / Providers_, "Allow new users to sign up"). This is a demo: an administrator creates the accounts.
- Create users in _Authentication → Users_, or with the Admin API.
- Each user needs a row in the membership table used by the token hook, so that the token carries `tenant_id` and `user_role`. Without them the API answers 403 and the app shows "Account has no customer". Follow part 5 of the infrastructure guide in the API repository (Custom Access Token Hook).

## 4. Check that it works

1. Sign in with a demo user.
2. In the browser's network tab, `GET /api/v1/me` must answer 200 with the role and the tenant name; the header shows the tenant name and the role.
3. A 403 on `/me` means the token has no `tenant_id`; a CORS error means the API does not list the frontend origin (`Cors:AllowedOrigins`).
4. Wrong password: the app shows one generic message and does not say which field is wrong.

## 5. Security notes

- The anon key is safe in the browser only because Row Level Security protects the data. The frontend never talks to the database directly: all data goes through the API.
- Do not commit `.env.local`; `.gitignore` already excludes it.
- When the Content-Security-Policy is tightened (issue F12.2), add the Supabase project URL to `connect-src`.
