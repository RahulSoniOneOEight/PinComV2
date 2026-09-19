# Prototype Runtimes

Agency Platform V2 now has concrete prototype runtimes for the two primary experience surfaces.

## Flutter

- `apps/prototype_app`
- `packages/agency_flutter_ui`
- `apps/widgetbook`

The prototype app consumes the shared Design Contract binding. Widgetbook exposes reusable components and deterministic states for review.

## Web

- `apps/storefront`
- `packages/agency_web_ui`
- `apps/storybook`

The storefront consumes the same semantic design roles and deterministic commerce states. Storybook provides component review.

## State parity

Critical fixture states should exist across frameworks:
- default
- loading
- empty
- failure
- approval pending
- payment failed

## Next runtime steps

- screenshot capture
- Flutter golden tests
- browser visual regression
- Review Mode
- BugDrop
- build-identity propagation into review artifacts
