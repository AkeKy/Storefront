# Gadget Arena Storefront

Gadget Arena is a bilingual Next.js storefront. Authentication uses same-origin route handlers as a Backend-for-Frontend (BFF): the browser never calls the Go authentication API directly and never receives a JWT in JavaScript.

## Quick start

This repository uses npm.

```bash
npm install
npm run dev
```

The development server runs at `http://localhost:4028`.

## Authentication configuration

Copy `.env.example` to `.env.local` and configure:

| Variable | Purpose |
| --- | --- |
| `BACKEND_API_URL` | Server-only Go API origin; required for BFF authentication. Never use a `NEXT_PUBLIC_` name. |
| `NEXT_PUBLIC_SITE_URL` | Canonical Storefront origin, used to validate same-origin state-changing requests. |
| `NEXT_PUBLIC_API_URL` | Optional public-catalog API origin. It is not an authentication setting. |

For a local full-stack session, run the Go API separately, set `BACKEND_API_URL` to its origin, and set `NEXT_PUBLIC_SITE_URL` to the Storefront origin. Do not place database passwords, administrator bootstrap passwords, JWT keys, or JWTs in `.env.local` or any `NEXT_PUBLIC_*` variable.

## Session boundary

`POST /api/auth/login` forwards credentials server-side and stores the returned access token only in the `gadget_arena_session` cookie. The cookie is `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure` in production. Local and session storage must not contain a JWT. `GET /api/auth/session` restores the public session profile; `POST /api/auth/logout` clears the cookie even when the backend is unavailable.

The Go access-token lifetime is configured with `JWT_ACCESS_TTL` (two hours by default in development). There is no refresh token: an expired, invalid, or missing session returns 401 and requires sign-in again.

Public registration creates Members only. It has no role picker; administrator accounts are created exclusively through the backend's server-side bootstrap command.

## Verification

```bash
npm test
npm run type-check
npm run build
```
