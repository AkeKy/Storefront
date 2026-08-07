# ByteForge Storefront

ByteForge is a Next.js storefront for gaming peripherals, PC components, monitors, and everyday IT gear. It provides a responsive customer shopping experience while keeping the catalog boundary ready for a Go API integration.

## Customer flows

- Browse the featured catalog on the home page.
- Search, filter by category or brand, and sort the full product catalog.
- Add in-stock products to a local cart, adjust quantities, and remove items.
- Enter delivery details and complete a clearly labelled preview at checkout.
- Keep the cart after a demo preview; a live API order is available only as an opt-in developer integration for a browser that already has an authenticated token configured.

No payment is collected by the storefront.

## Setup

Use pnpm with the repository's existing dependencies:

```bash
pnpm install --frozen-lockfile
pnpm dev
```

The development server runs at `http://localhost:4028`.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Production | Canonical site URL used by metadata, sitemap, and robots. |
| `NEXT_PUBLIC_API_URL` | To submit live orders | Base URL for the Go API. Checkout uses `POST /api/v1/orders`. |

`NEXT_PUBLIC_API_URL` is intentionally optional. Public visitors have no login or token-entry UI, so checkout is demo-first: it completes a preview, does not submit an order, and keeps the cart unchanged. The existing order adapter becomes live only when a developer has intentionally configured both this URL and a valid `byteforge-token` in that browser's local storage. A successful live submission clears the client cart to prevent a duplicate submission on return.

## Catalog fixture adapter

The UI consumes `catalogService` from `src/features/catalog/catalog-service.ts`. Its current adapter uses the local fixtures in `catalog-fixtures.ts`, including categories, product details, stock levels, search, filters, and sorting. This keeps browse and cart flows usable without inventing network responses and gives the application one replacement point when a public catalog API is available.

## Go API compatibility and current gap

The storefront is compatible with the existing Go backend's auth, category, order, member, and admin-order capabilities. Its opt-in developer order integration maps cart items to the backend order payload (`product_id` and `amount`) and sends an authenticated request to `/api/v1/orders`. It is not a public ordering flow until the product adds customer login/token handling and a real payment/order policy.

The current Go backend does **not** expose public product-list or product-detail endpoints. Therefore, the customer-facing catalog deliberately remains fixture-backed; switching it to the backend requires public product list/detail API endpoints and a mapping from their response schema to the storefront's `Product` type. The storefront does not add backend endpoints, a payment gateway, a review system, or an admin dashboard.

## Verification

Run all required checks before publishing changes:

```bash
pnpm test
pnpm type-check
pnpm build
```

Also check whitespace errors before committing:

```bash
git diff --check
```
