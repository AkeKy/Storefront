# Gadget Arena UI restoration design

## Goal

Restore the original Gadget Arena visual identity and product imagery while retaining the functional catalog, cart, checkout, theme preference, and automated tests added on the ByteForge branch.

## User experience

- Use the original dark Gadget Arena palette, logo treatment, navigation, hero composition, product-card visual language, and original product-image URLs from `main`.
- Rename user-facing ByteForge labels and metadata back to Gadget Arena.
- Keep the original visual sections where they improve browsing, but do not restore fabricated reviews, shopper counts, ratings, payment claims, or dead links.
- Keep dark mode as the original default and preserve the existing accessible theme toggle.

## System preservation

- Catalog product cards and product browsing use the existing typed fixture adapter, search, filters, sort, stock handling, and Thai baht formatting.
- Cart remains hydrated from browser local storage and the header count remains live.
- Checkout uses the existing validated, demo-first submission flow and optional Go order adapter. It must not return to inline fake cart items or card/PayPal/crypto UI.
- Existing external image URLs remain the visual source for now; the app image fallback still protects failed requests. Localizing assets is a separate asset-licensing task.

## Verification

- Existing behavior tests remain present and pass.
- Add or update focused assertions for Gadget Arena branding and an original catalog image URL.
- Run `pnpm type-check`, `pnpm test`, and `pnpm build`.
