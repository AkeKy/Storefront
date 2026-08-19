# Gadget Arena Catalog API Integration Design

**Date:** 2026-08-20
**Status:** Pending written-spec review
**Repositories:** `Storefront` branch `test`, `project_intern1` branch `test`

## Goal

Connect the Gadget Arena Storefront catalog to the public Go catalog API while preserving the current UI, cart behavior, English-default i18n, and a fully usable fixture-backed demo when the API is unavailable.

## Current State

The Storefront exposes catalog data through a typed `CatalogService`, but its implementation reads local fixtures. The Go backend now provides public read-only routes for health, categories, product lists, and product details. The browser may call these routes without a bearer token, and local CORS currently permits the Storefront origin.

The two sides deliberately use different data shapes. The Go API returns snake-case transport DTOs and numeric category IDs; the Storefront uses camel-case view models and stable string category keys. An adapter must own that translation rather than coupling UI components to backend response fields.

## Scope

### Included

- Retain the existing `CatalogService` boundary used by the home and products pages.
- Extract the existing fixture behavior into a dedicated fixture adapter.
- Add a browser-side Go API adapter selected by `NEXT_PUBLIC_API_URL`.
- Automatically use fixture data when the API URL is absent or an API catalog request fails.
- Translate filters and response DTOs between Storefront and Go naming conventions.
- Preserve category filtering across API and fixture modes with canonical category keys.
- Remove the unsupported `Best rated` and `Most reviews` sort choices.
- Document local full-stack startup and environment configuration.
- Verify the integration with unit tests, frontend checks, backend checks, and a live local Docker smoke test.
- Push only the `test` branch in each repository; do not merge either `main` branch and do not open a pull request.

### Excluded

- Product-detail UI, authentication UI, live checkout authentication, payments, reviews, or ratings.
- New backend endpoints or changes to the approved Phase 1 catalog contract.
- Pagination controls. This iteration requests at most 100 items, matching the backend limit and the current small portfolio catalog.
- Production deployment and production CORS hardening.

## Architecture

The Storefront keeps one exported `catalogService` facade. Internally it composes two implementations:

1. `fixtureCatalogService` contains the current deterministic in-memory filtering and sorting.
2. `apiCatalogService` calls the Go API and maps its transport DTOs into Storefront domain models.
3. The exported resilient facade chooses fixtures immediately when `NEXT_PUBLIC_API_URL` is empty. When it is configured, the facade tries the API first and catches network failures, non-2xx responses, and invalid response envelopes. A failed operation is repeated against the fixture adapter with the same filter.

Fallback is intentionally not shown as an error in the customer UI. The application emits exactly `Catalog API unavailable; using demo data.` as a developer-console warning without including raw errors or backend details. Existing error and retry UI remains available only if both configured sources fail unexpectedly.

No credentials, cookies, or authorization headers are sent for public catalog requests.

## Data Flow

### Categories

`GET /api/v1/categories` returns an envelope whose `data` items contain `category_id`, `category_name`, and `description`. The API adapter maps each item to `{ id, name }`.

The frontend `id` is a canonical key derived from `category_name`: Unicode-normalize with NFKD, trim, lowercase, convert runs of characters other than Unicode letters or numbers to `-`, and trim surrounding hyphens. For example, `Keyboards` becomes `keyboards` and `Mouse` becomes `mouse`. The adapter caches both the in-flight category request and its resolved key-to-numeric-ID map so concurrent consumers share one lookup. The map translates a later category filter back to the backend `category_id` parameter. Product DTOs use the same canonical key derived from their nested category name.

Fixture categories already use these canonical keys. This keeps category selection meaningful if one request succeeds against the API and a later request falls back to fixtures.

### Products

`GET /api/v1/products` receives these translated parameters:

| Storefront | Go API |
| --- | --- |
| `query` | `q` |
| canonical `categoryId` | cached numeric `category_id` |
| `brand` | `brand` |
| `maxPrice` | `max_price` |
| `inStockOnly: true` | `in_stock=true` |
| `featured` | `sort=featured` |
| `price-asc` | `sort=price_asc` |
| `price-desc` | `sort=price_desc` |

Every list request also sends `page=1&limit=100`. False or absent stock filters are omitted so they retain the backend's documented no-restriction behavior.

The API response maps as follows:

