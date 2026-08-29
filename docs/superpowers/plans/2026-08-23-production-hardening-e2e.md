# Gadget Arena Production Hardening and End-to-End Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Remove demo-only production behavior, close known security/dependency gaps, package the services for deployment, and verify complete Member/Admin commerce flows against real Go/MySQL infrastructure.

**Architecture:** Route all browser API traffic through the same-origin Next.js BFF and make production API failure explicit. Harden Go configuration/middleware and Next headers/dependencies, package Go as a non-root container, then run Playwright and CI against disposable MySQL.

**Tech Stack:** Go 1.24, Echo 4, GORM/MySQL 8.4, Docker, Next.js 15.5.23, React 19, TypeScript, Vitest, Playwright 1.62.1, GitHub Actions

**Spec:** docs/superpowers/specs/2026-08-23-auth-admin-commerce-mvp-design.md

## Global Constraints

- Plans 1-3 are complete and reviewed before this plan starts.
- Production uses API inventory only and never silently substitutes fixtures.
- Fixture catalog mode is explicit and limited to development/test.
- Browser code calls same-origin BFF routes; BACKEND_API_URL remains server-only.
- Production Go CORS never uses wildcard origin/header/method configuration.
- Login is rate limited and never logs credentials/tokens.
- Production source maps are disabled unless uploaded privately to an error service.
- npm audit --omit=dev must report zero high/critical findings.
- E2E uses real Go API and disposable MySQL, not mocked auth/order services.
- No secret or real credential is committed, printed, copied into an image, or placed in NEXT_PUBLIC variables.
- Work only on test branches; do not merge main or open a pull request.

---

### Task 1: Move public catalog traffic behind the BFF and make production truthful

**Files:**
- Create: Storefront/src/app/api/catalog/categories/route.ts
- Create: Storefront/src/app/api/catalog/products/route.ts
- Create: Storefront/src/app/api/catalog/catalog-routes.test.ts
- Modify: Storefront/src/features/catalog/api-catalog-service.ts
- Modify: Storefront/src/features/catalog/catalog-service.ts
- Modify: Storefront/src/features/catalog/catalog-service.test.ts
- Modify: Storefront/src/components/ui/StatusMessage.tsx
- Modify: Storefront/src/app/components/HomeCatalog.tsx
- Modify: Storefront/src/app/components/HomeCatalog.test.tsx
- Modify: Storefront/src/app/products/components/ProductsContent.tsx
- Modify: Storefront/src/app/products/components/ProductsContent.test.tsx
- Modify: Storefront/.env.example
- Modify: Storefront/README.md

**Interfaces:**
- GET /api/catalog/categories proxies Go /api/v1/categories.
- GET /api/catalog/products forwards only approved q/category_id/brand/max_price/in_stock/page/limit/sort.
- CATALOG_DATA_MODE is exactly api or fixture; production requires api.
- CatalogUnavailableError drives localized unavailable/retry UI.

- [ ] **Step 1: Write RED BFF and UI tests**

Route tests set CATALOG_DATA_MODE=api and prove backend 503/timeout returns normalized 503 catalog_unavailable, not fixture JSON. In fixture mode, prove deterministic fixtures are returned without backend fetch. Reject unknown mode and production fixture mode.

UI tests assert a configured production failure renders localized Catalog temporarily unavailable with Retry and does not render fixture product names.

- [ ] **Step 2: Verify RED**

~~~powershell
npm test -- src/app/api/catalog src/features/catalog src/app/components/HomeCatalog.test.tsx src/app/products/components/ProductsContent.test.tsx
~~~

Expected: FAIL because catalog still calls public Go URL and silently falls back.

- [ ] **Step 3: Implement BFF and explicit mode**

BFF uses backendRequest and validates/forwards only allowlisted query parameters. Client API adapter base is same-origin /api/catalog. fixtureCatalogService is selected only when BFF explicitly reports development fixture mode; network/503 in api mode throws CatalogUnavailableError.

Track examples:

~~~dotenv
BACKEND_API_URL=http://localhost:1323
CATALOG_DATA_MODE=api
NEXT_PUBLIC_SITE_URL=http://localhost:4028
~~~

