# Dependency Advisories

Snapshot of `npm audit` for the JavaScript workspace. Regenerate with:

```
npm install
npm audit
```

## Current status (2026-09-20)

Totals: 6 advisories — 6 low, 0 moderate, 0 high, 0 critical.

All remaining advisories are transitive, **development-only** dependencies of Storybook's
Next.js framework (`@storybook/nextjs` → `node-polyfill-webpack-plugin` → `crypto-browserify`
→ `elliptic` / `browserify-sign` / `create-ecdh`). They are not part of any shipped runtime.
`npm audit` reports a "fix" only by downgrading `@storybook/nextjs` to 7.0.14, which is not a
real fix; this should be revisited when upstream updates the polyfill chain.

## Resolved in this pass

The previous 4 high + 4 moderate advisories were cleared by upgrading:

- `next` 15 → **16.3.5** (cleared the `postcss` XSS / arbitrary file-read chain)
- `storybook` and `@storybook/nextjs` 8 → **10.6.0**, removing the deprecated
  `@storybook/addon-essentials` (cleared `image-size`, `sharp`, `uuid`, and the bundled
  `next`/`node-polyfill-webpack-plugin` high findings)

## Policy

- Dependencies are pinned by the committed root `package-lock.json`; CI uses `npm install`
  against that lockfile.
- `npm audit fix --force` is **not** applied automatically.
- A dedicated dependency-upgrade task should revisit the remaining low findings when the
  Storybook polyfill chain publishes fixes.
