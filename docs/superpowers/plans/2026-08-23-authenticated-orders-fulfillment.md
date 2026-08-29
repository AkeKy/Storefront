# Gadget Arena Authenticated Orders and Fulfillment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Let authenticated Members place stock-safe orders with immutable delivery/line snapshots and let Admins inspect and advance those orders through the approved fulfillment states.

**Architecture:** Replace global order functions with injected services and transactional GORM repositories. The Storefront uses BFF order routes and the Plan 1 session; checkout preserves a guest draft through login, Members get order history, and the Admin shell gains order filtering/details/status actions.

**Tech Stack:** Go 1.24, Echo 4, GORM/MySQL 8.4, Next.js 15, React 19, TypeScript, Vitest, Testing Library, Docker Compose

**Spec:** docs/superpowers/specs/2026-08-23-auth-admin-commerce-mvp-design.md

## Global Constraints

- Plans 1 and 2 are complete and reviewed before this plan starts.
- Only authenticated Members may create/view their own orders.
- Browser payloads never own member ID, price, total, status, or audit fields.
- Checkout sends items plus an immutable delivery snapshot.
- One database transaction validates/decrements stock, snapshots product data, calculates totals, and creates the order.
- Duplicate product IDs are combined before validation.
- Insufficient stock returns HTTP 409 and leaves no partial order/stock change.
- Pending may become Processing or Cancelled; Processing may become Completed or Cancelled; Completed/Cancelled are terminal.
- Cancellation restores stock exactly once in the same transaction.
- No online payment or delivery-fee calculation is added.
- Work only on test branches; do not merge main or open a pull request.

---

### Task 1: Add order snapshot schema with reversible migration

**Files:**
- Create: project_intern1/migrations/0002_add_order_snapshots.up.sql
- Create: project_intern1/migrations/0002_add_order_snapshots.down.sql
- Create: project_intern1/migrations/order_snapshot_migration_test.go
- Modify: project_intern1/model/database_models/order_has_products.go
- Create: project_intern1/model/database_models/order_delivery_snapshot.go
- Modify: project_intern1/model/database_models/orders.go

**Interfaces:**
- order_has_products gains non-null product_name snapshot while retaining price/amount.
- order_delivery_snapshots has exactly one row per order.
- orders.order_code receives a unique database constraint.

- [ ] **Step 1: Write RED migration contract test**

Extend migration tests to apply 0000, 0001, and 0002 SQL to disposable MySQL. Assert information_schema reports:

~~~text
order_has_products.product_name VARCHAR(255) NOT NULL
order_delivery_snapshots.order_id UNIQUE and FOREIGN KEY -> orders.order_id
orders.order_code UNIQUE
~~~

Insert a pre-0002 product/order line before applying 0002 and assert product_name is backfilled from products. Apply down migration and assert only 0002 columns/table/index are removed.

- [ ] **Step 2: Verify RED**

~~~powershell
go test ./migrations -run TestOrderSnapshotMigration -v
~~~

Expected: FAIL because migration files/schema are absent.

- [ ] **Step 3: Implement up/down migration**

Up order:

~~~sql
ALTER TABLE order_has_products ADD COLUMN product_name VARCHAR(255) NULL AFTER product_id;
UPDATE order_has_products ohp JOIN products p ON p.product_id = ohp.product_id
SET ohp.product_name = p.product_name;
ALTER TABLE order_has_products MODIFY product_name VARCHAR(255) NOT NULL;
ALTER TABLE orders ADD UNIQUE KEY uq_orders_order_code (order_code);
CREATE TABLE order_delivery_snapshots (
  order_id INT UNSIGNED NOT NULL,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address VARCHAR(500) NOT NULL,
  city VARCHAR(100) NOT NULL,
  province VARCHAR(100) NOT NULL,
  postal_code CHAR(5) NOT NULL,
  PRIMARY KEY (order_id),
  CONSTRAINT fk_order_delivery_order FOREIGN KEY (order_id)
    REFERENCES orders(order_id)
);
~~~

