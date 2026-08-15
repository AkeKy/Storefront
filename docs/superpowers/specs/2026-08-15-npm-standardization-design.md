# Npm Standardization Design

## Goal

Make npm the single documented and tracked package-manager workflow for Storefront.

## Scope

- Generate and commit the project-level `package-lock.json` from the existing `package.json`.
- Remove the tracked `pnpm-lock.yaml` so there is one lockfile in this repository.
- Stop ignoring `package-lock.json` in `.gitignore`.
- Update README for the Gadget Arena storefront with `npm install` and `npm run dev` as the quick-start commands.
- Document current catalog, cart, checkout, i18n, test, type-check, and build behavior truthfully.

## Constraints

- Do not add, remove, or upgrade application dependencies.
- Keep all existing package scripts and the port `4028` unchanged.
- Do not change application behavior, the fixture-backed catalog, cart storage, checkout behavior, or Go API boundary.
- A clean clone must work with `npm install`, `npm run dev`, `npm test`, `npm run type-check`, and `npm run build`.

## Verification

- `npm install` completes using the committed project `package-lock.json`.
- `npm test`, `npm run type-check`, and `npm run build` complete successfully.
- The repository has no tracked pnpm lockfile and `.gitignore` does not ignore `package-lock.json`.
