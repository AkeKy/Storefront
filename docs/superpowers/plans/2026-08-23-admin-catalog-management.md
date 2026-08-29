# Gadget Arena Admin Catalog Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Give authenticated Administrators a protected dashboard for creating, editing, and soft-deleting products and categories whose changes drive the public catalog.

**Architecture:** Add injected Go admin services and GORM repositories behind existing JWT/Admin middleware. Storefront BFF routes proxy protected mutations using the HttpOnly session from Plan 1, while focused admin feature modules own DTO mapping, forms, and tables.

**Tech Stack:** Go 1.24, Echo 4, GORM/MySQL, Next.js 15, React 19, TypeScript, Vitest, Testing Library

**Spec:** docs/superpowers/specs/2026-08-23-auth-admin-commerce-mvp-design.md

## Global Constraints

- Plan 1 is complete and both test branches are clean before this plan starts.
- Go middleware, not hidden UI, is the authority for Admin access.
- Product IDs and audit fields are server-owned.
- Price must be finite and non-negative; stock must be a non-negative integer.
- Product image input is a URL, not file upload.
- Product/category deletion is soft deletion.
- A category with active products returns HTTP 409 and remains unchanged.
- Public catalog reads remain backward-compatible.
- Admin pages retain Gadget Arena theme and English-default/Thai i18n.
- Work only on test branches; do not merge main or open a pull request.

---

### Task 1: Add backend Product Admin service and persistence

**Files:**
- Modify: project_intern1/model/products_model/products.go
- Create: project_intern1/usecase/admin_product_usecase/service.go
- Create: project_intern1/usecase/admin_product_usecase/service_test.go
- Create: project_intern1/repository/admin_product_repository/repository.go
- Create: project_intern1/repository/admin_product_repository/repository_test.go

**Interfaces:**
- Produces AdminProductInput with ProductName, Slug, Description, Brand, CategoryID, Price, StockQuantity, ImageURL, and Badge.
- Produces Service.Create(context.Context, actorID int, input AdminProductInput) (products_model.Product, error).
- Produces Service.Update(context.Context, actorID, productID int, input AdminProductInput) (products_model.Product, error).
- Produces Service.Delete(context.Context, actorID, productID int) error.
- Sentinel errors: ErrInvalidProduct, ErrProductConflict, ErrCategoryNotFound, ErrProductNotFound.

- [ ] **Step 1: Write RED service tests**

Test exact boundaries:

~~~go
valid := products_model.AdminProductInput{
	ProductName: "Keychron Q6 Max",
	Slug: "keychron-q6-max",
	Description: "Full-size mechanical keyboard",
	Brand: "Keychron",
	CategoryID: 2,
	Price: 8990,
	StockQuantity: 8,
	ImageURL: "https://images.example.com/keychron-q6-max.jpg",
	Badge: "New",
}
~~~

Table cases reject blank normalized strings, non-positive category ID, negative/NaN/infinite price, negative stock, unsupported URL schemes, blank image host, and invalid slug. Tests prove actor ID populates CreatedBy/UpdatedBy/DeletedBy and repository conflict/not-found errors map to service sentinels.

- [ ] **Step 2: Verify RED**

~~~powershell
go test ./usecase/admin_product_usecase -v
~~~

Expected: compile failure because service and input do not exist.

- [ ] **Step 3: Implement minimum validation/service**

Slug accepts lowercase ASCII letters, numbers, and internal hyphens with no repeated/edge hyphen. Image URL is optional; when present it must parse as absolute http or https with non-empty host. Normalize display strings with TrimSpace. Repository methods use a transaction for existence/conflict checks and return the newly persisted public Product DTO.

- [ ] **Step 4: Add RED repository tests and implementation**

Use go-sqlmock to prove unique slug/name conflicts, active-category requirement, update scoping to non-deleted product, and soft-delete audit columns. Do not hard-delete or mutate product_id.

~~~powershell
go test ./repository/admin_product_repository -v
~~~

Expected RED before repository implementation, then PASS after New(db) implements the service repository interface.

- [ ] **Step 5: Verify and commit**

~~~powershell
go test ./usecase/admin_product_usecase ./repository/admin_product_repository -v
go test ./...
git add model/products_model usecase/admin_product_usecase repository/admin_product_repository
git commit -m "feat: add admin product persistence"
~~~

---

### Task 2: Expose protected Product Admin APIs

**Files:**
- Create: project_intern1/handlers/admin_product_handlers/products.go
- Create: project_intern1/handlers/admin_product_handlers/products_test.go
- Modify: project_intern1/routes/admin_routes.go
- Modify: project_intern1/routes/routes.go
- Create: project_intern1/routes/admin_product_routes_test.go

**Interfaces:**
- POST /api/v1/admin/products -> 201 with Product.
- PUT /api/v1/admin/products/:id -> 200 with Product.
- DELETE /api/v1/admin/products/:id -> 204 with no body.
- Consumes Plan 1 setLogin plus IsAdmin middleware.

- [ ] **Step 1: Write RED handler/route tests**

