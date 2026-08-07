# Gadget Arena UI Restoration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore Gadget Arena's original visual presentation while retaining working storefront behavior.

**Architecture:** Treat `main` as the source for visual components and external image presentation. Preserve the current feature modules as the source of truth for catalog, cart, checkout, theme, and order behavior; adapt the restored UI components to those modules instead of restoring inline mock state.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, Vitest, Testing Library.

## Global Constraints

- Preserve catalog search, filters, stock status, Thai baht pricing, cart persistence, checkout validation, demo-first order behavior, and functional theme toggling.
- Use Gadget Arena branding and the original image URLs from `main`.
- Do not reintroduce fabricated reviews, ratings, shopper counts, payment claims, or inert navigation links.

---

### Task 1: Restore branding and catalog imagery

**Files:**
- Modify: `src/app/layout.tsx`, `src/components/Header.tsx`, `src/components/Footer.tsx`, `src/features/catalog/catalog-fixtures.ts`
- Test: `src/components/Footer.test.tsx`, `src/features/catalog/catalog-service.test.ts`

- [ ] **Step 1: Write failing assertions**

```tsx
expect(screen.getByText(/GadgetArena/i)).toBeInTheDocument();
expect(result.products[0].image).toBe('https://images.unsplash.com/photo-1700825238348-f76468dc6e81');
```

- [ ] **Step 2: Run focused tests to verify the current ByteForge/placeholder behavior fails the new assertions.**

Run: `pnpm exec vitest run src/components/Footer.test.tsx src/features/catalog/catalog-service.test.ts`

- [ ] **Step 3: Restore Gadget Arena labels and map fixture images to the original URLs.**

- [ ] **Step 4: Run the focused tests.**

- [ ] **Step 5: Commit**

```text
feat: restore Gadget Arena catalog identity
```

### Task 2: Restore original visual shells with live behavior

**Files:**
- Modify: `src/app/page.tsx`, `src/app/components/HeroSection.tsx`, `src/app/components/CategoryShowcase.tsx`, `src/app/components/FeaturedProducts.tsx`, `src/app/products/components/ProductsContent.tsx`, `src/app/checkout/components/CheckoutContent.tsx`, `src/styles/tailwind.css`
- Test: `src/app/components/HomeCatalog.test.tsx`, `src/app/products/components/ProductsContent.test.tsx`, `src/app/checkout/components/CheckoutContent.test.tsx`

- [ ] **Step 1: Update existing tests to assert the visual shell still exposes real add-to-cart, filtered products, and demo checkout behavior.**
- [ ] **Step 2: Run the focused tests to verify failures describe the removed/adapted UI contract.**
- [ ] **Step 3: Adapt original layouts to call `catalogService`, `CartProvider`, and `createOrder`; do not restore inline mock products or payment methods.**
- [ ] **Step 4: Run focused tests, then `pnpm type-check`.**
- [ ] **Step 5: Commit**

```text
feat: restore Gadget Arena storefront visuals
```

### Task 3: Verify the restored storefront

**Files:**
- Modify only if a verification failure requires a focused correction.

- [ ] **Step 1: Run `pnpm test`.**
- [ ] **Step 2: Run `pnpm build`.**
- [ ] **Step 3: Inspect the home, products, and checkout routes manually at `http://localhost:4028`.**
- [ ] **Step 4: Commit any narrowly-scoped verification correction.**
