# Gadget Arena Authentication and Admin Commerce MVP Design

**Date:** 2026-08-23
**Status:** Approved design, pending implementation plan
**Repositories:** `Storefront` branch `test`, `project_intern1` branch `test`

## Goal

Turn the current portfolio storefront into a deployable commerce MVP that demonstrates the existing Go authentication and role system. Customers can register, sign in, place authenticated orders, and view their order history. Administrators can manage products, categories, and order status through a protected dashboard.

The MVP creates order requests but does not collect online payment. Product images are supplied as HTTPS URLs; file upload and media storage are intentionally deferred.

## Current State

The Storefront supports public browsing, a browser-persisted cart, delivery-form validation, bilingual UI, and a demo-first checkout. It currently reads a developer-provided bearer token from local storage, sends only product IDs and quantities to the order API, and does not persist delivery details.

The Go backend exposes register and login endpoints, member order endpoints, public catalog reads, and administrator category/order endpoints. JWT authorization distinguishes Administrator (`permission_id = 1`) from Member (`permission_id = 2`). Product writes do not exist. Registration currently accepts a client-supplied permission ID, login failures use HTTP 500, CORS allows every origin, the access-token lifetime is hard-coded, order creation does not decrement stock, and delivery data is not stored.

## Scope

### Included

- Member registration, login, session restoration, logout, and expired-session handling.
- A server-side Next.js BFF that owns the browser session through an HttpOnly cookie.
- A protected member order-history page.
- Login-required checkout while preserving guest browsing and cart use.
- Immutable delivery and order-line snapshots.
- Administrator bootstrap through a backend command, never through public registration.
- A protected admin dashboard for product, category, and order management.
- Product create, update, and soft-delete APIs, including price, stock, category, badge, and image URL.
- Existing category writes hardened with validation and conflict handling.
- Admin order list, filtering, details, and controlled status transitions.
- Atomic stock validation, decrement, and cancellation restoration.
- English-default UI with the existing Thai language and theme behavior.
- Production-mode configuration, CORS tightening, error normalization, dependency remediation, and end-to-end verification.

### Excluded

- Online payments, refunds, invoices, shipping-carrier integration, or delivery-price calculation.
- Password reset, email verification, multi-factor authentication, social login, and refresh tokens.
- Customer profile editing or address-book management.
- Admin user management, analytics, promotions, coupons, reviews, and ratings.
- Product image upload, resizing, or Cloudinary/S3 integration.
- Hard deletion of catalog or order history.

## Architecture

The browser communicates only with same-origin Next.js route handlers under `/api`. These route handlers form a Backend-for-Frontend (BFF). The BFF calls the Go API using a server-only `BACKEND_API_URL`; the browser never receives the Go JWT or needs the backend origin.

Public catalog requests also pass through the BFF. Development and test environments may explicitly enable fixture catalog data. Production must not silently replace an unavailable API with fixtures; it returns a truthful unavailable state instead.

Authenticated BFF handlers read the session cookie, attach `Authorization: Bearer <token>` to Go requests, and normalize the Go response before returning it. The Go middleware remains the authoritative authorization boundary. Client-side role checks control navigation and presentation only.

The two repositories retain separate responsibilities:

- `Storefront`: forms, session-aware UI, route handlers, BFF transport, localization, and browser tests.
- `project_intern1`: credentials, JWT issuance and validation, RBAC, catalog/order business rules, transactions, migrations, and database access.

## Authentication and Session Security

### Browser-facing BFF routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`

Login sends credentials from the browser to the same-origin BFF. The BFF forwards them to Go and stores the returned access token in a cookie named `gadget_arena_session` with `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure` in production. Cookie expiry matches the JWT expiry. JavaScript never reads or writes the token.

Logout clears the cookie even if the backend is unavailable. A missing, invalid, or expired session returns HTTP 401; the UI clears its session state and redirects protected flows to `/login`. A validated relative `returnTo` value returns a member to checkout after login. Absolute or protocol-relative return targets are rejected.

The Go API adds `GET /api/v1/me`, protected by JWT middleware, returning only the current member's public session fields: member ID, username, first name, permission ID, permission name, and profile image when present.

Public registration accepts username, password, first name, last name, email, phone, and birth date. The server-owned DTO does not accept `permission_id`, audit fields, or timestamps and always creates permission ID 2. Duplicate username or email returns HTTP 409. Invalid credentials return one generic HTTP 401 response rather than revealing whether the username exists. Malformed requests return 400 and unexpected failures return 500 without database details.

