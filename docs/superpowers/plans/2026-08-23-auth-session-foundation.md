# Gadget Arena Authentication and Session Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Deliver secure Member/Admin authentication through a Next.js BFF and HttpOnly cookie, including member-only registration, session restoration, logout, and administrator bootstrap.

**Architecture:** Refactor the Go auth path into injected repository/service/handler units following the existing product-service pattern. Next.js route handlers call the Go API through a server-only client and own the JWT cookie; React consumes only a safe session DTO through an AuthProvider.

**Tech Stack:** Go 1.24, Echo 4, GORM/MySQL, RS256 JWT, Next.js 15, React 19, TypeScript, Vitest, Testing Library

**Spec:** docs/superpowers/specs/2026-08-23-auth-admin-commerce-mvp-design.md

## Global Constraints

- Public registration always creates permission ID 2 and accepts no permission or audit fields.
- The first administrator is created only through a backend command; no default administrator is seeded.
- The browser never receives or reads the Go access token.
- The session cookie is gadget_arena_session, HttpOnly, SameSite=Lax, Path=/, and Secure in production.
- BACKEND_API_URL is server-only; no auth request uses NEXT_PUBLIC_API_URL.
- Invalid credentials return one generic HTTP 401 result; malformed input returns 400; duplicates return 409.
- JWT lifetime comes from JWT_ACCESS_TTL, with a development default of exactly 2h.
- This phase adds no refresh token, password reset, email verification, social login, or profile editing.
- English remains the default language and Thai remains selectable.
- Work only on branch test in each repository; do not merge main or open a pull request.

---

## Preflight: Verify both isolated worktrees

**Storefront:** C:/Users/akebu/Documents/Codex/2026-08-06/new-chat-2/work/Storefront/.worktrees/Storefront

**Backend:** C:/Users/akebu/Documents/Codex/2026-08-06/new-chat-2/work/project_intern1/.worktrees/catalog-api

- [ ] **Step 1: Confirm clean test branches and isolated Git dirs**

Run in each worktree:

~~~powershell
git rev-parse --git-dir
git rev-parse --git-common-dir
git branch --show-current
git status --short
~~~

Expected: Git dir differs from common dir, branch is test, and status is clean. Storefront may initially contain only the approved documentation commits.

- [ ] **Step 2: Verify baselines**

~~~powershell
# Storefront
npm test
npm run type-check

# Backend
go test ./...
go vet ./...
~~~

Expected: all commands exit 0 before production changes.

---

### Task 1: Define and test the backend authentication service

**Files:**
- Modify: project_intern1/model/authentication.go
- Create: project_intern1/usecase/auth_usecase/service.go
- Create: project_intern1/usecase/auth_usecase/service_test.go
- Modify: project_intern1/utility/hash_password.go
- Modify: project_intern1/utility/compare_password.go
- Delete after replacement: project_intern1/usecase/auth_usecase/login.go
- Delete after replacement: project_intern1/usecase/auth_usecase/register.go

**Interfaces:**
- Produces: Service.Register(context.Context, model.RegisterRequest) error.
- Produces: Service.Login(context.Context, model.LoginRequest) (model.LoginResult, error).
- Produces sentinel errors ErrInvalidInput, ErrConflict, and ErrInvalidCredentials.
- Consumes a Repository, PasswordCodec, and TokenIssuer defined below.

- [ ] **Step 1: Replace transport models with server-owned auth DTOs**

Define these exact contracts in model/authentication.go:

