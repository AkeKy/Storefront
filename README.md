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

The catalog currently uses local fixture data through a typed catalog-service boundary. This keeps the storefront functional without inventing an API that does not exist yet.

The Go backend lives in the separate `project_intern1` repository. Its public product-list and product-detail contract must be defined there before the storefront can replace its fixture catalog. Checkout only sends a live order when a developer has already configured an authenticated API session in that browser; normal use remains a preview and preserves the cart.

## Environment variables

| Variable | Needed for | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Production deployment | Canonical URL used by metadata, sitemap, and robots. |
| `NEXT_PUBLIC_API_URL` | Developer-configured live order submission | Base URL for the Go API. |

`NEXT_PUBLIC_API_URL` is optional. There is no public login, token-entry, or payment interface.

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
