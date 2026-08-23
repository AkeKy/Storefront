# Gadget Arena Storefront

Gadget Arena is a bilingual Next.js storefront for gaming gear and PC accessories. It is a portfolio frontend with a browseable product catalog, stock-aware cart, and a truthful demo-first checkout.

## Quick start

This project uses npm as its package-manager standard.

```bash
npm install
npm run dev
```

Open [http://localhost:4028](http://localhost:4028).

## What it includes

- Product catalog with search, category, brand, stock, and price filters.
- Thai-baht pricing and factual stock availability.
- A cart stored locally in the browser, with stock-aware quantity limits.
- English as the default language with a persisted Thai language choice.
- Dark mode by default with a persisted light-mode preference.
- Demo-first checkout with delivery-detail validation; it does not collect payment.

## Catalog and backend status

The catalog uses the public Go API when `NEXT_PUBLIC_API_URL` is configured. Missing, unavailable, or invalid API responses fall back to local fixtures so the storefront remains browseable. Catalog calls require no token; checkout remains demo-first without a developer-provided authenticated session.

The Storefront includes `/login` and `/register` plus same-origin BFF routes for register, login, session, and logout. Payment and production deployment remain outside this documentation scope.

### Run with the local Go API

In the `project_intern1` backend repository:

```powershell
Copy-Item .env.example .env
docker compose up -d
go run ./cmd/generate-dev-keys
$env:DATABASE_USER = 'gadget_arena'
$env:DATABASE_PASSWORD = 'local_app_password'
$env:DATABASE_ADDR = '127.0.0.1'
$env:DATABASE_DBNAME = 'gadget_arena'
$env:DATABASE_PORT = '3307'
$env:SERVER_PORT = '1323'
go run .
```

The backend prerequisites are Docker MySQL, generated development keys, all documented process-local `DATABASE_*` values, and port `1323`.

In the Storefront:

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

Storefront development uses npm and runs on port `4028`. `NEXT_PUBLIC_*` values are exposed to the browser and must never contain secrets. Copy `.env.example` to `.env.local` for full-stack local development. Removing `.env` from Git tracking does not remove historic values; rotate any real credentials.

## Environment variables

| Variable | Needed for | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Production deployment | Canonical URL used by metadata, sitemap, and robots. |
| `NEXT_PUBLIC_API_URL` | Optional public catalog API | Base URL for the Go API; use `http://localhost:1323` for the local backend. |

`NEXT_PUBLIC_API_URL` is optional. Authentication uses the BFF session boundary, never developer token entry. Without a configured or available catalog API, the catalog uses local fixtures.

## Verification

Run these before publishing changes:

```bash
npm test
npm run type-check
npm run build
```

To check whitespace before committing:

```bash
git diff --check
```

## Authentication sessions

Authentication goes through same-origin BFF routes. Configure server-only `BACKEND_API_URL` and `NEXT_PUBLIC_SITE_URL`; set `NEXT_PUBLIC_SITE_URL` to the final public origin before `npm run build`, because changing only runtime environment configuration causes state-changing BFF requests to fail with `403 invalid_origin`.

Login stores the backend JWT only in an HttpOnly, `SameSite=Lax`, path-scoped cookie. Cookie expiry tracks the backend `JWT_ACCESS_TTL` (two hours by default locally); expired sessions require login again. Browser JavaScript, Local Storage, and Session Storage never receive a JWT. Public registration always creates a Member; administrators are bootstrapped only through the backend CLI.