The hard-coded token lifetime is replaced by a required production setting and a safe development default of two hours. This MVP has no refresh token; expiry requires a new login. Login attempts are throttled, return 429 when limited, and never log passwords or tokens. State-changing BFF routes validate the request origin in addition to `SameSite` cookie protection.

### Administrator bootstrap

Add an idempotent backend command for creating or promoting the first administrator. It requires explicit administrator profile input and reads the password from a process-local secret value, hashes it through the same production password path, refuses empty/default credentials, and never prints the password or JWT. No administrator credentials are committed or inserted automatically by normal migrations or development seeds.

## Customer Experience

Guests can browse products, change language/theme, and manage the local cart. Login is required only when submitting an order. If a guest starts checkout, the cart and validated delivery fields remain available while the login flow completes.

Member pages:

- `/login`: username and password with localized validation and generic credential errors.
- `/register`: the approved member fields, password confirmation, and localized validation.
- `/account/orders`: the signed-in member's orders, line items, totals, delivery snapshot, and current status.

The header shows Login when signed out and an account menu with order history and Logout when signed in. Administrators additionally see an Admin link. A member who visits `/admin` is redirected to the storefront with an access-denied message; an unauthenticated visitor is redirected to login.

Checkout sends a real order request only after a valid member session exists. It clearly states that no online payment or delivery fee is collected. A successful backend order clears the cart. Validation, stock conflict, expired session, and server-unavailable states keep the cart and form data so the customer can correct or retry.

## Admin Experience

The `/admin` shell uses the existing Gadget Arena visual system, theme, and English-default/Thai i18n. It provides responsive navigation for Products, Categories, and Orders.

### Products

The product screen provides a searchable table and create/edit forms for:

- product name and unique slug;
- description and brand;
- active category;
- non-negative THB price;
- non-negative integer stock quantity;
- optional HTTP/HTTPS image URL;
- optional badge.

Create and update use backend validation. Delete is a confirmed soft delete, removing the product from the public catalog while preserving historical order references. Product IDs are never editable.

### Categories

The category screen lists active categories and supports create, rename/description edit, and confirmed soft deletion. A category with active products returns HTTP 409 and remains unchanged.

### Orders

The order screen supports pagination, order-code search, member/status filters, and a detail view containing line snapshots, totals, delivery data, and current status. Allowed transitions are:

- `Pending -> Processing` or `Cancelled`
- `Processing -> Completed` or `Cancelled`
- `Completed` and `Cancelled` are terminal

Cancelling a non-terminal order restores inventory exactly once in the same transaction as the status change. The Admin UI displays only transitions allowed from the current status, while the backend independently enforces the state machine.

## Backend APIs

The existing response envelope remains, but handlers use correct HTTP status codes and stable machine-readable error codes. Required routes are:

### Authentication and member

- `POST /api/v1/register`
- `POST /api/v1/login`
- `GET /api/v1/me`
- `POST /api/v1/orders`
- `GET /api/v1/orders`

### Administrator

- `POST /api/v1/admin/products`
- `PUT /api/v1/admin/products/:id`
- `DELETE /api/v1/admin/products/:id`
- `POST /api/v1/admin/categories`
- `PUT /api/v1/admin/categories/:id`
- `DELETE /api/v1/admin/categories/:id`
- `GET /api/v1/admin/orders`
- `GET /api/v1/admin/orders/:id`
- `PATCH /api/v1/admin/orders/:id/status`

List endpoints use bounded pagination. Positive integer IDs, normalized strings, price, stock, URL scheme, allowed status, and request bodies are validated before repository access. Authorization failures return 401 for no valid session and 403 for a valid user lacking the required role.

## Order Data and Transactions

Create a one-to-one `order_delivery_snapshots` table containing order ID, email, first name, last name, phone, street address, city/district, province, and postal code. These fields belong to the order and do not change if the member later edits an account.

Order lines retain the product ID and snapshot product name, unit price, and quantity. Historical names and prices therefore remain stable after product edits or soft deletion.

The member order request has this conceptual shape:

```json
{
  "items": [{ "product_id": 1, "amount": 2 }],
  "delivery": {
    "email": "buyer@example.com",
    "first_name": "Buyer",
    "last_name": "Example",
    "phone": "0812345678",
    "address": "1 Example Road",
    "city": "Bangkok",
    "province": "Bangkok",
    "postal_code": "10110"
  }
}
```