Down drops the delivery table, unique key, then product_name. Model tags map exact column names and do not expose audit internals.

- [ ] **Step 4: Verify and commit**

~~~powershell
go test ./migrations -run TestOrderSnapshotMigration -v
go test ./model/... ./...
git add migrations model/database_models
git commit -m "feat: add immutable order snapshots"
~~~

---

### Task 2: Implement atomic Member order creation

**Files:**
- Replace: project_intern1/model/orders_model/request_orders.go
- Replace: project_intern1/model/orders_model/response_orders.go
- Create: project_intern1/internal/ordercode/generator.go
- Create: project_intern1/internal/ordercode/generator_test.go
- Create: project_intern1/usecase/order_usecase/service.go
- Create: project_intern1/usecase/order_usecase/service_test.go
- Replace: project_intern1/repository/order_repository/create_order.go
- Create: project_intern1/repository/order_repository/create_order_integration_test.go

**Interfaces:**
- CreateOrderRequest contains Items []OrderItemInput and Delivery DeliveryInput.
- Service.Create(context.Context, memberID int, request CreateOrderRequest) (Order, error).
- Sentinel errors: ErrInvalidOrder, ErrInsufficientStock, ErrProductNotFound.
- Order code format is GA- followed by 24 uppercase hexadecimal characters generated from crypto/rand; database uniqueness is authoritative.

- [ ] **Step 1: Define request/response contracts and RED service tests**

Use:

~~~go
type OrderItemInput struct {
	ProductID int `json:"product_id"`
	Amount int `json:"amount"`
}

type DeliveryInput struct {
	Email, FirstName, LastName, Phone, Address, City, Province, PostalCode string
}

type CreateOrderRequest struct {
	Items []OrderItemInput `json:"items"`
	Delivery DeliveryInput `json:"delivery"`
}
~~~

Add JSON tags matching the spec. Tests reject empty items, non-positive IDs/amounts, overflow, invalid email/Thai phone/postal code, and blank address fields. Prove duplicate product IDs combine:

~~~go
request.Items = []OrderItemInput{{ProductID: 7, Amount: 1}, {ProductID: 7, Amount: 2}}
require.NoError(t, service.Create(ctx, 12, request))
assert.Equal(t, []OrderItemInput{{ProductID: 7, Amount: 3}}, repo.received.Items)
~~~

- [ ] **Step 2: Verify RED**

~~~powershell
go test ./usecase/order_usecase ./internal/ordercode -v
~~~

Expected: FAIL because new contracts/service/generator do not exist.

- [ ] **Step 3: Implement validation and deterministic generator tests**

Generator accepts io.Reader for tests and production uses crypto/rand.Reader. Test literal bytes produce a literal GA- code and short reads return error. Service normalizes delivery strings and calls repository once.

- [ ] **Step 4: Write RED MySQL transaction tests**

Against disposable Docker MySQL, create real member/category/products and prove:

1. Product name/unit price are snapshots from DB, not request.
2. Stock decrements by combined quantity.
3. Total amount/price are server-calculated.
4. Delivery row matches request.
5. Insufficient stock rolls back order, lines, delivery, and all stock.
6. Missing/deleted product rolls back.
7. Two concurrent final-unit orders produce one success and one ErrInsufficientStock.
8. Generated order_code is unique.

- [ ] **Step 5: Implement transaction**

Inside db.Transaction, generate code, create Pending order, then for each normalized item:

~~~go
result := tx.Model(&database_models.Products{}).
	Where("product_id = ? AND deleted_at IS NULL AND stock_quantity >= ?", id, amount).
	UpdateColumn("stock_quantity", gorm.Expr("stock_quantity - ?", amount))
if result.Error != nil { return result.Error }
if result.RowsAffected != 1 { return order_usecase.ErrInsufficientStock }
~~~

