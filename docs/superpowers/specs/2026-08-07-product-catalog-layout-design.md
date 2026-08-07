# Product catalog layout design

## Goal

Make the `/products` page use the clearer storefront layout in the supplied reference: a catalogue heading, search and sort controls at the top, a persistent desktop filter sidebar, and a three-column product grid.

## Theme

The page must use the existing global theme tokens. It must not add a page-specific theme class or change the current default. Dark remains the current default; switching the existing theme control to light restyles this page automatically.

## Layout

- Keep the existing dark Gadget Arena visual identity, typography, and product imagery.
- Use a two-column desktop layout: an accessible filter sidebar and the product grid.
- Keep search and sort above the layout. Move category, brand, stock-only, and reset controls into the sidebar.
- Preserve the current responsive behavior: filters stack before products on smaller screens and the grid adapts to the available width.

## Functional boundaries

- Preserve real catalogue filtering, retry/loading/empty states, stock labels, Thai-baht prices, and add-to-cart behavior.
- Do not restore rating counts, reviews, crossed-out sale prices, fabricated product counts, or other unsupported claims from the reference image.
- Keep product cards factual; the compact add-to-cart action can be visually restyled but remains labeled for assistive technology and disabled when out of stock.

## Verification

- Update the focused ProductsContent test only where its visible copy or control structure intentionally changes; retain search/filter coverage.
- Run type-check and the focused product tests, then ask the user to run the full test suite and production build in their local PowerShell environment.
