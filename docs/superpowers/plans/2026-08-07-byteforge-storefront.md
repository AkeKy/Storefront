# ByteForge Storefront Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the existing GadgetArena mock UI into a light-first, credible ByteForge storefront with typed catalog data, usable cart and checkout behavior, and a clean path to the existing Go API.

**Architecture:** The application remains a Next.js App Router application. Catalog data lives behind a typed adapter: local fixtures provide product data now while the adapter can call the Go service once product endpoints exist. Cart state is a client-side context; checkout submits the existing order payload only when an API base URL and authenticated token are available, otherwise it exposes a clear demo-mode result.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 3, Vitest, React Testing Library.

## Global Constraints

- Default to the light theme: off-white and pale-gray surfaces, charcoal text, and restrained electric-lime actions and statuses.
- Keep product copy and interface labels practical; remove scanlines, floating blobs, unverified customer counts, testimonials, crypto payment, and US-centric pricing.
- Show Thai baht prices and only make claims the app can support.
- Keep product access behind a typed adapter until the Go backend has product-list and product-detail endpoints.
- Do not add payment-gateway integration, reviews, or an admin dashboard. Keep a fully functional user-controlled dark mode while light remains the default.
- Every form control needs a visible keyboard focus style and validation feedback.

---

## File structure

- `src/features/catalog/types.ts`: shared catalog, category, filter, and adapter contracts.
- `src/features/catalog/catalog-fixtures.ts`: deterministic Thai-baht product and category data used in demo mode.
- `src/features/catalog/catalog-service.ts`: typed catalog adapter with fixture and API-ready implementations.
- `src/features/catalog/catalog-service.test.ts`: unit tests for filtering and API payload mapping.
- `src/features/cart/CartContext.tsx`: cart state, localStorage persistence, and cart mutation actions.
- `src/features/cart/cart.test.ts`: reducer-level cart behavior tests.
- `src/features/orders/order-service.ts`: request builder for `POST /api/v1/orders`.
- `src/features/orders/order-service.test.ts`: request and error-mapping tests.
- `src/components/catalog/ProductCard.tsx`: reusable product presentation and add-to-cart control.
- `src/components/catalog/ProductGrid.tsx`: catalog loading, error, empty, and populated states.
- `src/components/ui/StatusMessage.tsx`: reusable empty, error, and loading presentation.
- `src/app/components/HomeCatalog.tsx`: Home page category links and selected catalog products.
- `src/app/products/components/ProductsContent.tsx`: client filter controls and product listing page.
- `src/app/checkout/components/CheckoutContent.tsx`: checkout form and order submission UI.
- `src/styles/tailwind.css`: light-first tokens and accessible component utility classes.
- `src/context/ThemeContext.tsx`, `src/components/Header.tsx`, `src/app/layout.tsx`: ByteForge branding and light-first initialization.
- `src/app/page.tsx`: practical Home composition without unsupported marketing sections.
- `src/test/setup.ts`, `vitest.config.ts`: test environment and aliases.
- `package.json`: test scripts and test dependencies.

## Task 1: Add test tooling and typed catalog adapter

**Files:**
- Create: `src/test/setup.ts`
- Create: `vitest.config.ts`
- Create: `src/features/catalog/types.ts`
- Create: `src/features/catalog/catalog-fixtures.ts`
- Create: `src/features/catalog/catalog-service.ts`
- Create: `src/features/catalog/catalog-service.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces `Product`, `CatalogFilter`, `CatalogResult`, and `CatalogService` types.
- Produces `catalogService.listProducts(filter?: CatalogFilter): Promise<CatalogResult>` and `catalogService.listCategories(): Promise<Category[]>`.

- [ ] **Step 1: Add the test command and dependencies**

Add `"test": "vitest run"` and `"test:watch": "vitest"` to `package.json`. Install `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, and `@testing-library/user-event` as development dependencies. Configure `vitest.config.ts` with the `@` alias, `environment: 'jsdom'`, and `setupFiles: ['./src/test/setup.ts']`.

- [ ] **Step 2: Write failing catalog-service tests**

```ts
import { describe, expect, it } from 'vitest';
import { catalogService } from './catalog-service';

describe('catalogService.listProducts', () => {
  it('matches the query against a product name and brand', async () => {
    const result = await catalogService.listProducts({ query: 'Keychron' });
    expect(result.products.map((product) => product.name)).toContain('Keychron Q6 Max');
  });

  it('returns an explicit empty result for an unavailable category', async () => {
    const result = await catalogService.listProducts({ categoryId: 'monitors', inStockOnly: true });
    expect(result.products).toHaveLength(0);
  });
});
```

