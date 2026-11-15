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
- **Cloudflare Pages / GitHub release:** set the three as repository **variables** (they are public values, they end up in the built JavaScript). See [deployment.md](deployment.md).
- **No variables at all:** the login screen switches to development mode and accepts a token pasted from `dotnet user-jwts`.

## 2. Redirect URLs

In _Authentication → URL Configuration_:

- **Site URL:** the production address of the frontend (the Cloudflare Pages domain, or the custom domain when there is one).
- **Redirect URLs:** add every origin that can sign in:
  - `http://localhost:5173` for local development;
  - the production domain;
  - `https://*.pages.dev` if you want preview deployments to sign in (wildcards are allowed in this list).

The app uses password sign-in only, so no redirect happens in the normal flow; the list matters for password-reset and magic-link emails if they are enabled later.

## 3. Accounts, tenants and the token hook

The API needs two claims in the access token: `tenant_id` (a GUID) and `user_role` (`Employee` or `Facilities`). Supabase adds them through a _Custom Access Token Hook_. The role claim is called `user_role` and not `role` because in Supabase `role` is `authenticated` (the PostgreSQL role). The API must run with `Authentication__RoleClaim=user_role`.

> The hook is not stored in any repository: the SQL below is the only copy. Run it once per Supabase project.

1. **Signing keys.** _Project Settings → JWT Keys / Signing Keys_: the project must use an asymmetric key (the API validates tokens through the public JWKS at `https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json`).
2. **Sign-ups off.** _Authentication → Sign In / Providers_, untick "Allow new users to sign up". This is a demo: an administrator creates the accounts.
3. **Membership table and hook.** In the _SQL Editor_ (everything lives in a `private` schema that the Data API does not expose):

   ```sql
   create schema if not exists private;

   create table private.user_tenants (
     user_id   uuid primary key references auth.users (id) on delete cascade,
     tenant_id uuid not null,
     app_role  text not null check (app_role in ('Employee', 'Facilities'))
   );

   create or replace function private.custom_access_token_hook(event jsonb)
   returns jsonb
   language plpgsql
   stable
   as $$
   declare
     claims jsonb := event -> 'claims';
     membership record;
   begin
     select tenant_id, app_role into membership
     from private.user_tenants
     where user_id = (event ->> 'user_id')::uuid;

     if found then
       claims := jsonb_set(claims, '{tenant_id}', to_jsonb(membership.tenant_id::text));
       claims := jsonb_set(claims, '{user_role}', to_jsonb(membership.app_role));
     end if;

     return jsonb_set(event, '{claims}', claims);
   end;
   $$;

   grant usage on schema private to supabase_auth_admin;
   grant select on private.user_tenants to supabase_auth_admin;
   grant execute on function private.custom_access_token_hook to supabase_auth_admin;
   revoke execute on function private.custom_access_token_hook from authenticated, anon, public;
   ```

4. **Enable the hook.** _Authentication → Hooks_ → _Custom Access Token_ → Postgres function → `private.custom_access_token_hook`.
5. **Create the users.** _Authentication → Users → Add user → Create new user_, with **Auto Confirm User** ticked (the default Supabase mailer has a very low sending limit). The API seeds two demo tenants when it starts with `Demo__Seed=true`:

   | Tenant            | Tenant id                              |
   | ----------------- | -------------------------------------- |
   | Acme Corporation  | `de000000-0000-0000-0000-0000000000a1` |
   | Globex Industries | `de000000-0000-0000-0000-0000000000a2` |

   Create one Employee and one Facilities user per tenant (four users), then assign tenant and role by email (replace the example emails with yours):

   ```sql
   insert into private.user_tenants (user_id, tenant_id, app_role)
   select u.id, v.tenant_id::uuid, v.app_role
   from (values
     ('ana@acme.example',    'de000000-0000-0000-0000-0000000000a1', 'Employee'),
     ('fran@acme.example',   'de000000-0000-0000-0000-0000000000a1', 'Facilities'),
     ('gael@globex.example', 'de000000-0000-0000-0000-0000000000a2', 'Employee'),
     ('gina@globex.example', 'de000000-0000-0000-0000-0000000000a2', 'Facilities')
   ) as v (email, tenant_id, app_role)
   join auth.users u on u.email = v.email;
   -- must insert 4 rows
   ```

6. **Inspect a token** (the publishable key is public; never use `service_role`):

   ```bash
   curl -s -X POST "https://<project-ref>.supabase.co/auth/v1/token?grant_type=password" \
     -H "apikey: <publishable-key>" -H "Content-Type: application/json" \
     -d '{"email":"fran@acme.example","password":"<password>"}'
   echo "<access_token>" | cut -d. -f2 | base64 -d   # add "=" at the end if it complains
   ```

   The claims must include `iss = https://<project-ref>.supabase.co/auth/v1`, `aud = authenticated`, `tenant_id` and `user_role`.

## 4. Check that it works

1. Sign in with a demo user.
2. In the browser's network tab, `GET /api/v1/me` must answer 200 with the role and the tenant name; the header shows the tenant name and the role.
3. A 403 on `/me` means the token has no `tenant_id`; a CORS error means the API does not list the frontend origin (`Cors:AllowedOrigins`).
4. Wrong password: the app shows one generic message and does not say which field is wrong.

## 5. Security notes

- The anon key is safe in the browser only because Row Level Security protects the data. The frontend never talks to the database directly: all data goes through the API.
- Do not commit `.env.local`; `.gitignore` already excludes it.
- When the Content-Security-Policy is tightened (issue F12.2), add the Supabase project URL to `connect-src`.
