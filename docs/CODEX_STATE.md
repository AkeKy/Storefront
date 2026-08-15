# Current Objective

Build a credible portfolio storefront for gaming and IT gear under the final customer-facing brand **Gadget Arena**. The current delivery is a functional bilingual frontend with typed catalog browsing, local cart, and a truthful demo-first checkout. A later phase may connect public product data and authenticated orders to the Go backend in the separate `project_intern1` repository.

## Current Project State

- **CONFIRMED:** Active checkout is the linked worktree on branch `test`; main remains at the original baseline.
- **CONFIRMED:** GitHub repository was renamed to `AkeKy/Storefront` and local `origin` points there.
- **CONFIRMED:** Gadget Arena is the final customer-facing brand. The site is dark by default, with a working light preference.
- **CONFIRMED:** Catalog browsing is local-fixture backed. There is no database or product-list API wired into this repository.
- **CONFIRMED:** The Go backend is in the separate Git repository named `project_intern1`; its source is not present in this checkout.

## Completed Work

- Typed catalog boundary, six fixture products, category/search/brand/stock/sort filtering, and loading/error/empty states.
- Product-grid and sidebar catalog layout, Thai-baht pricing, stock-aware add-to-cart controls, and image fallback.
- Persistent local cart with stock clamping and malformed-storage rejection.
- Checkout delivery validation, demo preview, guarded live Go order adapter, retry/error handling, subtotal-only totals, and duplicate-submit prevention.
- Theme provider with dark default and stored light preference; token-based dark/light styling.
- Gadget Arena visual restoration while retaining the working catalog/cart/checkout systems.
- Vitest configuration and focused test coverage for the systems above.
- Frontend i18n through `LanguageProvider`: English default, explicit `gadget-arena-locale` browser preference, and Thai UI/category/badge/stock copy while brand and model names stay canonical.

## Work In Progress

No product feature is currently being implemented. This context-recovery task is creating durable handoff documents only.

## Remaining Work

1. Plan a compatibility-safe update for legacy `byteforge-*` browser keys/package/README where it should align with Gadget Arena; repository name Storefront is intentionally separate.
2. Finish any desired frontend polish; review active UI rather than legacy unused components.
3. Before backend integration, inspect `project_intern1` and define the public product/category response contract and product-detail requirements.
4. Implement the missing Go backend public product endpoints in `project_intern1`, then replace the catalog adapter without changing UI consumers.
5. Define customer authentication/order/payment policy before exposing live order submission to public users.

## Known Bugs / Problems

- **CONFIRMED:** `git status` reports `Header.tsx`, `AppLogo.tsx`, and `ThemeContext.tsx` modified, while `git diff --raw` produced no content diff and the index/working blob IDs matched. Treat this as a likely racy-index/stat issue after formatting/moving, not as confirmed source edits. Refresh the index and inspect a real diff before staging.
- **CONFIRMED:** `AppIcon.tsx` and `AppImage.tsx` still use broad `any` props. Existing build-warning design also identifies missing image-alt/static typing warnings and an `outputFileTracingRoot` workspace-root warning as cleanup work. Do not claim a warning-free build until re-run.
- **CONFIRMED:** README and package name still say ByteForge even though visible product identity is Gadget Arena and repository is Storefront.
- **CONFIRMED:** Legacy unused home components contain fake ratings, testimonials, US-dollar prices, or shipping claims. They are not imported by the active home page.
- **CONFIRMED:** On 2026-08-15, `pnpm test` passed 34 tests, `pnpm type-check` passed, and `pnpm build` passed. The build still emits the pre-existing AppIcon/AppImage lint warnings and a multiple-lockfile workspace-root warning.
- **UNKNOWN:** Current `project_intern1` runtime availability, complete request schema beyond the documented order payload, and auth lifecycle cannot be verified from this repository.

## Important Constraints

- Keep catalog UI behind `CatalogService`; no direct fixture dependence in components.
- Keep catalog fixture-backed until public product endpoints exist; do not fabricate backend behavior.
- Keep UI language state frontend-only through `LanguageProvider`; `gadget-arena-locale` defaults to English and must not alter routes, catalog request data, cart storage, or order payloads.
- Preserve demo-first checkout and do not add public token entry/payment controls without explicit approval.
- Preserve Thai baht, factual availability, accessible controls/states, and the global dark-default theme model.
- Do not reintroduce fake reviews/ratings/social proof/payment or shipping claims/dead links.
- Read `AGENTS.md`, this state file, `ARCHITECTURE.md`, and relevant `DECISIONS.md` entries after a compaction; then verify against source and Git status.

## Important Decisions

See `docs/DECISIONS.md`. The continuation-critical decisions are: typed fixture adapter, demo-first order adapter, local defensive cart, Gadget Arena dark visual default, and factual-only content.

## Relevant Files

- `AGENTS.md` — durable project rules and continuation workflow.
- `docs/ARCHITECTURE.md` — actual module/data-flow map.
- `docs/DECISIONS.md` — recovered decisions and evidence.
- `src/features/catalog/` — current catalog types, fixtures, and adapter boundary.
- `src/features/cart/CartContext.tsx` — cart state and persistence contract.
- `src/features/orders/order-service.ts` — only backend request boundary.
- `src/app/products/components/ProductsContent.tsx` — catalog filter/request owner.
- `src/app/checkout/components/CheckoutContent.tsx` — customer checkout behavior.
- `src/context/ThemeContext.tsx` and `src/styles/tailwind.css` — theme contract.
- `src/app/page.tsx`, `HomeCatalog.tsx`, `Header.tsx`, `Footer.tsx` — active visible shell.
- `docs/superpowers/specs/` — historical approved designs; cross-check against current code because older ByteForge documents have been superseded.

## Failed / Rejected Approaches

- **CONFIRMED:** Earlier light-first ByteForge UI was superseded by Gadget Arena restoration. Do not switch default theme or page-specific theme behavior without a new decision.
- **CONFIRMED:** Direct catalog-to-backend integration was intentionally deferred because the required public product list/detail endpoints are not present in recoverable evidence.
- **CONFIRMED:** Fake catalog/review/social-proof/payment content was intentionally removed from active flows; unused legacy components must not be used as a shortcut.
- **CONFIRMED:** Moving the nested Windows worktree without dependency recreation broke absolute pnpm junctions. Do not repeat that move procedure while relying on its existing `node_modules`.

## Unresolved Questions

- **UNKNOWN:** Which public product/category/detail endpoints and response schemas should be added to `project_intern1`?
- **UNKNOWN:** Whether remote image assets may be retained for a portfolio deployment, or must be licensed/localized.
- **UNKNOWN:** Whether live checkout will ever include a customer account system and payment provider; current code must remain demo-first until decided.

## Next Steps

1. Run the dependency-recovery command above from the active worktree.
2. Run `pnpm test`, `pnpm type-check`, and `pnpm build`; record actual results before claiming release readiness.
3. Review the active `/`, `/products`, and `/checkout` flows and choose the next user-facing improvement.
4. When ready for backend work, inspect `project_intern1` and create a written API contract before changing `CatalogService`.