| Go DTO | Storefront model |
| --- | --- |
| `product_id` | `id` |
| `slug` | `slug` |
| `product_name` | `name` |
| `brand` | `brand` |
| nested `category.category_name` | `categoryName` and canonical `categoryId` |
| `price` | `priceTHB` |
| `stock_quantity` | `stockQuantity` |
| `image_url` | `image` |
| `badge` | `badge` |

Missing or blank `image_url` uses `/assets/images/no_image.png`. `imageAlt` uses the factual product name. Badge text remains optional and may pass through as backend-provided display text; i18n continues translating known badge values and falls back to the source value for unknown ones.

The adapter validates the response envelope and the fields required to render each product. A valid category requires a positive safe-integer ID and a non-empty name. A valid product requires a positive safe-integer ID; non-empty slug, product name, brand, and nested category name; finite non-negative price; and a non-negative safe-integer stock quantity. Optional image and badge values must be strings when present. Invalid payloads are failures and therefore activate fixture fallback rather than placing malformed products into the cart.

### Brand Options

The existing products page derives brand choices from an unfiltered `listProducts()` call. Because the adapter requests the backend maximum of 100 products, this remains complete for the current six-item portfolio catalog. A dedicated facets/brands endpoint is deferred until the catalog can exceed 100 items.

## UI and i18n

The visual catalog layout, theme behavior, cart controls, and English-default language behavior do not change. Product and brand names remain backend content and are not translated. Category labels continue using the canonical key for known English/Thai translations and fall back to the backend category name.

`Best rated` and `Most reviews` are removed from the sort type and selector because neither data source has factual rating or review information. Supported sort choices remain Featured, Price low to high, and Price high to low.

## Configuration

Add a tracked `.env.example` containing:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:1323
```

The variable remains optional. Empty means fixture-only demo mode. A configured but unavailable API triggers automatic fixture fallback. The README must explain that `NEXT_PUBLIC_*` values are exposed to the browser and must never contain secrets.

Each API request has a 5-second timeout implemented with an `AbortController`. The adapter trims surrounding whitespace and trailing slashes from the configured base URL before appending `/api/v1/...`.

Local full-stack verification uses:

- Storefront: `npm install`, then `npm run dev` on port `4028`.
- Backend: Docker MySQL on `127.0.0.1:3307`, process-local `DATABASE_*` settings, generated development RSA keys, then `go run .` on port `1323`.

The backend must always be started with the documented local database variables so an ignored legacy `config/config.yml` cannot select `shopping_dev`.

## Error Handling

- Missing API URL: use fixtures without making a network request.
- Network rejection or timeout: warn in the developer console and use fixtures.
- Non-2xx API response: treat it as a failure and use fixtures.
- Invalid JSON or malformed envelope/data: treat it as a failure and use fixtures.
- Unknown category key after a successful category lookup: do not call the product endpoint and return `{ products: [], total: 0 }`. If the required category lookup itself fails, treat the operation as an API failure and use fixtures.
- Missing product image: use the existing local placeholder.
- Never expose database errors, credentials, JWT keys, or backend configuration in UI messages or logs.

## Testing

Implementation follows red-green-refactor. Tests must prove:

- Environment absent selects fixtures without calling `fetch`.
- API filters produce the exact documented query parameter names and sort values.
- A valid category and product envelope maps into the existing Storefront model.
- Category canonicalization supports API filtering and i18n fallback behavior.
- Missing images use the local placeholder.
- Network, non-2xx, invalid JSON, and malformed DTO responses return fixture results.
- Unsupported review-based sort options are absent from the catalog UI.
- Existing home catalog, products page, cart, checkout, theme, and i18n tests remain green.

Required final checks:

```text
Storefront: npm test
Storefront: npm run type-check
Storefront: npm run build
Backend:    go test ./...
Backend:    go vet ./...
```

A live smoke test must start the Go API with the local Docker database, verify `/health`, `/api/v1/categories`, and a filtered `/api/v1/products` request, then run the Storefront with `NEXT_PUBLIC_API_URL=http://localhost:1323` and confirm real API products render. A second check with the API unavailable must confirm fixture fallback still renders products.

## Acceptance Criteria

- With a healthy configured backend, catalog requests and displayed products originate from the Go API.
- With no URL or an unavailable/malformed backend, the catalog remains usable with fixture data.
- Filters, supported sorts, category labels, stock state, images, and cart IDs remain correct in both modes.
- No review or rating claims are displayed.
- Both repositories pass their required checks.
- Only the two `test` branches are pushed; neither `main` branch is changed.
