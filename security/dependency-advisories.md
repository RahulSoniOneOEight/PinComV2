# Dependency Advisories

Snapshot of `npm audit` for the JavaScript workspace. Regenerate with:

```
npm install
npm audit
```

## Current status (2026-09-20)

Totals: 13 advisories — 5 low, 4 moderate, 4 high, 0 critical.

| Severity | Package | Direct? | Advisory | Fix |
|---|---|---|---|---|
| high | `@storybook/nextjs` | yes | bundles vulnerable `image-size`, `next`, `node-polyfill-webpack-plugin`, `sharp` | `@storybook/nextjs` 10 (major) |
| high | `image-size` | no | ICNS/JXL/HEIF parsers allow infinite-loop DoS | via `@storybook/nextjs` 10 |
| high | `postcss` | no | XSS via unescaped `</style>`; arbitrary `.map` file read via `sourceMappingURL` | via `next` 16 |
| high | `sharp` | no | inherited libvips/libheif CVEs | via `@storybook/nextjs` 10 |
| moderate | `next` | yes | vulnerable `postcss` | `next` 16 (major) |
| moderate | `@storybook/addon-essentials` | yes | vulnerable `uuid` | `@storybook/addon-essentials` 7 (major) |
| moderate | `uuid` | no | missing buffer bounds check in v3/v5/v6 | via `@storybook/addon-essentials` 7 |
| low | (5 packages) | — | transitive | — |

## Policy

- `npm audit fix` (non-breaking) does **not** resolve these: every available fix is a
  semver-major upgrade. `npm audit fix --force` is **not** applied automatically — it would
  jump `next` to 16 and Storybook to 10, which requires a deliberate, tested upgrade.
- The dependency set is pinned by the committed root `package-lock.json` for reproducible
  installs; CI uses `npm install` against that lockfile.
- These advisories are tracked here as an explicit follow-up rather than silently ignored.
  A dedicated dependency-upgrade task should bump `next` and Storybook majors, then re-run
  `npm run web:build`, `review:build`, `ops:build`, `control:build` and re-audit.
