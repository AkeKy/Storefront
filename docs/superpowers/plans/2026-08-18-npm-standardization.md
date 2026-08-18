# Npm Standardization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make npm the sole installation and command standard for Storefront.

**Architecture:** Keep `package.json` scripts unchanged and replace the pnpm lockfile with an npm-generated lockfile at the repository root. The README then documents the actual Gadget Arena application and invokes those existing scripts using npm.

**Tech Stack:** npm, Next.js 15, React 19, TypeScript, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-15-npm-standardization-design.md`

## Global Constraints

- Do not add, remove, or upgrade application dependencies.
- Keep all existing package scripts and the port `4028` unchanged.
- Do not change application behavior, the fixture-backed catalog, cart storage, checkout behavior, or Go API boundary.
- A clean clone must work with `npm install`, `npm run dev`, `npm test`, `npm run type-check`, and `npm run build`.

---

### Task 1: Establish npm lockfile ownership

**Files:**
- Create: `package-lock.json`
- Delete: `pnpm-lock.yaml`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: the exact dependency ranges in `package.json`.
- Produces: a reproducible npm install through root-level `package-lock.json`.

- [ ] **Step 1: Generate the lockfile without changing dependency declarations**

Run:

```powershell
npm install --package-lock-only
```

Expected: `package-lock.json` is generated while `package.json` has no dependency diff.

- [ ] **Step 2: Remove pnpm ownership and allow npm lockfile tracking**

Delete `pnpm-lock.yaml` and remove this line from `.gitignore`:

```gitignore
package-lock.json
```

- [ ] **Step 3: Verify dependency metadata**

Run:

```powershell
git diff -- package.json
git diff -- .gitignore package-lock.json pnpm-lock.yaml
```

Expected: `package.json` has no output; the diff adds the npm lockfile, removes the pnpm lockfile, and permits the new lockfile.

### Task 2: Replace stale README guidance

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: existing `package.json` scripts: `dev`, `test`, `type-check`, and `build`.
- Produces: a truthful onboarding document for Gadget Arena.

- [ ] **Step 1: Write the README quick-start contract**

Replace the old ByteForge/template guidance with:

```markdown
## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:4028`.
```

- [ ] **Step 2: Document current behavior and limits**

Describe the Gadget Arena catalog filters, local cart, bilingual English-default UI, demo-first checkout, fixture-backed catalog, separate `project_intern1` Go backend, and no-payment constraint. List npm test/type-check/build commands.

- [ ] **Step 3: Verify README contains no obsolete identity or pnpm workflow**

Run:

```powershell
rg -n "ByteForge|pnpm|Shopping Frontend" README.md
```

Expected: no results.

### Task 3: Verify the clean npm workflow

**Files:**
- Verify only.

**Interfaces:**
- Consumes: committed `package-lock.json` and unchanged npm scripts.
- Produces: evidence that a customer/developer can use npm alone.

- [ ] **Step 1: Install dependencies through npm**

Run:

```powershell
npm install
```

Expected: exit code 0.

- [ ] **Step 2: Run application verification through npm**

Run:

```powershell
npm test
npm run type-check
npm run build
```

Expected: all commands exit 0.

- [ ] **Step 3: Inspect whitespace and stage only this migration**

Run:

```powershell
git diff --check
git status --short
```

Expected: no whitespace errors; stage only `README.md`, `.gitignore`, `package-lock.json`, and the deleted `pnpm-lock.yaml` plus this plan/state documentation.

- [ ] **Step 4: Commit**

```powershell
git add README.md .gitignore package-lock.json pnpm-lock.yaml docs/superpowers/plans/2026-08-18-npm-standardization.md docs/CODEX_STATE.md
git commit -m "build: standardize storefront on npm"
```