Read the now-locked row's name/price, insert order line snapshot, accumulate totals using the database DECIMAL-compatible representation, insert delivery, and update totals. Return any error so GORM rolls back. Remove the arbitrary total-amount-over-5 rejection unless a documented business rule replaces it.

- [ ] **Step 6: Verify and commit**

~~~powershell
go test ./internal/ordercode ./usecase/order_usecase -v
go test ./repository/order_repository -run TestCreateOrder -v
go test ./...
git add model/orders_model internal/ordercode usecase/order_usecase repository/order_repository
git commit -m "feat: create stock-safe member orders"
~~~

---

### Task 3: Add Member history and Admin fulfillment services/APIs

**Files:**
- Replace: project_intern1/repository/order_repository/find_order.go
- Create: project_intern1/repository/order_repository/orders_test.go
- Replace: project_intern1/handlers/order_handlers/add_order.go
- Replace: project_intern1/handlers/order_handlers/get_orders.go
- Create: project_intern1/handlers/order_handlers/orders_test.go
- Create: project_intern1/usecase/admin_order_usecase/service.go
- Create: project_intern1/usecase/admin_order_usecase/service_test.go
- Replace: project_intern1/repository/admin_repository/find_orders.go
- Replace: project_intern1/repository/admin_repository/update_order.go
- Create: project_intern1/repository/admin_repository/orders_integration_test.go
- Replace: project_intern1/handlers/admin_hadlers/get_orders.go
- Replace: project_intern1/handlers/admin_hadlers/edit_order.go
- Create: project_intern1/handlers/admin_hadlers/orders_test.go
- Modify: project_intern1/routes/order_routes.go
- Modify: project_intern1/routes/admin_routes.go

**Interfaces:**
- GET /api/v1/orders returns only token member's paginated orders.
- GET /api/v1/admin/orders supports page, limit, q, member_id, status.
- GET /api/v1/admin/orders/:id returns one full order.
- PATCH /api/v1/admin/orders/:id/status accepts { status: Processing|Completed|Cancelled }.
- Sentinels: ErrInvalidFilter, ErrOrderNotFound, ErrInvalidTransition, ErrOrderConflict.

- [ ] **Step 1: Write RED Member ownership tests**

Handler tests inject Member ID 12 through claims and assert repository receives 12 regardless of query/body. Repository tests prove delivery/line snapshots are returned, deleted/edited products do not change history, and Member 12 cannot read Member 13.

- [ ] **Step 2: Write RED state-machine and transaction tests**

Service table:

~~~text
Pending    -> Processing PASS
Pending    -> Cancelled  PASS
Processing -> Completed  PASS
Processing -> Cancelled  PASS
Completed  -> any        ErrInvalidTransition
Cancelled  -> any        ErrInvalidTransition
~~~

Integration tests run two concurrent cancellations and assert one succeeds, one conflicts, and stock restores once. Completion never restores stock.

- [ ] **Step 3: Verify RED**

~~~powershell
go test ./usecase/admin_order_usecase ./repository/order_repository ./repository/admin_repository ./handlers/order_handlers ./handlers/admin_hadlers -v
~~~

Expected: FAIL because services/contracts are absent.

- [ ] **Step 4: Implement repositories/services/handlers**

Use bounded defaults page=1, limit=20 and maximum 100. Search q matches order_code; member_id is positive; status is one approved name. Return empty arrays, never null.

Status update transaction first conditionally updates current non-terminal status. On Cancelled, sum each line quantity and increment each referenced product row inside the same transaction, using an unscoped ID lookup so a soft-deleted product also receives its stock restoration. A physically missing product fails and rolls back cancellation. If conditional status update affects zero rows, return not-found or invalid-transition after reading current status.

Map invalid -> 400, not found -> 404, transition/conflict -> 409, unexpected -> 500. Unauthorized/forbidden remain middleware-owned.