~~~go
type RegisterRequest struct {
	Username  string `json:"username"`
	Password  string `json:"password"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Phone     string `json:"phone"`
	Email     string `json:"email"`
	BirthDate string `json:"birth_date"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type NewMember struct {
	Username, PasswordHash, FirstName, LastName, Phone, Email, BirthDate string
	PermissionID int
}

type AuthMember struct {
	MemberID int
	Username, PasswordHash, FirstName, PermissionName, ProfileImage string
	PermissionID int
}

type SessionUser struct {
	MemberID       int    `json:"member_id"`
	Username       string `json:"username"`
	FirstName      string `json:"first_name"`
	PermissionID   int    `json:"permission_id"`
	PermissionName string `json:"permission_name"`
	ProfileImage   string `json:"profile_image,omitempty"`
}

type LoginResult struct {
	AccessToken string      `json:"access_token"`
	ExpiresAt   int64       `json:"expires_at"`
	User        SessionUser `json:"user"`
}
~~~

Remove permission_id, timestamps, and audit fields from the public registration type. Keep TokenClaim compatible until Task 3.

- [ ] **Step 2: Write failing service tests**

The service uses these exact interfaces:

~~~go
type Repository interface {
	FindByUsername(context.Context, string) (model.AuthMember, error)
	EmailExists(context.Context, string) (bool, error)
	CreateMember(context.Context, model.NewMember) error
}

type PasswordCodec interface {
	Hash(string) (string, error)
	Compare(hash, plain string) bool
}

type TokenIssuer interface {
	Issue(model.SessionUser) (string, time.Time, error)
}
~~~

Add tests proving role ownership and generic credentials:

~~~go
func TestRegisterAlwaysCreatesMemberRole(t *testing.T) {
	repo := &fakeAuthRepo{}
	service := New(repo, fakePasswords{}, fakeTokens{})
	err := service.Register(context.Background(), model.RegisterRequest{
		Username: "buyer", Password: "correct-horse-123", FirstName: "Buy",
		LastName: "Er", Phone: "0812345678", Email: "buyer@example.com",
		BirthDate: "2000-01-02",
	})
	require.NoError(t, err)
	assert.Equal(t, 2, repo.created.PermissionID)
}

func TestLoginUsesOneInvalidCredentialError(t *testing.T) {
	service := New(fakeAuthRepo{findErr: gorm.ErrRecordNotFound}, fakePasswords{}, fakeTokens{})
	_, err := service.Login(context.Background(), model.LoginRequest{
		Username: "missing", Password: "wrong",
	})
	assert.ErrorIs(t, err, ErrInvalidCredentials)
}
~~~

Also cover blank/trimmed fields, invalid email/phone/date, age under 7, password shorter than 12 characters, duplicate username, duplicate email, wrong password, token issuance failure, and exact SessionUser mapping.

- [ ] **Step 3: Run focused tests and verify RED**

~~~powershell
go test ./usecase/auth_usecase -run 'Test(Register|Login)' -v
~~~

Expected: compile failure because Service, DTOs, and interfaces do not exist.

- [ ] **Step 4: Implement the minimum service and password adapter**

Implement New(repository, passwords, tokens) *Service. Normalize username/email with strings.TrimSpace, validate approved fields, call PasswordCodec.Hash, and pass this exact role-owned value:

~~~go
member := model.NewMember{
	Username: username, PasswordHash: passwordHash,
	FirstName: firstName, LastName: lastName, Phone: phone,
	Email: email, BirthDate: birthDate, PermissionID: 2,
}
~~~

Login maps both not-found and password mismatch to ErrInvalidCredentials, builds SessionUser, and returns token plus expiresAt.Unix(). Adapt bcrypt utilities to return errors rather than swallowing them.

- [ ] **Step 5: Verify GREEN and commit**

~~~powershell
go test ./usecase/auth_usecase -v
git add model/authentication.go usecase/auth_usecase utility/hash_password.go utility/compare_password.go
git commit -m "refactor: secure authentication service"
~~~

---

### Task 2: Add injected auth persistence and correct HTTP contracts

**Files:**
- Create: project_intern1/repository/auth_repository/repository.go
- Create: project_intern1/repository/auth_repository/repository_test.go
- Replace: project_intern1/handlers/auth_handlers/login.go
- Replace: project_intern1/handlers/auth_handlers/register.go
- Create: project_intern1/handlers/auth_handlers/auth_test.go
- Modify: project_intern1/routes/authen_routes.go
- Modify: project_intern1/routes/routes.go
- Modify: project_intern1/model/response.go

**Interfaces:**
- Produces auth_repository.New(*gorm.DB) *Repository implementing Task 1.
- Produces auth_handlers.New(AuthService) *Handler with Register and Login methods.
- model.ReturnResponse gains optional Code string using JSON name code.

- [ ] **Step 1: Write repository and handler tests first**

Repository tests use go-sqlmock to assert normalized username lookup, email-existence query, and insert with permission ID 2. Handler tests use a fake service and verify:

~~~go
tests := []struct {
	name string
	err error
	wantStatus int
	wantCode string
}{
	{"invalid", auth_usecase.ErrInvalidInput, http.StatusBadRequest, "invalid_request"},
	{"duplicate", auth_usecase.ErrConflict, http.StatusConflict, "account_conflict"},
	{"credentials", auth_usecase.ErrInvalidCredentials, http.StatusUnauthorized, "invalid_credentials"},
	{"unexpected", errors.New("db down"), http.StatusInternalServerError, "internal_error"},
}
~~~

Assert invalid-credential responses contain only Invalid username or password and never submitted values, SQL details, or a user-not-found distinction.

- [ ] **Step 2: Verify RED**

~~~powershell
go test ./repository/auth_repository ./handlers/auth_handlers -v
~~~

Expected: FAIL because injected constructors and stable codes are absent.

- [ ] **Step 3: Implement repository and handler mapping**

Use WithContext(ctx) for every GORM call and translate duplicate-key errors to auth_usecase.ErrConflict. Bind request values, never pointers-to-pointers. Return model.ReturnResponse with Status, Code, Message, and optional Data. Log unexpected errors server-side without request bodies.

Wire AuthRoutes(group, authHandler) and construct repository -> service -> handler in Routes. Until Task 3 replaces token issuance, add a narrow `legacyTokenIssuer` adapter beside route wiring: map `SessionUser` to the existing `QueryLoginData`, call `utility.GenToken`, treat an empty token as an error, and convert the returned Unix value to `time.Time`. Mark its deletion explicitly in Task 3; do not change the browser contract twice.

- [ ] **Step 4: Verify and commit**

~~~powershell
go test ./repository/auth_repository ./handlers/auth_handlers ./routes -v
go test ./...
git add repository/auth_repository handlers/auth_handlers routes model/response.go
git commit -m "feat: expose safe authentication endpoints"
~~~

---

### Task 3: Make JWT lifetime configurable and expose current session

**Files:**
- Modify: project_intern1/config/config.go
- Modify: project_intern1/config/config_test.go
- Modify: project_intern1/model/authentication.go
- Replace: project_intern1/utility/gen_token.go
- Create: project_intern1/utility/gen_token_test.go
- Modify: project_intern1/utility/extract_user_form_token.go
- Modify: project_intern1/middlewares/midlewares.go
- Create: project_intern1/handlers/auth_handlers/session.go
- Modify: project_intern1/handlers/auth_handlers/auth_test.go
- Modify: project_intern1/routes/authen_routes.go
- Modify: project_intern1/.env.example
- Modify: project_intern1/config/config.example.yml

**Interfaces:**
- Produces utility.NewJWTIssuer(privateKey *rsa.PrivateKey, ttl time.Duration) *JWTIssuer.
- Produces JWTIssuer.Issue(model.SessionUser) (string, time.Time, error).
- Produces protected GET /api/v1/me.

- [ ] **Step 1: Add RED tests for TTL, claims, and /me**

Add config cases for absent JWT_ACCESS_TTL -> 2h, valid 45m, zero, negative, and malformed. Parse an issued token with the public key and assert:

~~~go
assert.Equal(t, user.MemberID, claims.MemberID)
assert.Equal(t, user.PermissionID, claims.PermissionID)
assert.WithinDuration(t, now.Add(2*time.Hour), claims.ExpiresAt.Time, time.Second)
~~~

Handler tests call /me with signed Member and Admin tokens and assert SessionUser fields with no token/password.

- [ ] **Step 2: Verify RED**

~~~powershell
go test ./config ./utility ./handlers/auth_handlers -run 'Test(JWT|Session|ReadConfig)' -v
~~~

Expected: FAIL because TTL parsing, issuer, and /me do not exist.

- [ ] **Step 3: Implement token issuance and session response**

Bind jwt.access_ttl to JWT_ACCESS_TTL, default 2h, parse with time.ParseDuration, and reject durations <= 0. Make signing errors return to Service. Remove the 9999-minute constant, formatted expiry, and Task 2 `legacyTokenIssuer`; wire `JWTIssuer` directly into the auth service.

Change `TokenClaim.MemberID` to `int` with JSON name `member_id`, keep `PermissionID` as `int`, and update `ExtractUserFormToken` plus all compiler-reported consumers to use the same integer type. This aligns session, order, and Admin actor IDs and removes string-to-int conversions from protected handlers.

GET /me reads validated TokenClaim, maps only SessionUser, and returns 200. Keep register/login public and attach setLogin to /me.

- [ ] **Step 4: Verify and commit**

~~~powershell
go test ./config ./utility ./handlers/auth_handlers ./middlewares ./routes -v
go test ./...
go vet ./...
git add config utility middlewares handlers/auth_handlers routes .env.example
git commit -m "feat: add expiring authenticated sessions"
~~~

---

### Task 4: Add a safe administrator bootstrap command

**Files:**
- Create: project_intern1/internal/adminbootstrap/service.go
- Create: project_intern1/internal/adminbootstrap/service_test.go
- Create: project_intern1/cmd/create-admin/main.go
- Modify: project_intern1/README.md

**Interfaces:**
- Produces adminbootstrap.Create(context.Context, *gorm.DB, adminbootstrap.Input) error.
- Consumes ADMIN_BOOTSTRAP_PASSWORD only from the command environment.

- [ ] **Step 1: Write RED tests for creation and refusal paths**

Test permission ID always 1; empty/default/short password rejected; duplicate Admin username idempotent only when already Admin; existing Member never silently promoted; no output contains password/hash.

~~~go
input := Input{
	Username: "store-admin", Password: "strong-admin-pass",
	Email: "admin@example.com",
}
require.NoError(t, Create(ctx, db, input))
assert.Equal(t, 1, stored.PermissionID)
~~~

- [ ] **Step 2: Verify RED**

~~~powershell
go test ./internal/adminbootstrap -v
~~~

Expected: compile failure because package does not exist.

- [ ] **Step 3: Implement the command**

Accept non-secret fields with flags -username, -first-name, -last-name, -email, -phone, -birth-date. Read password only from ADMIN_BOOTSTRAP_PASSWORD, require at least 12 characters, use normal config/database setup, and print only administrator ready.

Document deployment secret-manager or process-local environment use. Never accept password as a command-line flag and never commit Admin credentials.

- [ ] **Step 4: Verify and commit**

~~~powershell
go test ./internal/adminbootstrap ./cmd/create-admin
go vet ./...
git add internal/adminbootstrap cmd/create-admin README.md
git commit -m "feat: add explicit administrator bootstrap"
~~~

---

### Task 5: Build server-only backend client and auth BFF

**Files:**
- Create: Storefront/src/server/backend-client.ts
- Create: Storefront/src/server/backend-client.test.ts
- Create: Storefront/src/server/session-cookie.ts
- Create: Storefront/src/server/session-cookie.test.ts
- Create: Storefront/src/server/origin-guard.ts
- Create: Storefront/src/server/origin-guard.test.ts
- Create: Storefront/src/app/api/auth/login/route.ts
- Create: Storefront/src/app/api/auth/register/route.ts
- Create: Storefront/src/app/api/auth/logout/route.ts
- Create: Storefront/src/app/api/auth/session/route.ts
- Create: Storefront/src/app/api/auth/auth-routes.test.ts
- Modify: Storefront/.env.example

**Interfaces:**
- Produces backendRequest<T>(path: string, init?: RequestInit): Promise<T>.
- Produces authenticatedBackendRequest<T>(path: string, token: string, init?: RequestInit): Promise<T>.
- Produces sessionCookieOptions(maxAge: number) and assertSameOrigin(request: Request).
- Browser-facing auth routes never expose access_token.

- [ ] **Step 1: Write RED tests for URL safety, cookie flags, origin, and token stripping**

Stub BACKEND_API_URL=https://api.example.test/ and assert exact URL https://api.example.test/api/v1/login. Assert production options:

~~~ts
{
  httpOnly: true,
  sameSite: 'lax',
  secure: true,
  path: '/',
  maxAge: 7200,
}
~~~

Route tests mock next/headers cookie storage, return backend access_token, and assert browser JSON contains only user and expiresAt while cookie receives token. Add matching-origin, safe GET without Origin, and rejected cross-origin POST cases.

- [ ] **Step 2: Verify RED**

~~~powershell
npm test -- src/server src/app/api/auth/auth-routes.test.ts
~~~

Expected: FAIL because helpers/routes do not exist.

- [ ] **Step 3: Implement helpers and routes**

backend-client.ts reads process.env.BACKEND_API_URL, trims trailing slash, applies 5-second AbortSignal timeout, parses ReturnResponse, and throws BackendError(status, code, message). Authenticated calls add Bearer server-side.

Login computes maxAge from expires_at, sets gadget_arena_session, and strips token. Session reads cookie and calls /api/v1/me. Logout clears cookie with maxAge 0. Register forwards only seven approved fields.

Track safe examples:

~~~dotenv
BACKEND_API_URL=http://localhost:1323
NEXT_PUBLIC_SITE_URL=http://localhost:4028
~~~

- [ ] **Step 4: Verify and commit**

~~~powershell
npm test -- src/server src/app/api/auth/auth-routes.test.ts
npm run type-check
git add src/server src/app/api/auth .env.example
git commit -m "feat: add secure authentication BFF"
~~~

---

### Task 6: Add session state, auth pages, and role navigation

**Files:**
- Create: Storefront/src/features/auth/types.ts
- Create: Storefront/src/features/auth/AuthContext.tsx
- Create: Storefront/src/features/auth/AuthContext.test.tsx
- Create: Storefront/src/app/login/page.tsx
- Create: Storefront/src/app/login/components/LoginForm.tsx
- Create: Storefront/src/app/login/components/LoginForm.test.tsx
- Create: Storefront/src/app/register/page.tsx
- Create: Storefront/src/app/register/components/RegisterForm.tsx
- Create: Storefront/src/app/register/components/RegisterForm.test.tsx
- Modify: Storefront/src/app/layout.tsx
- Modify: Storefront/src/components/Header.tsx
- Modify: Storefront/src/components/Header.test.tsx
- Modify: Storefront/src/features/i18n/messages.ts

**Interfaces:**
- Produces useAuth() with status, user, login, register, logout, and refresh.
- status is exactly loading, authenticated, or anonymous.
- SessionUser.permissionId is 1 or 2; isAdmin means permissionId === 1.

- [ ] **Step 1: Write RED provider and form tests**

Provider tests prove restoration, 401 -> anonymous, login updates user without token storage, logout clears user. Spy on localStorage.setItem and assert no key/value contains token.

Login tests cover required fields, duplicate-submit prevention, generic 401, and safe returnTo=/checkout. Register tests assert exact request body:

~~~ts
{
  username, password, first_name, last_name,
  phone, email, birth_date,
}
~~~

and no permission_id, timestamps, or audit fields.

- [ ] **Step 2: Verify RED**

~~~powershell
npm test -- src/features/auth src/app/login src/app/register src/components/Header.test.tsx
~~~

Expected: FAIL because auth state/pages do not exist.

- [ ] **Step 3: Implement provider, forms, navigation, and messages**

Wrap providers:

~~~tsx
<LanguageProvider>
  <ThemeProvider>
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
    </AuthProvider>
  </ThemeProvider>
</LanguageProvider>
~~~

Header shows Login for anonymous, account/logout for authenticated, and Admin for permission ID 1. Clear password after every request. Accept returnTo only when starting with one / and not //; default /.

Add complete English/Thai auth keys. Never render raw backend errors.

- [ ] **Step 4: Verify and commit**

~~~powershell
npm test -- src/features/auth src/app/login src/app/register src/components/Header.test.tsx
npm test
npm run type-check
npm run build
git add src/features/auth src/app/login src/app/register src/app/layout.tsx src/components/Header.tsx src/components/Header.test.tsx src/features/i18n/messages.ts
git commit -m "feat: add member and admin authentication UI"
~~~

---

### Task 7: Verify full auth slice and update docs

**Files:**
- Modify: Storefront/README.md
- Modify: project_intern1/README.md

**Interfaces:**
- Produces one documented local auth flow and no runtime API.

- [ ] **Step 1: Run all checks**

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

- [ ] **Step 2: Run local smoke**

Start Docker MySQL and Go. Verify:

~~~text
POST /api/auth/register -> success; no role accepted
POST /api/auth/login    -> user only; HttpOnly cookie
GET  /api/auth/session  -> Member/Admin session
POST /api/auth/logout   -> cookie removed
GET  /api/auth/session  -> 401
~~~

Create Admin only with cmd/create-admin. Confirm browser Local/Session Storage has no JWT.

- [ ] **Step 3: Update docs**

Document BACKEND_API_URL, NEXT_PUBLIC_SITE_URL, JWT_ACCESS_TTL, Admin bootstrap, expiration, and HttpOnly boundary. Remove developer-token instructions.

- [ ] **Step 4: Commit docs**

~~~powershell
# Backend
git add README.md
git commit -m "docs: explain secure authentication workflow"

# Storefront
git add README.md
git commit -m "docs: explain storefront sessions"
~~~

Do not push until review confirms no secrets and both worktrees clean.

## Phase 1 Completion Gate

- Member registration cannot choose role.
- Login, /me, logout work through BFF cookie.
- Admin bootstrap is explicit and secret-safe.
- Browser-accessible storage contains no JWT.
- Backend and Storefront checks pass.
- After review, push test branches and begin Plan 2.
