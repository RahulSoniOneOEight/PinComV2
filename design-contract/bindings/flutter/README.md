# Flutter Binding

Maps framework-independent Design Contract roles and component specifications into `agency_flutter_ui`.

Rules:
- semantic tokens only in application-facing widgets
- Material/Cupertino/shadcn-style widgets may be wrapped behind shared primitives
- Widgetbook stories are required for reusable primitives/patterns
- visual changes require golden coverage for critical states