Use a fake AdminProductService. Assert exact status/code mapping:

~~~text
invalid input      -> 400 invalid_product
missing category   -> 404 category_not_found
missing product    -> 404 product_not_found
duplicate conflict -> 409 product_conflict
unexpected error   -> 500 internal_error
~~~

Route tests prove Member JWT receives 403, missing JWT receives 401, and Admin JWT reaches each handler. Assert body IDs/audit fields are ignored rather than trusted.

- [ ] **Step 2: Verify RED**

~~~powershell
go test ./handlers/admin_product_handlers ./routes -run 'TestAdminProduct' -v
~~~

Expected: FAIL because handlers/routes do not exist.

- [ ] **Step 3: Implement handlers and route wiring**

Parse positive integer path IDs. Read actor ID only from validated claims. Bind AdminProductInput and map sentinels to the literal contract above. Register plural routes under the existing /admin group.

- [ ] **Step 4: Verify and commit**

~~~powershell
go test ./handlers/admin_product_handlers ./routes -v
go test ./...
go vet ./...
git add handlers/admin_product_handlers routes
git commit -m "feat: expose admin product APIs"
~~~

---

### Task 3: Harden Category Admin behavior

**Files:**
- Modify: project_intern1/model/categories_model/request_categories.go
- Create: project_intern1/usecase/admin_category_usecase/service.go
- Create: project_intern1/usecase/admin_category_usecase/service_test.go
- Create: project_intern1/repository/admin_category_repository/repository.go
- Create: project_intern1/repository/admin_category_repository/repository_test.go
- Replace: project_intern1/handlers/admin_hadlers/add_category.go
- Replace: project_intern1/handlers/admin_hadlers/edit_category.go
- Replace: project_intern1/handlers/admin_hadlers/delete_category.go
- Create: project_intern1/handlers/admin_hadlers/categories_test.go
- Modify: project_intern1/routes/admin_routes.go

**Interfaces:**
- CategoryInput contains CategoryName and Description only.
- Create returns 201; update returns 200; soft delete returns 204.
- Sentinel errors: ErrInvalidCategory, ErrCategoryConflict, ErrCategoryNotFound, ErrCategoryInUse.

- [ ] **Step 1: Write RED service/repository tests**

Prove normalized non-empty unique name, server-owned audit fields, missing category, and delete conflict when an active product references the category. SQL must count only products with deleted_at IS NULL.

~~~go
if activeProducts > 0 {
	return ErrCategoryInUse
}
~~~

- [ ] **Step 2: Verify RED**

~~~powershell
go test ./usecase/admin_category_usecase ./repository/admin_category_repository -v
~~~

Expected: FAIL because the injected service/repository do not exist.

- [ ] **Step 3: Implement and replace global category functions**

Follow Product Admin injection pattern. Handler error codes are invalid_category, category_conflict, category_not_found, category_in_use, and internal_error. Keep public GET /categories response unchanged.

- [ ] **Step 4: Verify and commit**

~~~powershell
go test ./usecase/admin_category_usecase ./repository/admin_category_repository ./handlers/admin_hadlers ./routes -v
go test ./...
go vet ./...
git add model/categories_model usecase/admin_category_usecase repository/admin_category_repository handlers/admin_hadlers routes
git commit -m "fix: harden admin category management"
~~~

---

### Task 4: Add Storefront Admin BFF and access shell

**Files:**
- Create: Storefront/src/server/admin-session.ts
- Create: Storefront/src/server/admin-session.test.ts
- Create: Storefront/src/app/api/admin/products/route.ts
- Create: Storefront/src/app/api/admin/products/[id]/route.ts
- Create: Storefront/src/app/api/admin/categories/route.ts
- Create: Storefront/src/app/api/admin/categories/[id]/route.ts
- Create: Storefront/src/app/api/admin/admin-routes.test.ts
- Create: Storefront/src/features/admin/types.ts
- Create: Storefront/src/features/admin/admin-api.ts
- Create: Storefront/src/features/admin/admin-api.test.ts
- Create: Storefront/src/app/admin/layout.tsx
- Create: Storefront/src/app/admin/page.tsx
- Create: Storefront/src/components/admin/AdminShell.tsx
- Create: Storefront/src/components/admin/AdminGuard.tsx
- Create: Storefront/src/components/admin/AdminGuard.test.tsx
- Modify: Storefront/src/features/i18n/messages.ts

**Interfaces:**
- requireAdminSession() returns token plus SessionUser or throws 401/403.
- adminApi exposes list/create/update/delete products and categories without token parameters.
- GET /api/admin/products requires Admin session and proxies GET /api/v1/products?page=1&limit=100; POST creates a product.
- GET /api/admin/categories requires Admin session and proxies GET /api/v1/categories; POST creates a category.
- AdminGuard renders children only for permission ID 1.

- [ ] **Step 1: Write RED server/client/guard tests**

BFF tests prove missing cookie -> 401, Member /me -> 403, Admin -> backend mutation with bearer header, cross-origin mutation -> 403, and browser JSON contains no token. AdminGuard tests cover loading, anonymous redirect to /login?returnTo=/admin, Member access denied, and Admin content.

