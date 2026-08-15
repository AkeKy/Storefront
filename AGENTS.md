# Storefront working rules

## Source of truth

- Treat the repository and tests as more authoritative than plans, README text, or this file.
- The active customer-facing identity is **Gadget Arena**. The repository is named **Storefront**. Several technical names still contain `byteforge`; do not rename those keys, package fields, or copy incidentally. A deliberate migration must preserve browser data and update tests.
- The current product catalog is fixture-backed. Do not invent API responses, product endpoints, payment behavior, stock claims, ratings, reviews, discounts, shipping promises, or customer statistics.

## Architecture boundaries

- Keep product UI dependent on the `CatalogService` interface in `src/features/catalog/types.ts`, not on fixture arrays directly.
- Keep cart state client-side through `CartProvider`; preserve its stock clamping and persisted-data sanitization.
- Checkout is demo-first. `createOrder` may call `POST /api/v1/orders` only when both `NEXT_PUBLIC_API_URL` and an existing browser token are present. Never add a customer token-entry field or payment collection without an approved product decision.
- Use global CSS token classes and the existing `ThemeProvider`. The default is dark; light is an opt-in stored preference.

## UI and content constraints

- Preserve the Gadget Arena dark visual direction unless a user explicitly asks to change it. Do not set a route-specific theme class.
- All money shown to customers uses Thai baht. Show factual stock state and keep zero-stock add controls disabled.
- Keep semantic labels, keyboard focus behavior, loading/error/empty states, and accessible cart buttons intact.
- Do not reactivate the legacy `FeaturedProducts`, `StatsSection`, `TestimonialsSection`, or `CTABanner` components without replacing their unsupported claims and disconnected mock state.

## Development workflow

- Package manager: pnpm. Main commands: `pnpm test`, `pnpm type-check`, and `pnpm build`.
- Add or update focused Vitest coverage before changing behavior. Run the narrowest relevant test first, then the full checks before publishing or merging.
- If working from the linked worktree nested under `.worktrees`, do not move it while its dev server is running. On Windows, moving it invalidates pnpm's absolute junctions; recreate its dependencies with `pnpm install --ignore-workspace --force` from that worktree.
- Before major context compaction or handoff, update `docs/CODEX_STATE.md`. On a fresh session, read this file, `docs/ARCHITECTURE.md`, relevant entries in `docs/DECISIONS.md`, then inspect Git status and relevant source.
