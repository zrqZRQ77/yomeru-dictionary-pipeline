# Security Policy

## Supported version

Security fixes are applied to the latest version on the default branch.

## Reporting

Report a suspected vulnerability privately to the repository maintainers before public disclosure. Include affected files, reproduction steps, impact, and a minimal proof of concept that does not expose real secrets or personal data.

## Repository safeguards

- Do not commit credentials, tokens, private keys, environment values, private domains, or local absolute paths.
- Treat imported XML and JSON as untrusted input.
- Keep generated output outside source directories.
- Run `npm run scan:safety` before sharing a working tree.
- Review dependency advisories and lockfile changes before accepting updates.
