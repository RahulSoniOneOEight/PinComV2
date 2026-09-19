# Branch Protection Policy

Recommended required checks for `main`:

- Validate Agency Platform V2 / platform-validation
- Validate Agency Platform V2 / flutter-runtime
- Validate Agency Platform V2 / web-runtime
- Security & Supply Chain / security

Recommended repository controls:
- require pull request before merging
- require required status checks to pass
- require branch to be up to date before merge
- do not allow force pushes
- do not allow deletion of main
- require environment approval for production workflows
- restrict production secrets to the production environment

This file documents the intended repository policy. Repository-admin settings are deliberately not changed automatically by implementation agents.
