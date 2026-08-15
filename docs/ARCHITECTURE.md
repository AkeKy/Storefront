# Current architecture

## System overview

This repository contains a Next.js 15 / React 19 customer storefront. It renders three App Router pages: home (`/`), product catalog (`/products`), and checkout (`/checkout`). The app currently has no database and no backend source code in this repository.

The visible product is a Gadget Arena storefront. The GitHub repository is `AkeKy/Storefront`; some package, storage-key, and documentation text remain from an earlier ByteForge iteration.

## Application shell and styling

- `src/app/layout.tsx` loads DM Sans, global CSS, `ThemeProvider`, and `CartProvider`; it also owns metadata.
- `src/components/Header.tsx` provides navigation, theme toggle, cart count, and mobile menu. `Footer.tsx` provides only real internal links.
- `src/styles/tailwind.css` defines all light/dark CSS tokens and shared utilities. Tailwind maps semantic utilities such as `bg-background` and `text-foreground` to those tokens.
- `src/context/ThemeContext.tsx` initializes dark, applies the `light` class only for light mode, and restores the saved `byteforge-theme` preference after hydration.
- `AppImage` wraps Next Image. External catalog images are deliberately rendered unoptimized and fall back to `/assets/images/no_image.png` on error.

## Catalog flow

`src/features/catalog/types.ts` defines the boundary:

- `Product`, `Category`, `CatalogFilter`, and `CatalogResult`
- `CatalogService.listProducts(filter)` and `CatalogService.listCategories()`

`catalog-service.ts` is the only current catalog adapter. It imports deterministic data from `catalog-fixtures.ts`, filters by query/category/brand/stock, and sorts by featured or price. It does not make network requests.

`ProductsContent` owns client-side filters and request state. It loads categories and an unfiltered brand list once, then asks `catalogService` for the active filter result. `ProductGrid` renders loading, error, empty, or cards. The `/products` page can supply an initial category through `?category=`.

`HomeCatalog` uses the same service and grid, requesting in-stock featured data and displaying at most four products. `CategoryShowcase` links to category query parameters.

## Cart and checkout flow

`CartProvider` owns `CartItem[]` state. It hydrates browser `localStorage` key `byteforge-cart`, rejects malformed entries, merges duplicate products, clamps quantities to stock, and persists only after hydration. It exposes item count and THB subtotal to the header and checkout.

`CheckoutContent` collects Thai delivery fields, validates them, lets the customer review a subtotal-only order, and prevents duplicate submission while a request is pending. It uses `createOrder(items, token)`:

1. If `NEXT_PUBLIC_API_URL` or `byteforge-token` is absent, it returns `{ mode: 'demo' }`; no request is made and the cart remains.
2. If both exist, it validates positive safe integer product IDs and quantities, then posts `{ product_id, amount }[]` to `${NEXT_PUBLIC_API_URL}/api/v1/orders` with a Bearer token.
3. A successful live submission clears the local cart. No payment gateway is implemented.

## Integrations and persistence

- Current catalog data: local TypeScript fixtures.
- Current cart/theme persistence: browser local storage only.
- Optional order integration: existing Go API endpoint, configured only by environment plus already-stored browser token.
- No authenticated customer login flow, database connection, payment processor, analytics integration, Supabase client, Stripe client, or public product API is implemented in `src`.

## Quality tooling

- TypeScript uses strict checking with the `@/*` alias.
- Vitest runs in jsdom with Testing Library; `src/test/setup.ts` replaces `next/image` with a standard image mock.
- The focused suite covers catalog filters, card behavior and fallback image, cart mutation/sanitization, theme preference, checkout validation/submission safeguards, home catalog, footer links, and order request construction.