- [ ] **Step 3: Run the catalog test and verify it fails**

Run: `pnpm test src/features/catalog/catalog-service.test.ts`

Expected: FAIL because `catalog-service` and its exported functions do not exist.

- [ ] **Step 4: Implement the catalog contract and fixture adapter**

Define the following minimum contract in `types.ts`:

```ts
export type Product = {
  id: number;
  slug: string;
  name: string;
  brand: string;
  categoryId: string;
  categoryName: string;
  priceTHB: number;
  image: string;
  imageAlt: string;
  stockQuantity: number;
  badge?: 'New' | 'Sale' | 'Limited';
};

export type CatalogFilter = {
  query?: string;
  categoryId?: string;
  brand?: string;
  sort?: 'featured' | 'price-asc' | 'price-desc';
  inStockOnly?: boolean;
};
```

Create deterministic fixtures including `Keychron Q6 Max`, a mouse, a headset, and at least two additional categories. Implement case-insensitive query matching, category and brand filters, stock filtering, and all declared sorts. Keep the fixture adapter isolated from UI components.

- [ ] **Step 5: Run the catalog test and type-check**

Run: `pnpm test src/features/catalog/catalog-service.test.ts && pnpm type-check`

Expected: PASS with no TypeScript errors.

- [ ] **Step 6: Commit the catalog foundation**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts src/test src/features/catalog
git commit -m "feat: add typed catalog adapter"
```

## Task 2: Establish the light-first ByteForge design system

**Files:**
- Modify: `src/styles/tailwind.css`
- Modify: `src/context/ThemeContext.tsx`
- Modify: `src/components/Header.tsx`
- Modify: `src/components/ui/AppLogo.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes the existing `ThemeProvider`.
- Produces light-first CSS tokens and a `Header` that reads cart quantity from `CartContext` in Task 5.

- [ ] **Step 1: Write the failing theme initialization test**

```tsx
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@/context/ThemeContext';

it('uses light mode when no saved preference exists', () => {
  localStorage.clear();
  render(<ThemeProvider><span>store</span></ThemeProvider>);
  expect(document.documentElement.classList.contains('light')).toBe(true);
  expect(screen.getByText('store')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the theme test and verify it fails**

Run: `pnpm test src/context/ThemeContext.test.tsx`

Expected: FAIL because light mode is not the default.

- [ ] **Step 3: Implement light-first tokens and branding**

Set the root CSS tokens to an off-white background, charcoal foreground, white card, gray border, and an accessible lime primary color. Replace glow, blob, scanline, gradient-text, and hover-scale utility usage with restrained border, shadow, and focus-ring utilities. Initialize `ThemeContext` with `light`, use `byteforge-theme` in localStorage, and apply `.light` before rendering children. Rename visible `GadgetArena` branding and metadata to `ByteForge`; remove the Rocket scripts from `layout.tsx`.

- [ ] **Step 4: Run the theme test and type-check**

Run: `pnpm test src/context/ThemeContext.test.tsx && pnpm type-check`

Expected: PASS, with `html.light` present after mount.

- [ ] **Step 5: Commit design-system changes**

```bash
git add src/styles/tailwind.css src/context src/components/Header.tsx src/components/ui/AppLogo.tsx src/app/layout.tsx
git commit -m "feat: establish ByteForge light theme"
```

## Task 3: Build reusable catalog display states and cards

**Files:**
- Create: `src/components/ui/StatusMessage.tsx`
- Create: `src/components/catalog/ProductCard.tsx`
- Create: `src/components/catalog/ProductGrid.tsx`
- Create: `src/components/catalog/ProductCard.test.tsx`

**Interfaces:**
- Consumes `Product` from `@/features/catalog/types`.
- `ProductCard` accepts `{ product: Product; onAddToCart(product: Product): void }`.
- `ProductGrid` accepts `{ products: Product[]; isLoading: boolean; error?: string; onRetry?(): void; onAddToCart(product: Product): void }`.

- [ ] **Step 1: Write failing product-card tests**

```tsx
const product = { id: 1, slug: 'keychron-q6-max', name: 'Keychron Q6 Max', brand: 'Keychron', categoryId: 'keyboards', categoryName: 'Keyboards', priceTHB: 7990, image: '/keyboard.jpg', imageAlt: 'Keyboard', stockQuantity: 3 };

