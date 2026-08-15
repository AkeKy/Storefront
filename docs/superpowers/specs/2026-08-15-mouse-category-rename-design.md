# Mouse Category Rename Design

## Goal

Use `mouse` consistently for the gaming-mouse category throughout the Storefront codebase.

## Scope

- Rename the category identifier from `mice` to `mouse` in fixture data, component data, filters, and test data.
- Change customer-facing English category copy from `Mice` to `Mouse`.
- Preserve the existing Thai display label `เมาส์`.
- Update i18n keys and tests to use `mouse`.

## Constraints

- Keep catalog behavior fixture-backed and behind `CatalogService`.
- Do not change product names, prices, stock behavior, routes, cart storage, or checkout payloads.
- Do not alter the global dark-default theme model.

## Verification

- Focused catalog, product-grid, cart, checkout, and language-provider tests use the new category identifier.
- Type checking passes.
