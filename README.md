# MCP Code Website

Product website, setup guides, release news, and private `/admin/` download statistics for [MCP Code](https://github.com/Axz-o/MCPCode).

Built with Next.js (static export), Tailwind CSS, Motion, and Supabase Auth/RLS, deployed to GitHub Pages.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Static build

```bash
npm run build
```

When deploying under a GitHub Pages subpath:

```bash
NEXT_PUBLIC_BASE_PATH=/MCPCode-site NEXT_PUBLIC_SITE_URL=https://axz-o.github.io/MCPCode-site npm run build
```

## Adding guides or news

- **Guides**: add a `.md` file in `content/guides/`
- **News**: add a `.md` file in `content/news/`

Screenshots used by guides live in `public/screenshots/`.

---

## Private `/admin/` panel & Supabase setup

The `/admin/` route displays daily GitHub Releases download counters (`.exe`, `.msi`, per version, and daily increments) protected by **Supabase Auth (Email + Password + TOTP 2FA / AAL2)** and **PostgreSQL Row Level Security**.

### 1. Configure Supabase database & RLS

1. Create a Supabase project.
2. In **Authentication → Sign In / Providers** (or **Authentication → Settings**):
   - Disable **Allow new users to sign up** (public registration must be OFF).
   - Enable **MFA → TOTP (App Authenticator)**.
   - Set **Site URL** to `https://axz-o.github.io/MCPCode-site` and add `https://axz-o.github.io/MCPCode-site/admin/` to **Redirect URLs**.
3. Open **SQL Editor** and run [`supabase/migrations/0001_admin_stats.sql`](supabase/migrations/0001_admin_stats.sql).

### 2. Invite the owner & bind UUID

1. In Supabase **Authentication → Users**, click **Invite user** and send an invitation to the owner email (`axooff7@gmail.com`).
2. After inviting, run [`supabase/seed_owner.sql`](supabase/seed_owner.sql) in **SQL Editor** to bind that user's `UUID` into `public.admin_config`.
3. Open the invite link from your email → `/admin/` shows **Ustaw hasło** → set your password → the invite session ends automatically → sign in with email + password → scan the **Google Authenticator** QR code and confirm with a 6-digit TOTP code.

### 3. GitHub Secrets & daily counter collection

In **`Axz-o/MCPCode-site` → Settings → Secrets and variables → Actions**, add:

- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — your Supabase **publishable** (`anon`) key (used in the public frontend)
- `SUPABASE_URL` — your Supabase project URL (used by the server-side collector)
- `SUPABASE_SERVICE_ROLE_KEY` — your Supabase **service_role** secret key (server-side only, never exposed to frontend)

The workflow [`.github/workflows/collect-release-stats.yml`](.github/workflows/collect-release-stats.yml) runs once daily (`06:00 UTC`) and can also be triggered manually via **Actions → Collect Daily Release Stats → Run workflow**. Re-running it on the same day updates the existing rows for that UTC date.

*(Optionally, you can deploy [`supabase/functions/collect-release-stats/index.ts`](supabase/functions/collect-release-stats/index.ts) as a Supabase Edge Function.)*

## License

MIT
