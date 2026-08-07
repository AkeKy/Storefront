# ByteForge storefront design

## Goal

Turn the existing `shopping-frontend` mock storefront into a credible full-stack portfolio project for a computer and gaming-gadget shop. The first delivery focuses on a polished customer storefront that can integrate with the existing Go backend.

## Product and visual direction

- Brand: ByteForge, a computer and gaming-gadget shop.
- Default theme: light base with off-white and pale-gray surfaces, charcoal text, and a restrained electric-lime accent for primary actions, price emphasis, and status.
- Preserve the current gaming identity, but remove visual effects that make the product feel like a generic mockup: atmospheric blobs, scanlines, persistent neon borders, inflated social proof, and crypto payment messaging.
- Use practical product copy, Thai baht pricing, consistent product imagery, and realistic stock and order states.
- Light mode is the default. Keep a fully functional dark-mode preference for shoppers who choose it.

## First-delivery pages

### Home

- Show category entry points, selected products, and concise delivery and return information.
- Remove fabricated customer counts, testimonials, and promotional claims that cannot be supported.

### Products

- Support search, category filter, brand filter, sort order, product availability, and clear stock status.
- Include loading, empty-result, and API-error states.

### Checkout

- Keep a focused flow: contact and delivery details, payment selection, review, and order result.
- Support cart quantity changes, field validation, order success, and submission failure.
- Do not implement a payment gateway in this delivery.

## Architecture and data flow

- Keep Next.js App Router and Tailwind CSS.
- Organize additions under reusable `components`, feature-focused modules, `services/api`, and shared TypeScript `types`.
- Product and category views read through an adapter. Until the backend exposes product-list endpoints, the adapter provides typed local mock data so UI components do not need to change when real API calls replace it.
- Login obtains a session token; authenticated calls attach the token to requests.
- Cart state remains client-side for this delivery and creates an order on checkout.
- API failures display an actionable message and a retry action.

## Backend alignment

The current Go backend exposes authentication, category, order, member, and admin-order routes. It does not expose a product listing or product-detail route, so product browsing cannot use real backend data until those endpoints are added.

## Quality bar

- Verify layouts at mobile, tablet, and desktop widths.
- Provide visible keyboard focus states and semantic form controls.
- Validate checkout fields before submission.
- Run TypeScript type-checking and a production build before handoff.

## Out of scope

- Payment-gateway integration.
- Reviews and ratings.
- Admin dashboard.