Order creation runs in one database transaction. It validates the member and request, locks or conditionally updates every active product row, rejects insufficient stock with HTTP 409, snapshots server-owned product names and prices, decrements stock, inserts delivery data, calculates totals from database prices, and commits. Any failure rolls back the complete operation. Duplicate product IDs are normalized into one quantity before stock validation.

Order codes derive from the inserted database ID or another database-enforced unique value rather than reading the previous order, preventing concurrent collisions. The backend never accepts client totals, prices, member IDs, status, or audit fields.

## Configuration and Deployment

Storefront server configuration:

- `BACKEND_API_URL`: Go API base URL, server-only and required in production.
- `NEXT_PUBLIC_SITE_URL`: canonical public Storefront URL.
- `CATALOG_DATA_MODE`: explicit `api` in production; fixtures are limited to development/test.

Backend production configuration includes database credentials, server port, allowed frontend/server origins where CORS is retained, JWT private/public keys, and access-token lifetime. Secrets are injected by the hosting platform and never stored in Git, browser variables, images, or logs. Development key generation and Docker MySQL remain local-only.

Because browser requests are same-origin to the BFF, production Go CORS must not use `*`. The deployment exposes HTTPS, checks `/health`, records structured server errors without credentials or tokens, and provides a rollback path for every schema migration.

Production browser source maps are disabled unless a private error-reporting upload process is configured. Known production dependency vulnerabilities must be resolved before release.

## Error Handling

- Form errors are localized and associated with their fields.
- Authentication failures use a generic message and preserve only non-password form fields.
- HTTP 401 clears the local session view and sends protected flows to login.
- HTTP 403 shows access denied without pretending the user is signed out.
- HTTP 409 reports duplicate accounts, category-in-use, invalid transition, or insufficient stock with stable error codes.
- API/network failures preserve cart and form state and offer retry.
- Production catalog failure shows a truthful unavailable state; it never displays fixtures as real inventory.
- Raw SQL, stack traces, JWT material, credentials, and internal hostnames never reach browser responses.

## Testing

Implementation follows red-green-refactor.

Backend tests cover registration role enforcement, password handling, generic login errors, JWT expiry, `/me`, RBAC, admin bootstrap behavior, Product/Category validation and conflicts, order payload validation, concurrent stock protection, rollback, snapshots, totals, unique codes, status transitions, and one-time stock restoration. Repository transaction behavior is tested against the Docker MySQL schema where mocks cannot prove locking or rollback semantics.

Storefront tests cover the BFF cookie contract, origin checks, API error mapping, session restoration, Login/Register/Logout, safe `returnTo`, protected navigation, cart preservation, authenticated checkout, member order history, product/category forms, order filters/details/status changes, EN/TH messages, and responsive accessible states.

Playwright end-to-end tests use the real Go API and Docker MySQL for these flows:

1. Register member -> login -> preserve cart -> place order -> view order history.
2. Login as Admin -> create category/product -> edit price and stock -> confirm public catalog update.
3. Admin views the member order -> advances status -> member sees the new status.
4. Expired/invalid session -> protected action returns to login without losing the cart.
5. Insufficient stock or concurrent submission -> no partial order and no negative stock.

Required release checks:

```text
Storefront: npm test
Storefront: npm run type-check
Storefront: npm run build
Storefront: Playwright full-stack E2E
Backend:    go test ./...
Backend:    go vet ./...
Backend:    migration up/down verification on disposable MySQL
Frontend:   npm audit --omit=dev reports no high or critical vulnerability
```

## Acceptance Criteria

- A visitor can register only as a Member, log in, restore a valid session, and log out without JavaScript access to the JWT.
- Guest browsing and cart use remain available; checkout submission requires login and returns the customer to the preserved flow.
- A successful order atomically stores delivery/line snapshots, server-calculated totals, and stock changes.
- Members can view only their own order history.
- Only administrators can access product/category/order management APIs and UI.
- Admin product changes drive the public catalog, and image URLs render through the existing image policy.
- Admin order transitions follow the approved state machine and cancellation restores stock once.
- Production never falls back to demo inventory, exposes secrets, or accepts client-owned roles/prices/member IDs/audit fields.
- Both repositories pass unit, type, build, integration, migration, security-audit, and full-stack end-to-end checks before either `main` branch is changed.
- Implementation changes are committed to and reviewed from each repository's `test` branch before merge.