it('formats Thai baht and adds an in-stock product', async () => {
  const onAddToCart = vi.fn();
  render(<ProductCard product={product} onAddToCart={onAddToCart} />);
  expect(screen.getByText(/฿7,990/)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /add keychron q6 max to cart/i }));
  expect(onAddToCart).toHaveBeenCalledWith(product);
});
```

- [ ] **Step 2: Run the product-card test and verify it fails**

Run: `pnpm test src/components/catalog/ProductCard.test.tsx`

Expected: FAIL because the reusable card does not exist.

- [ ] **Step 3: Implement card and state components**

Create cards with an image, brand, product name, formatted Thai baht price, stock badge, and an accessible add-to-cart button. Render a disabled `Out of stock` action when `stockQuantity` is zero. `StatusMessage` must render semantic loading (`role="status"`), error (`role="alert"` with retry button), and empty states. `ProductGrid` composes these components instead of duplicating markup across pages.

- [ ] **Step 4: Run the product-card test and type-check**

Run: `pnpm test src/components/catalog/ProductCard.test.tsx && pnpm type-check`

Expected: PASS with the price, stock state, and click callback verified.

- [ ] **Step 5: Commit catalog components**

```bash
git add src/components/catalog src/components/ui/StatusMessage.tsx
git commit -m "feat: add reusable catalog components"
```

## Task 4: Replace the marketing mock Home page

**Files:**
- Create: `src/app/components/HomeCatalog.tsx`
- Create: `src/app/components/HomeCatalog.test.tsx`
- Modify: `src/app/components/HeroSection.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/components/CategoryShowcase.tsx`

**Interfaces:**
- Consumes `catalogService`, `ProductGrid`, and `CartContext` from Tasks 1, 3, and 5.
- Produces a Home page with category navigation, featured products, and factual shipping and return information.

- [ ] **Step 1: Write the failing Home catalog test**

```tsx
it('shows a factual product section without fabricated social proof', async () => {
  render(<HomeCatalog />);
  expect(await screen.findByRole('heading', { name: /selected gear/i })).toBeInTheDocument();
  expect(screen.queryByText(/12,000|happy gamers|real gamers/i)).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the Home test and verify it fails**

Run: `pnpm test src/app/components/HomeCatalog.test.tsx`

Expected: FAIL because `HomeCatalog` does not exist.

- [ ] **Step 3: Implement the practical storefront Home page**

Replace the all-caps hero with a concise ByteForge value proposition and a single catalog CTA. Make category cards link to `/products?category=<categoryId>`. Render a selected-product grid through `HomeCatalog`. Replace `StatsSection`, `TestimonialsSection`, and `CTABanner` imports in `page.tsx` with a concise delivery and returns panel that makes no unsupported numerical claims. Remove animations and decorative overlays from the hero and category cards.

- [ ] **Step 4: Run Home tests and type-check**

Run: `pnpm test src/app/components/HomeCatalog.test.tsx && pnpm type-check`

Expected: PASS with no fabricated social-proof copy in the rendered Home catalog section.

- [ ] **Step 5: Commit Home-page revision**

```bash
git add src/app/page.tsx src/app/components
git commit -m "feat: humanize ByteForge home page"
```

## Task 5: Make product browsing data-driven

**Files:**
- Modify: `src/app/products/components/ProductsContent.tsx`
- Create: `src/app/products/components/ProductsContent.test.tsx`
- Modify: `src/app/products/page.tsx`

**Interfaces:**
- Consumes `CatalogFilter`, `catalogService`, `ProductGrid`, and `CartContext`.
- Produces search, category, brand, sort, in-stock filters, and URL-backed category selection.

- [ ] **Step 1: Write failing product-page interaction tests**

```tsx
it('filters products after a shopper searches', async () => {
  render(<ProductsContent initialCategoryId={undefined} />);
  await userEvent.type(screen.getByRole('searchbox', { name: /search products/i }), 'Keychron');
  expect(await screen.findByText('Keychron Q6 Max')).toBeInTheDocument();
  expect(screen.queryByText('Razer DeathAdder V3')).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the product-page test and verify it fails**

Run: `pnpm test src/app/products/components/ProductsContent.test.tsx`

Expected: FAIL because the current component owns unrelated hard-coded data and has no `initialCategoryId` interface.

- [ ] **Step 3: Implement filter state and catalog loading**

Replace the local product array with `catalogService`. Use the `category` search parameter in `ProductsPage` to pass `initialCategoryId`. Expose labeled search, select controls, an in-stock checkbox, and a reset-filters button. Use `ProductGrid` for loading, empty, error, and populated states. Ensure all filters are client state and the catalog service is the only product-data dependency.

- [ ] **Step 4: Run product-page tests and type-check**

Run: `pnpm test src/app/products/components/ProductsContent.test.tsx && pnpm type-check`

Expected: PASS, demonstrating query filtering and type-safe page props.

- [ ] **Step 5: Commit data-driven browsing**

```bash
git add src/app/products
git commit -m "feat: add ByteForge product browsing"
```

## Task 6: Add persistent cart state and a truthful checkout

**Files:**
- Create: `src/features/cart/CartContext.tsx`
- Create: `src/features/cart/cart.test.ts`
- Create: `src/features/orders/order-service.ts`
- Create: `src/features/orders/order-service.test.ts`
- Modify: `src/components/Header.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/checkout/components/CheckoutContent.tsx`
- Create: `src/app/checkout/components/CheckoutContent.test.tsx`

**Interfaces:**
- `CartProvider` exposes `{ items: CartItem[]; addItem(product: Product): void; updateQuantity(productId: number, quantity: number): void; removeItem(productId: number): void; itemCount: number; subtotalTHB: number }`.
- `createOrder(items: CartItem[], token?: string): Promise<OrderSubmissionResult>` sends `Array<{ product_id: number; amount: number }>` to `POST /api/v1/orders` when `NEXT_PUBLIC_API_URL` and a token are available.

- [ ] **Step 1: Write failing cart reducer tests**

```ts
it('merges duplicate products and clamps quantity to stock', () => {
  const cart = addItem([], productWithStockOfThree);
  const updated = addItem(cart, productWithStockOfThree);
  expect(updated[0].quantity).toBe(2);
  expect(updateQuantity(updated, productWithStockOfThree.id, 9)[0].quantity).toBe(3);
});
```

- [ ] **Step 2: Run cart tests and verify they fail**

Run: `pnpm test src/features/cart/cart.test.ts`

Expected: FAIL because cart functions do not exist.

- [ ] **Step 3: Implement cart and order services**

Persist cart items to `localStorage` after hydration. Replace hard-coded cart counts in page components with `itemCount` from context. Format totals in Thai baht. Remove PayPal and crypto UI. Validate required contact and delivery fields before allowing review. Build the Go order payload exactly as `[{ product_id: item.product.id, amount: item.quantity }]`; show a demo-mode success message when API configuration or token is missing, and show an error state with retry for failed configured requests.

- [ ] **Step 4: Write and run checkout interaction tests**

```tsx
it('blocks review until required delivery details are entered', async () => {
  render(<CheckoutContent />);
  await userEvent.click(screen.getByRole('button', { name: /review order/i }));
  expect(await screen.findByText(/enter your name and delivery address/i)).toBeInTheDocument();
});
```

Run: `pnpm test src/features/cart/cart.test.ts src/features/orders/order-service.test.ts src/app/checkout/components/CheckoutContent.test.tsx`

Expected: PASS, demonstrating stock-aware cart behavior, exact API payload construction, and validation feedback.

- [ ] **Step 5: Commit cart and checkout behavior**

```bash
git add src/features/cart src/features/orders src/components/Header.tsx src/app/layout.tsx src/app/checkout
git commit -m "feat: add cart and checkout flow"
```

## Task 7: Verify the storefront and document the API gap

**Files:**
- Modify: `README.md`
- Modify: `src/app/layout.tsx`
- Modify: `next.config.mjs`

**Interfaces:**
- Documents `NEXT_PUBLIC_API_URL`, the fixture adapter behavior, and the missing Go product endpoints.

- [ ] **Step 1: Write the README verification checklist**

Add a `Verification` section containing these exact commands:

```bash
pnpm test
pnpm type-check
pnpm build
```

- [ ] **Step 2: Implement production metadata and documentation**

Set title and description to ByteForge. Remove `ignoreBuildErrors` and `ignoreDuringBuilds` from `next.config.mjs` so production checks cannot hide TypeScript or lint errors. Replace the generated README with setup instructions, the three customer flows, environment variables, adapter behavior, API compatibility, and known backend limitations.

- [ ] **Step 3: Run the complete verification suite**

Run: `pnpm test && pnpm type-check && pnpm build`

Expected: all tests pass, TypeScript has zero errors, and Next.js emits a production build.

- [ ] **Step 4: Commit verification and documentation**

```bash
git add README.md src/app/layout.tsx next.config.mjs
git commit -m "docs: document ByteForge storefront"
```

## Plan self-review

- Spec coverage: Tasks 2 and 4 cover the light-first humanized visual direction; Tasks 1, 3, and 5 cover typed catalog data and practical browsing states; Task 6 covers cart, checkout validation, and existing Go order payload compatibility; Task 7 covers responsive verification and documented backend limitations.
- Scope check: no task adds payments, reviews, administration, or dark-mode work.
- Type consistency: `Product` is defined in Task 1 and consumed consistently by catalog and cart interfaces; the Go order payload is explicitly `product_id` plus `amount`.
- Placeholder check: no unbounded or deferred implementation steps remain.
