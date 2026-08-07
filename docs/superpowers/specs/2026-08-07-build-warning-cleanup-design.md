# Build warning cleanup design

## Goal

Remove the six lint warnings and the workspace-root warning reported by `pnpm build` without changing storefront behavior or visuals.

## Scope

- Replace the open-ended `any` prop bags in `AppIcon` and `AppImage` with the corresponding React, Heroicons, and Next Image prop types.
- Keep dynamic icon lookup and the existing fallback icon behavior.
- Keep `AppImage` source fallback, click handling, `fill`, loading, and Next Image options unchanged while making its `<Image>` props statically typed.
- Ensure every rendered image receives the required `alt` property through `AppImage`'s required prop contract.
- Set `outputFileTracingRoot` to this worktree's Next config directory so Next does not select the unrelated `C:\Users\akebu\package-lock.json` as its tracing root.

## Non-goals

- Do not change the component public behavior, product UI, image optimization policy, dependency versions, or lockfiles.
- Do not delete parent-directory lockfiles, because they are outside this storefront's ownership.

## Verification

- Run `pnpm type-check`.
- Run the full `pnpm test` and `pnpm build` in the user's normal PowerShell environment.
- Confirm the production build exits successfully and prints none of the previous six lint warnings or the inferred-workspace-root warning.