- [ ] **Step 5: Verify and commit**

~~~powershell
go test ./usecase/admin_order_usecase ./repository/order_repository ./repository/admin_repository ./handlers/order_handlers ./handlers/admin_hadlers ./routes -v
go test ./...
go vet ./...
git add model/orders_model usecase repository/order_repository repository/admin_repository handlers/order_handlers handlers/admin_hadlers routes
git commit -m "feat: manage member order fulfillment"
~~~

---

### Task 4: Add Storefront order BFF and typed services

**Files:**
- Create: Storefront/src/app/api/orders/route.ts
- Create: Storefront/src/app/api/orders/orders-route.test.ts
- Create: Storefront/src/app/api/admin/orders/route.ts
- Create: Storefront/src/app/api/admin/orders/[id]/route.ts
- Create: Storefront/src/app/api/admin/orders/[id]/status/route.ts
- Create: Storefront/src/app/api/admin/orders/admin-order-routes.test.ts
- Replace: Storefront/src/features/orders/order-service.ts
- Replace: Storefront/src/features/orders/order-service.test.ts
- Create: Storefront/src/features/orders/types.ts
- Create: Storefront/src/features/orders/admin-order-service.ts
- Create: Storefront/src/features/orders/admin-order-service.test.ts

**Interfaces:**
- createOrder(request: CreateOrderRequest): Promise<Order>; no token parameter.
- listMemberOrders(page?: number): Promise<OrderPage>.
- adminOrderService.list/get/updateStatus.
- BFF returns 401/403/409 codes without exposing Go token/error details.

- [ ] **Step 1: Write RED route/service tests**

Assert create order reads cookie server-side, forwards exact items/delivery shape, and clears no cart itself. Missing cookie -> 401. Admin order routes require Plan 2 Admin session. Client services call same-origin /api routes without Authorization header.

- [ ] **Step 2: Verify RED**

~~~powershell
npm test -- src/app/api/orders src/app/api/admin/orders src/features/orders
~~~

Expected: FAIL because routes/new services do not exist.

- [ ] **Step 3: Implement thin BFF and adapters**

Reuse backendRequest, authenticatedBackendRequest, origin guard, cookie helper, and admin guard. Do not duplicate response parsing. Map snake-case DTOs in one adapter and keep UI camel-case.

- [ ] **Step 4: Verify and commit**

~~~powershell
npm test -- src/app/api/orders src/app/api/admin/orders src/features/orders
npm run type-check
git add src/app/api/orders src/app/api/admin/orders src/features/orders
git commit -m "feat: connect authenticated order APIs"
~~~

---

### Task 5: Make Checkout login-required and preserve its draft

**Files:**
- Create: Storefront/src/features/checkout/checkout-draft.ts
- Create: Storefront/src/features/checkout/checkout-draft.test.ts
- Modify: Storefront/src/app/checkout/components/CheckoutContent.tsx
- Modify: Storefront/src/app/checkout/components/CheckoutContent.test.tsx
- Modify: Storefront/src/features/i18n/messages.ts

**Interfaces:**
- saveCheckoutDraft(form), loadCheckoutDraft(), clearCheckoutDraft() use sessionStorage key gadget-arena-checkout-draft.
- Checkout uses AuthContext and createOrder(request); no localStorage token.

- [ ] **Step 1: Write RED draft/auth/order tests**

Prove draft serialization contains delivery fields only, never password/token; invalid JSON is discarded; success clears draft/cart; API error keeps both; anonymous submit saves draft and navigates to /login?returnTo=/checkout; restored checkout loads draft after login.

Assert create payload contains item IDs/amounts plus validated delivery. Assert 401 refreshes auth and returns to login; 409 shows localized stock conflict.

- [ ] **Step 2: Verify RED**

~~~powershell
npm test -- src/features/checkout src/app/checkout/components/CheckoutContent.test.tsx
~~~