No NEXT_PUBLIC_API_URL remains.

- [ ] **Step 4: Verify and commit**

~~~powershell
npm test -- src/app/api/catalog src/features/catalog src/app/components/HomeCatalog.test.tsx src/app/products/components/ProductsContent.test.tsx
npm test
npm run type-check
git add src/app/api/catalog src/features/catalog src/components/ui/StatusMessage.tsx src/app/components/HomeCatalog* src/app/products/components/ProductsContent* .env.example README.md
git commit -m "fix: make production catalog failures truthful"
~~~

---

### Task 2: Harden backend CORS, auth throttling, errors, and logs

**Files:**
- Modify: project_intern1/config/config.go
- Modify: project_intern1/config/config_test.go
- Replace: project_intern1/middlewares/midlewares.go
- Create: project_intern1/middlewares/cors_test.go
- Create: project_intern1/middlewares/login_rate_limiter.go
- Create: project_intern1/middlewares/login_rate_limiter_test.go
- Modify: project_intern1/routes/authen_routes.go
- Modify: project_intern1/routes/routes.go
- Modify: project_intern1/logs/init.go
- Modify: project_intern1/.env.example
- Modify: project_intern1/config/config.example.yml

**Interfaces:**
- CORS_ALLOWED_ORIGINS is a comma-separated allowlist; local default is http://localhost:4028.
- AUTH_LOGIN_ATTEMPTS default 5 and AUTH_LOGIN_WINDOW default 1m.
- Login limiter returns 429 code rate_limited per client IP without reading/logging passwords.
- API errors retain stable code and no internal detail.

- [ ] **Step 1: Write RED config/CORS tests**

Prove defaults, trimming/deduplication, wildcard rejection in production, exact allowed Origin response, disallowed origin without allow header, and OPTIONS behavior limited to Content-Type/Authorization plus GET/POST/PUT/PATCH/DELETE/OPTIONS.

- [ ] **Step 2: Write RED deterministic limiter tests**

Inject a fake clock. Five attempts in one minute pass; sixth returns 429; next window passes; keys expire from memory. Use RemoteAddr/IP only so middleware never parses/logs credential bodies.

~~~go
limiter := NewLoginRateLimiter(5, time.Minute, fakeClock.Now)
~~~

- [ ] **Step 3: Verify RED**

~~~powershell
go test ./config ./middlewares ./routes -run 'Test(CORS|LoginRate|ReadConfig)' -v
~~~

Expected: FAIL because allowlist/rate limiter are absent.

- [ ] **Step 4: Implement hardening**

Parse env values with strict positive bounds. Attach limiter only to POST /login. Replace fmt.Println/log.Println of claims/order token data with request-safe structured context (route, status, request ID); never log token claims or database Debug SQL in production. Keep Recover/Gzip and add Echo Secure middleware for nosniff/frame/referrer headers.

- [ ] **Step 5: Verify and commit**

~~~powershell
go test ./config ./middlewares ./routes -v
go test ./...
go vet ./...
git add config middlewares routes logs .env.example
git commit -m "fix: harden backend HTTP boundaries"
~~~

---

### Task 3: Resolve frontend dependency and build warnings

**Files:**
- Modify: Storefront/package.json
- Modify: Storefront/package-lock.json
- Modify: Storefront/next.config.mjs
- Modify: Storefront/src/components/ui/AppIcon.tsx
- Modify: Storefront/src/components/ui/AppImage.tsx
- Create/Modify: Storefront/src/components/ui/AppIcon.test.tsx
- Modify: Storefront/src/components/ui/AppImage.test.tsx

**Interfaces:**
- Next is exactly 15.5.23 and eslint-config-next is 15.5.23.
- PostCSS is exactly 8.5.26.
- Production browser source maps are false.
- AppIcon/AppImage expose typed props without any index signature.

- [ ] **Step 1: Capture RED audit/build evidence**

~~~powershell
npm audit --omit=dev
npm run build
~~~

Expected: audit reports current high findings for next/postcss/sharp; build reports no-explicit-any and alt warnings.

- [ ] **Step 2: Update packages without force**

