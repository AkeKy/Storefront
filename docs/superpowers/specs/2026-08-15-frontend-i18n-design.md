# Frontend i18n design

## Goal

Let customers switch the Gadget Arena storefront between English and Thai without changing routes, calling a new backend endpoint, or translating product brands and model names. English is the default language.

## Scope

- Add a client-side `LanguageProvider` that exposes the active locale (`en` or `th`) and a locale switch action.
- Persist an explicit user selection in browser storage under `gadget-arena-locale`.
- When no stored selection exists, render English.
- Add an accessible `EN / TH` control in the header. It must work on both desktop and mobile layouts.
- Translate storefront-owned UI copy on the active home, products, checkout, header, footer, and catalog-status components.
- Translate fixture-backed category names and stock/status labels. Keep product brand and model strings canonical, for example `Keychron Q6 Max`.

## Architecture

Create a small i18n feature with two dictionaries: English and Thai. Components request a message by stable key through the provider rather than embedding new translated strings inline. The provider owns only locale state and persistence; it does not own catalog, cart, checkout, or theme state.

Locale is not represented in the URL. Existing routes, category query parameters, and shareable product links remain unchanged. This keeps the first frontend-only release small and avoids route rewrites. A later SEO-focused locale-route decision can be made independently.

The existing `CatalogService` contract stays unchanged. A presentation helper maps known category IDs and storefront stock states to translated labels. When the Go backend in `project_intern1` later provides localized descriptions or specifications, its adapter can add those fields without replacing the UI dictionary or `LanguageProvider`.

## Behavior

1. A first-time visitor sees English.
2. Choosing Thai immediately translates storefront UI and known category/status copy.
3. Refreshing retains the chosen locale on that browser.
4. Switching back to English persists English.
5. Product names, brands, prices, stock quantities, images, cart quantities, filters, and order payloads retain their current behavior.
6. The global dark-default theme and its existing light preference remain independent of locale selection.

## Accessibility and errors

- The locale control uses an accessible label that states the action.
- The active language is visually and programmatically identifiable.
- The provider safely falls back to English for an unknown message key or malformed stored locale, so no broken UI appears.
- Thai text uses the existing responsive layout and must not introduce horizontal scrolling at narrow widths.

## Verification

- Add focused tests for the default English locale, persisted Thai choice, and the header locale control.
- Update existing focused component tests only where visible text intentionally changes.
- Run the focused i18n and affected catalog/checkout tests, followed by type-check. Run the full test suite and production build after dependencies have been restored in the moved worktree.

## Out of scope

- Go backend, database schema, product API changes, and authentication changes.
- URL locale prefixes, locale-specific SEO metadata, browser-language auto-detection, and currency conversion.
- Translating canonical product brand/model names or inventing translated product specifications.
