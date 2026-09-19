# Review & Visual Validation

## Flow

Immutable Build Identity
→ Capture Manifest
→ Screenshot/Preview Evidence
→ Visual QA
→ Review Session
→ BugDrop
→ Change Contract when material
→ Rebuild / Re-review

## Build identity

Every review is tied to a source revision and direction. Review comments therefore cannot drift between builds.

## Capture manifest

The capture plan enumerates:
- surface
- runtime
- viewport
- deterministic state
- expected evidence path

Flutter defaults to a mobile viewport. Web captures desktop and mobile targets. External/provider surfaces may be represented by external evidence until an Agency-owned extension exists.

## BugDrop routing

Visual/UX/content issues remain in the experience loop unless severity or impact requires formal change control.

Business-rule, integration, data, security, performance and accessibility findings route to Change Contract review.

## AI visual review

OpenCode routes screenshot review to the Visual Review Agent, with ChatGPT preferred for reviewer reasoning. AI findings remain proposals/BugDrops and must reference concrete artifacts.