Expected: FAIL because draft helper and auth gate do not exist.

- [ ] **Step 3: Implement minimal flow**

Remove byteforge-token lookup. Keep browse/cart guest behavior. Save only validated delivery immediately before redirect. On authenticated success clear cart and draft. Copy states explicitly say no online payment and no delivery fee.

- [ ] **Step 4: Verify and commit**

~~~powershell
npm test -- src/features/checkout src/app/checkout/components/CheckoutContent.test.tsx
npm run type-check
git add src/features/checkout src/app/checkout src/features/i18n/messages.ts
git commit -m "feat: require login for order submission"
~~~

---

### Task 6: Add Member history and Admin order UI

**Files:**
- Create: Storefront/src/app/account/orders/page.tsx
- Create: Storefront/src/app/account/orders/components/OrderHistory.tsx
- Create: Storefront/src/app/account/orders/components/OrderHistory.test.tsx
- Create: Storefront/src/app/admin/orders/page.tsx
- Create: Storefront/src/app/admin/orders/components/OrderManager.tsx
- Create: Storefront/src/app/admin/orders/components/OrderManager.test.tsx
- Modify: Storefront/src/components/Header.tsx
- Modify: Storefront/src/components/Header.test.tsx
- Modify: Storefront/src/features/i18n/messages.ts

**Interfaces:**
- OrderHistory consumes listMemberOrders and renders only returned Member records.
- OrderManager consumes adminOrderService and only offers transitions returned by local state-machine helper matching backend rules.

- [ ] **Step 1: Write RED Member/Admin UI tests**

Member tests cover loading, empty, order lines, totals, delivery snapshot, statuses, pagination, 401 redirect, and EN/TH. Admin tests cover filters, detail, allowed transition buttons, confirmation, pending lock, conflict refetch, and terminal states with no action.

- [ ] **Step 2: Verify RED**

~~~powershell
npm test -- src/app/account/orders src/app/admin/orders src/components/Header.test.tsx
~~~

Expected: FAIL because pages/managers do not exist.

- [ ] **Step 3: Implement UI**

Use accessible tables on desktop and labeled cards on narrow screens. Format THB with the existing th-TH formatter. Never recompute historical total from current products. After status mutation replace/refetch the canonical backend order.

- [ ] **Step 4: Verify and commit**

~~~powershell
npm test -- src/app/account/orders src/app/admin/orders src/components/Header.test.tsx
npm test
npm run type-check
npm run build
git add src/app/account/orders src/app/admin/orders src/components/Header* src/features/i18n/messages.ts
git commit -m "feat: add order history and fulfillment UI"
~~~

---

### Task 7: Full-stack order verification and docs

**Files:**
- Modify: Storefront/README.md
- Modify: project_intern1/README.md

- [ ] **Step 1: Run all automated/migration checks**

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

- [ ] **Step 2: Run real fulfillment smoke**

Register/login Member; add product; submit order with delivery; confirm stock decreases and Member history matches snapshot. Login Admin; move Pending -> Processing -> Completed; confirm Member sees updates. Create another order, cancel it, confirm stock restores once. Attempt terminal transition and insufficient-stock order; confirm 409 and no partial rows.

- [ ] **Step 3: Update docs and commit**

Document payloads, snapshot semantics, status machine, stock/cancellation behavior, no-payment copy, and troubleshooting.

~~~powershell
# Backend
git add README.md
git commit -m "docs: describe transactional order flow"

# Storefront
git add README.md
git commit -m "docs: describe authenticated checkout"
~~~

Do not push until review passes.

## Phase 3 Completion Gate

- Authenticated checkout creates real transactional orders.
- Delivery/product/price snapshots are immutable.
- Member history is ownership-safe.
- Admin fulfillment and one-time cancellation stock restore work.
- Automated and real MySQL checks pass.
- Review and push test branches before Plan 4.