- [ ] **Step 2: Verify RED**

~~~powershell
npm test -- src/server/admin-session.test.ts src/app/api/admin/admin-routes.test.ts src/features/admin src/components/admin
~~~

Expected: FAIL because Admin BFF and shell do not exist.

- [ ] **Step 3: Implement BFF routes and shell**

Use Plan 1 helpers for cookie, origin, and BackendError mapping. Do not duplicate fetch/envelope parsing. GET handlers still require an Admin session before proxying the public backend lists. AdminShell provides links to /admin/products, /admin/categories, /admin/orders and a Storefront return link. The Orders link may point to a localized coming-next label only until Plan 3; no fake order data is rendered.

- [ ] **Step 4: Verify and commit**

~~~powershell
npm test -- src/server/admin-session.test.ts src/app/api/admin/admin-routes.test.ts src/features/admin src/components/admin
npm run type-check
git add src/server/admin-session* src/app/api/admin src/features/admin src/app/admin src/components/admin src/features/i18n/messages.ts
git commit -m "feat: add protected admin shell"
~~~

---

### Task 5: Build Product and Category management UI

**Files:**
- Create: Storefront/src/app/admin/products/page.tsx
- Create: Storefront/src/app/admin/products/components/ProductManager.tsx
- Create: Storefront/src/app/admin/products/components/ProductForm.tsx
- Create: Storefront/src/app/admin/products/components/ProductManager.test.tsx
- Create: Storefront/src/app/admin/categories/page.tsx
- Create: Storefront/src/app/admin/categories/components/CategoryManager.tsx
- Create: Storefront/src/app/admin/categories/components/CategoryManager.test.tsx
- Modify: Storefront/src/components/ui/AppImage.tsx
- Modify: Storefront/src/components/ui/AppImage.test.tsx
- Modify: Storefront/src/features/i18n/messages.ts

**Interfaces:**
- ProductForm emits AdminProductInput exactly matching backend snake/camel adapter.
- CategoryManager emits CategoryInput with name/description only.
- AppImage handles an arbitrary valid external HTTP/HTTPS URL without crashing and falls back to /assets/images/no_image.png on load error.

- [ ] **Step 1: Write RED UI behavior tests**

Product tests prove list/search, create payload, edit prefill, numeric validation, URL preview/fallback, submit lock, API field errors, and confirmed soft delete. Category tests prove create/edit, active-product conflict message, and confirmed delete. Use literal accessible names in English and rerender after switching to Thai.

- [ ] **Step 2: Verify RED**

~~~powershell
npm test -- src/app/admin/products src/app/admin/categories src/components/ui/AppImage.test.tsx
~~~

Expected: FAIL because managers/forms are absent and AppImage external behavior is unguarded.

- [ ] **Step 3: Implement focused components**

Keep state/data fetching in ProductManager/CategoryManager; keep field validation and form rendering in ProductForm. Convert finite numeric strings explicitly and never use falsy checks that reject zero price/stock. Disable forms while requests are pending and refetch canonical backend DTOs after mutation.

AppImage treats external URLs as unoptimized, passes alt always, and swaps to the local fallback once without an error loop.

- [ ] **Step 4: Verify and commit**

~~~powershell
npm test -- src/app/admin/products src/app/admin/categories src/components/ui/AppImage.test.tsx
npm test
npm run type-check
npm run build
git add src/app/admin/products src/app/admin/categories src/components/ui/AppImage* src/features/i18n/messages.ts
git commit -m "feat: manage products and categories"
~~~

---

### Task 6: Full-stack catalog management verification

**Files:**
- Modify: Storefront/README.md
- Modify: project_intern1/README.md

**Interfaces:** No new runtime interface.

- [ ] **Step 1: Run complete automated checks**

~~~powershell
# Backend
go test ./...
go vet ./...

# Storefront
npm test
npm run type-check
npm run build
~~~

Expected: all exit 0.

- [ ] **Step 2: Run real Admin smoke flow**

With Docker MySQL, Go, and Storefront running: login as bootstrap Admin; create a unique category; create a product with URL image; confirm public catalog shows price/stock/image; edit price/stock; confirm update; soft-delete product; confirm it disappears publicly; then delete category. Verify a category with an active product returns 409 before product deletion.

- [ ] **Step 3: Update docs and commit**

Document Product/Category API fields, status/error codes, Admin local smoke steps, URL-image policy, and soft-delete behavior.

~~~powershell
# Backend
git add README.md
git commit -m "docs: describe admin catalog APIs"

# Storefront
git add README.md
git commit -m "docs: describe admin catalog workflow"
~~~

Do not push until review passes.

## Phase 2 Completion Gate

- Admin-only Product/Category mutations work through BFF.
- Member and anonymous requests cannot reach admin handlers.
- Public catalog reflects real Admin changes.
- External image URL failures degrade to local placeholder.
- Backend/Storefront checks and real smoke flow pass.
- Review and push test branches before Plan 3.
