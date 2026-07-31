# Roadmap

This roadmap tracks public, product-independent work. It does not expose private product code, commercial dictionary content, user data, or internal review records.

## 0.1.x — Public foundation

- Keep CI green on supported Node.js versions.
- Document the CLI, schemas, deterministic-build contract, and license boundaries.
- Add a release checklist covering tests, dependency audit, provenance review, and safety scanning.
- Validate the clean-room repository from a fresh public clone before every release.

## 0.2.0 — Adapter examples

- Add one tokenizer-adapter example for a pre-tokenized corpus.
- Add one source-adapter example that preserves source IDs, versions, licenses, attribution, and transformation history.
- Add larger synthetic fixtures for duplicate, reading-conflict, and ambiguous-source cases.
- Improve CLI diagnostics without coupling the project to a learning-product runtime.

## 0.3.0 — Integration evidence

- Document a private-product integration pattern using only public interfaces and non-sensitive metrics.
- Add an adopter-report template.
- Publish reproducible benchmark methodology using redistributable or synthetic data only.
- Collect external feedback through issues and pull requests.

## Release gate

A release is eligible when:

1. `npm ci`, `npm run verify`, and `npm audit --audit-level=low` pass from a fresh clone.
2. CI passes on all supported Node.js versions.
3. Generated artifacts are deterministic.
4. Safety scanning reports no blocking findings.
5. Data additions have complete provenance and license records.
6. No commercial, private, source-unknown, or evaluation-only data is published.