~~~powershell
npm install next@15.5.23 postcss@8.5.26
npm install --save-dev eslint-config-next@15.5.23
npm audit --omit=dev
~~~

Expected: lockfile contains reviewed non-major updates and audit has zero high/critical. Do not use npm audit fix --force.

- [ ] **Step 3: Add RED prop tests and remove warnings**

Tests pass native image/icon props such as aria-hidden, data-testid, title, className, and required alt through the wrapper. Replace any with React.ComponentProps-based intersections and ensure every rendered Image receives alt. Set productionBrowserSourceMaps false.

- [ ] **Step 4: Verify and commit**

~~~powershell
npm test -- src/components/ui
npm test
npm run type-check
npm run build
npm audit --omit=dev
git add package.json package-lock.json next.config.mjs src/components/ui
git commit -m "fix: close production frontend warnings"
~~~

Expected: all exit 0, zero high/critical audit, and no previous any/alt warnings.

---

### Task 4: Package backend and document production configuration/migrations

**Files:**
- Create: project_intern1/Dockerfile
- Create: project_intern1/.dockerignore
- Create: project_intern1/cmd/check-config/main.go
- Create: project_intern1/cmd/check-config/main_test.go
- Modify: project_intern1/README.md
- Modify: Storefront/README.md

**Interfaces:**
- Docker image runs compiled API as non-root, contains no .env/config keys/docs/worktrees.
- check-config exits non-zero if DB/JWT/TTL/origin settings are missing/unsafe.
- /health remains container health endpoint.

- [ ] **Step 1: Write RED config-check tests**

Table-test production inputs: missing DB value, localhost DB in production, missing RSA key, wildcard origin, non-HTTPS Storefront origin, invalid TTL, and valid config. Assert errors name variables but never values.

- [ ] **Step 2: Verify RED**

~~~powershell
go test ./cmd/check-config -v
~~~

Expected: compile failure because command does not exist.

- [ ] **Step 3: Implement multi-stage non-root image and checker**

Dockerfile stages: golang:1.24 build with CGO_ENABLED=0, then minimal non-root runtime. Copy only API binary and required CA certificates; mount/inject JWT keys at runtime. Add HEALTHCHECK against /health using a tool present in the runtime or platform health configuration if using scratch/distroless.

.dockerignore includes .git, .worktrees, .env*, config/keys, logs, docs, and local binaries.

- [ ] **Step 4: Verify image contents and runtime**

~~~powershell
docker build -t gadget-arena-api:local .
docker history --no-trunc gadget-arena-api:local
docker run --rm gadget-arena-api:local
~~~

Expected: build succeeds; history contains no secret values; missing runtime config exits safely without printing values. Then run with local Docker-network DB and mounted development keys, and verify /health.

- [ ] **Step 5: Document migration/deploy/rollback sequence**

Document: database backup; apply versioned up SQL in numeric order to staging; run check-config; deploy API; verify /health; deploy Storefront with BACKEND_API_URL/CATALOG_DATA_MODE=api/NEXT_PUBLIC_SITE_URL; run smoke; rollback app image first and matching down SQL only after backup/review. Do not prescribe a vendor or embed credentials.

- [ ] **Step 6: Commit**

~~~powershell
# Backend
git add Dockerfile .dockerignore cmd/check-config README.md
git commit -m "build: package backend for production"

# Storefront
git add README.md
git commit -m "docs: add storefront deployment checklist"
~~~

---

### Task 5: Add real full-stack Playwright coverage

**Files:**
- Modify: Storefront/package.json
- Modify: Storefront/package-lock.json
- Create: Storefront/playwright.config.ts
- Create: Storefront/e2e/helpers/api.ts
- Create: Storefront/e2e/helpers/database.ts
- Create: Storefront/e2e/member-order.spec.ts
- Create: Storefront/e2e/admin-catalog.spec.ts
- Create: Storefront/e2e/admin-fulfillment.spec.ts
- Create: Storefront/e2e/session-expiry.spec.ts
- Create: Storefront/e2e/stock-conflict.spec.ts
- Modify: Storefront/.gitignore

