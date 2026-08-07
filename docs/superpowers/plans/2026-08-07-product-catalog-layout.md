# Product Catalog Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Products catalogue page around a desktop filter sidebar while preserving the existing functional storefront behavior.

**Architecture:** `ProductsContent` remains the single owner of filter state and catalogue requests. Its controls will be rearranged into a header row plus sidebar; `ProductGrid` keeps rendering service states. `ProductCard` receives a compact visual treatment without changing its typed product/cart interface.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Vitest, Testing Library.

## Global Constraints

- Use the existing global theme tokens only; do not set a page-specific light or dark class.
- Keep dark as the existing default and let the header theme control restyle the page.
- Preserve catalogue filters, loading/error/empty states, Thai-baht pricing, stock state, and cart behavior.
- Do not add ratings, reviews, fabricated counts, crossed-out prices, or fake availability claims.

---

### Task 1: Protect the product-layout controls

**Files:**
- Modify: `src/app/products/components/ProductsContent.test.tsx`

**Interfaces:**
- Consumes: `ProductsContent({ initialCategoryId?: string })` inside `CartProvider`.
- Produces: coverage that finds the visible search, sort, category, and brand controls by accessible label after their layout changes.

- [ ] **Step 1: Write the failing test**

```tsx
expect(await screen.findByRole('searchbox', { name: /search products/i })).toBeInTheDocument();
expect(screen.getByRole('combobox', { name: /sort by/i })).toBeInTheDocument();
expect(screen.getByRole('combobox', { name: /category/i })).toBeInTheDocument();
expect(screen.getByRole('combobox', { name: /brand/i })).toBeInTheDocument();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/app/products/components/ProductsContent.test.tsx`

Expected: FAIL until the newly required accessible controls exist.

- [ ] **Step 3: Commit the test**

```bash
git add src/app/products/components/ProductsContent.test.tsx
git commit -m "test: cover catalog layout controls"
```

### Task 2: Implement the sidebar catalogue layout

**Files:**
- Modify: `src/app/products/components/ProductsContent.tsx`
- Modify: `src/components/catalog/ProductCard.tsx`
- Modify: `src/styles/tailwind.css`
- Test: `src/app/products/components/ProductsContent.test.tsx`

**Interfaces:**
- Consumes: `catalogService.listCategories()`, `catalogService.listProducts(filter)`, and `useCart().addItem` exactly as currently typed.
- Produces: unchanged `ProductGrid` props: `products`, `isLoading`, `error`, `onRetry`, and `onAddToCart`.

- [ ] **Step 1: Implement the page layout**

```tsx
<div className="catalog-layout">
  <aside className="filter-sidebar">{/* category, brand, stock and reset controls */}</aside>
  <ProductGrid {...gridProps} />
</div>
```

Place the search input and sort select above `catalog-layout`; preserve every existing controlled value and event handler. Keep labels associated with their inputs and retain the existing reset behavior.

- [ ] **Step 2: Restyle cards with factual data only**

```tsx
<button aria-label={`Add ${product.name} to cart`} disabled={!isInStock}>
  {isInStock ? 'Add to cart' : 'Out of stock'}
</button>
```

Use the existing `product.brand`, `product.name`, `priceFormatter`, `badge`, and `stockQuantity`; do not add unsupported data fields.

- [ ] **Step 3: Add token-based layout utilities**

```css
.catalog-layout { display: grid; gap: 1.5rem; }
@media (min-width: 1024px) { .catalog-layout { grid-template-columns: 16rem minmax(0, 1fr); } }
```

Use `var(--*)` tokens for all surfaces, borders, and text so the existing theme control restyles the page.

- [ ] **Step 4: Run focused verification**

Run: `pnpm exec vitest run src/app/products/components/ProductsContent.test.tsx src/components/catalog/ProductCard.test.tsx && pnpm type-check`

Expected: focused tests and TypeScript pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/products/components/ProductsContent.tsx src/components/catalog/ProductCard.tsx src/styles/tailwind.css src/app/products/components/ProductsContent.test.tsx
git commit -m "feat: reshape product catalog layout"
```

### Task 3: Verify the rendered catalogue

**Files:**
- Verify: `src/app/products/components/ProductsContent.tsx`
- Verify: `src/components/catalog/ProductCard.tsx`

**Interfaces:**
- Consumes: the existing local development server at `http://localhost:4028/products`.
- Produces: browser evidence that filters, product grid, and add-to-cart controls render without browser console errors.

- [ ] **Step 1: Inspect both themes in the browser**

Open `/products`, verify the desktop sidebar, search/sort row, product grid, and add-to-cart control. Toggle the existing theme control once and verify the layout restyles without a page-level theme override.

- [ ] **Step 2: Run final verification**

Run: `pnpm test && pnpm build`

Expected: all tests pass and Next completes the production build. If the Codex sandbox cannot execute Vitest or build, ask the user to run these commands from normal PowerShell and provide the resulting output.

