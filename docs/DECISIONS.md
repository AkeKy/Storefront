# Recovered decisions

Status labels distinguish direct evidence from recovered context. A decision should be revised only with a deliberate implementation and corresponding tests.

## Fixture-backed catalog

- **Status:** CONFIRMED
- **Decision:** Product browsing goes through `CatalogService`, whose current implementation uses typed local fixtures.
- **Rationale:** Existing project documentation and `README.md` state that the Go backend lacks public product-list and product-detail endpoints. The code contains no alternate catalog API adapter.
- **Alternatives known:** Direct fixture access in UI components; direct backend calls before product endpoints exist.
- **Consequences:** Search, filters, stock state, and pricing work offline from fixed data. When real public product endpoints exist, replace the service adapter while preserving the types/UI boundary.
- **Evidence:** `src/features/catalog/types.ts`, `catalog-service.ts`, `catalog-fixtures.ts`, `README.md`.

## Demo-first checkout with guarded live order adapter

- **Status:** CONFIRMED
- **Decision:** Checkout has no customer payment flow and does not submit an order unless a developer has configured both API URL and an existing browser token.
- **Rationale:** This prevents a UI preview from falsely claiming a payment or backend order. The current repository has no customer authentication UI or payment policy.
- **Alternatives known:** Always post orders; let customers paste a token; add card/PayPal/crypto controls. These are not implemented.
- **Consequences:** Public checkout returns a preview and preserves the cart. A configured developer session submits the exact `product_id`/`amount` payload and clears the cart only after success.
- **Evidence:** `src/features/orders/order-service.ts`, `src/app/checkout/components/CheckoutContent.tsx`, associated tests.

## Client-side persisted cart with defensive hydration

- **Status:** CONFIRMED
- **Decision:** Cart state stays in React context and `localStorage`, with validation before persisted data enters the app.
- **Rationale:** The current delivery has no customer account/cart API. Malformed persisted values must not reach the configured order request.
- **Alternatives known:** Server cart/database persistence. No implementation exists in this repository.
- **Consequences:** Cart survives browser reloads on the same browser but is not shared across devices. The persisted storage key remains `byteforge-cart` for compatibility.
- **Evidence:** `src/features/cart/CartContext.tsx`, `cart.test.ts`, `order-service.test.ts`.

## Gadget Arena is the final customer-facing identity; dark is the default

- **Status:** CONFIRMED
- **Decision:** The visible storefront uses the final Gadget Arena identity and restored dark/neon visual treatment, with an accessible light-mode toggle.
- **Rationale:** Git history records the restoration commits and current layout/header/footer/style code uses Gadget Arena. The user explicitly confirmed Gadget Arena as the final brand on 2026-08-15. The current product-catalog design explicitly requires the global dark default rather than a page-specific mode.
- **Alternatives known:** An earlier ByteForge light-first treatment was implemented, then superseded by the restoration commits. Do not revive it casually.
- **Consequences:** Theme must be controlled only through the global provider/tokens. Existing saved `byteforge-theme` data is still read for compatibility.
- **Evidence:** `df700f0`, `e220872`, `src/context/ThemeContext.tsx`, `src/styles/tailwind.css`, catalog-layout spec.

## Factual storefront content only

- **Status:** CONFIRMED
- **Decision:** Active pages must not present reviews, ratings, social-proof counts, crossed-out prices, payment claims, invented shipping promises, or dead links.
- **Rationale:** The user-facing design/plan and current active components deliberately removed unsupported claims.
- **Alternatives known:** Legacy components still contain fabricated claims but are not imported by the active home page.
- **Consequences:** Do not reactivate those components without replacing their content and connecting their behavior to real data.
- **Evidence:** Gadget Arena restoration spec, `src/app/page.tsx`, `HomeCatalog.tsx`, `FeaturedProducts.tsx`, `StatsSection.tsx`, `TestimonialsSection.tsx`, `CTABanner.tsx`.

## Remote images stay external for now, with a local fallback

- **Status:** CONFIRMED
- **Decision:** Current fixture and category images use approved remote host patterns; `AppImage` falls back locally if a request fails.
- **Rationale:** The restoration design explicitly treated localizing/licensing assets as a separate task.
- **Alternatives known:** Bundling images locally. No complete asset set or licensing decision is recoverable.
- **Consequences:** Perceived image load time depends on external hosts. Image fallback behavior must remain covered.
- **Evidence:** `image-hosts.config.mjs`, `AppImage.tsx`, `ProductCard.test.tsx`, Gadget Arena restoration spec.

## Repository name and technical names remain distinct from the final brand

- **Status:** CONFIRMED
- **Decision:** GitHub repository is `AkeKy/Storefront`; the final UI identity is Gadget Arena; internal ByteForge names remain pending a compatibility-safe migration.
- **Rationale:** The repository rename and branch/worktree rename occurred after the implementation history. The user confirmed Gadget Arena as the final brand on 2026-08-15. No code-level technical-name migration has been approved or completed.
- **Alternatives known:** Rename every technical key and all prose. The required local-storage compatibility approach remains UNKNOWN.
- **Consequences:** Do not make broad naming substitutions. Any migration must preserve or intentionally migrate existing browser data and update tests.
- **Evidence:** User confirmation (2026-08-15), current Git remote/configuration, `package.json`, README, layout/header/footer, storage keys.
- **Evidence:** Current Git remote/configuration, `package.json`, README, layout/header/footer, storage keys.
