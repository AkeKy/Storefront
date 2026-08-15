# Mouse Category Rename Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the gaming-mouse category from `mice` to `mouse` consistently across the storefront.

**Architecture:** The category ID is fixture data consumed by the typed `CatalogService`. Rename the fixture/category IDs and all consumer/test fixtures together, then align the i18n lookup keys and visible English label. The Thai label remains `เมาส์`.

**Tech Stack:** Next.js, TypeScript, React, Vitest, Testing Library.

## Global Constraints

- Keep the catalog fixture-backed and accessed through `CatalogService`.
- Do not modify prices, stock behavior, product names, cart persistence, checkout payloads, or theme behavior.
- Customer-facing English category copy is exactly `Mouse`; Thai copy is exactly `เมาส์`.

---

### Task 1: Rename category data and language keys

**Files:**
- Modify: `src/features/catalog/catalog-fixtures.ts`
- Modify: `src/features/i18n/messages.ts`
- Modify: `src/app/components/CategoryShowcase.tsx`

**Interfaces:**
- Produces: category ID `mouse`, supplied through `CatalogService` and consumed by existing category filters.

- [ ] **Step 1: Update test expectations and test fixtures**

Replace category IDs `mice` with `mouse` and English labels `Mice` with `Mouse` in affected catalog, cart, checkout, product-list, and language-provider tests.

- [ ] **Step 2: Run focused tests to verify the old identifier fails**

Run: `pnpm exec vitest run src/features/i18n/LanguageContext.test.tsx src/features/catalog/catalog-service.test.ts`

Expected: a failing expectation or fixture lookup still using `mice`.

- [ ] **Step 3: Rename runtime category data and i18n mapping**

```ts
{ id: 'mouse', name: 'Mouse' }
categoryId: 'mouse'
'categories.mouse.subtitle': 'Precision control'
mouse: 'Mouse'
```

Update the Thai equivalents to use `mouse` as their lookup key while keeping the value `เมาส์`.

- [ ] **Step 4: Run focused tests to verify the renamed category works**

Run: `pnpm exec vitest run src/features/i18n/LanguageContext.test.tsx src/features/catalog/catalog-service.test.ts src/app/products/components/ProductsContent.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/catalog/catalog-fixtures.ts src/features/i18n/messages.ts src/app/components/CategoryShowcase.tsx src/features/i18n/LanguageContext.test.tsx src/features/catalog/catalog-service.test.ts src/features/cart/cart.test.ts src/app/products/components/ProductsContent.test.tsx src/app/checkout/components/CheckoutContent.test.tsx
git commit -m "refactor: rename mice category to mouse"
```

### Task 2: Verify no stale identifier remains

**Files:**
- Modify: any remaining active source/test file found by the exact search.

**Interfaces:**
- Consumes: `mouse` category identifier from Task 1.
- Produces: no active storefront use of `mice` or `Mice`.

- [ ] **Step 1: Search active code and tests**

Run: `rg -n "Mice|mice" src`

Expected: no results.

- [ ] **Step 2: Run the relevant test suite and type check**

Run: `pnpm test` then `pnpm type-check`

Expected: both commands exit successfully.

- [ ] **Step 3: Inspect whitespace and repository state**

Run: `git diff --check` and `git status --short`

Expected: no whitespace errors; only the known stat-only files may appear outside this change.