**Interfaces:**
- npm run test:e2e executes all five specs.
- E2E database reset targets only explicit local gadget_arena_e2e on 127.0.0.1.
- Tests start/consume real Storefront, Go API, and MySQL.

- [ ] **Step 1: Install pinned Playwright and add failing first flow**

~~~powershell
npm install --save-dev @playwright/test@1.62.1
npx playwright install chromium
~~~

Configure baseURL http://127.0.0.1:4028, one worker for DB-mutating specs, screenshot/trace on first retry, and forbidOnly in CI.

Write member-order.spec.ts: register unique Member, add known seeded item, start checkout, login return, submit delivery, and assert order appears in Member history. Run before orchestration and confirm RED because services/fixture are unavailable.

- [ ] **Step 2: Add explicit disposable DB orchestration**

Helper refuses any database name except gadget_arena_e2e and any host except 127.0.0.1/localhost. Apply 0000-0002 migrations, development catalog seed, and create Admin through safe bootstrap. Never call docker compose down -v against the developer gadget_arena volume.

- [ ] **Step 3: Add remaining E2E flows**

Implement exact spec flows:
1. Admin creates/edits/deletes category/product and public catalog updates.
2. Admin Pending -> Processing -> Completed and Member observes status.
3. Expired/invalid cookie redirects to login and preserves cart.
4. Two competing final-stock submissions produce one order, one conflict, non-negative stock.

- [ ] **Step 4: Verify and commit**

~~~powershell
npm run test:e2e
npm test
npm run type-check
npm run build
git add package.json package-lock.json playwright.config.ts e2e .gitignore
git commit -m "test: cover full-stack commerce flows"
~~~

Expected: all E2E and frontend checks pass against disposable infrastructure.

---

### Task 6: Add CI, secret scanning, and final release evidence

**Files:**
- Create: Storefront/.github/workflows/ci.yml
- Create: project_intern1/.github/workflows/ci.yml
- Modify: Storefront/README.md
- Modify: project_intern1/README.md

**Interfaces:**
- Frontend CI runs npm ci, unit tests, type-check, build, audit, and E2E.
- Backend CI runs go test, go vet, migration tests, and container build.
- Secret scan uses redacted output and fails on verified findings.

- [ ] **Step 1: Add CI workflows**

Pin action major versions, use npm ci, Go 1.24.2, Node 22, and MySQL 8.4 service. Cache package/go downloads only, never .env/JWT keys. Generate temporary test keys inside CI. E2E job starts API/Storefront after health checks, not fixed sleeps.

- [ ] **Step 2: Run local equivalent release gate**

~~~powershell
# Backend
go test ./...
go vet ./...
docker build -t gadget-arena-api:release-check .

# Storefront
npm ci
npm test
npm run type-check
npm run build
npm audit --omit=dev
npm run test:e2e
~~~

Expected: every command exits 0; audit zero high/critical.

- [ ] **Step 3: Scan tracked content/history with redaction**

Run this pinned scanner from each repository root:

~~~powershell
docker run --rm -v "${PWD}:/repo" ghcr.io/gitleaks/gitleaks:v8.30.1 git --redact --no-banner /repo
~~~

Expected: exit 0 with no verified secret. If a real historic credential/key is found, do not reproduce it in notes or chat; record only file path/type, rotate the credential, and clean history only with explicit user approval and a coordinated force-push plan.

- [ ] **Step 4: Verify clean diffs and commit workflows/docs**

~~~powershell
git diff --check
git status --short
~~~

Commit separately:

~~~powershell
git add .github/workflows/ci.yml README.md
git commit -m "ci: verify production commerce release"
~~~

Run the command in each repository. Do not push until final review approves both complete plan diffs.

## Phase 4 Completion Gate

- Production catalog cannot masquerade fixtures as inventory.
- Backend HTTP boundaries, logs, rate limiting, and config are hardened.
- Frontend audit has zero high/critical and build warnings are resolved.
- Backend image/config/migration rollback are deployable without bundled secrets.
- Five real full-stack E2E flows pass.
- CI and final local release gate pass in both repositories.
- After review, push test branches; merge main only with explicit approval.
