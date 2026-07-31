# Yomeru Dictionary Pipeline

[![CI](https://github.com/zrqZRQ77/yomeru-dictionary-pipeline/actions/workflows/ci.yml/badge.svg)](https://github.com/zrqZRQ77/yomeru-dictionary-pipeline/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

Yomeru Dictionary Pipeline is a reproducible, provenance-aware pipeline for auditing, normalizing, reviewing, and building Japanese dictionary data for learning and NLP applications.

This repository contains a general-purpose data pipeline. It does not contain a learning application's interface, account system, user data, course content, private review records, production datasets, or a commercial dictionary.

## Why this project exists

Dictionary data pipelines often mix source data, curated records, generated artifacts, evaluation material, and product runtime code. That makes licensing, removal, rebuilding, and review difficult. This project keeps those layers separable and makes each build traceable and reproducible.

The core guarantees are:

- source, license, attribution, and transformation metadata remain attached to records;
- evaluation documents are never used to generate or prioritize candidates;
- imports can be reviewed through a read-only dry-run before any downstream write;
- generated output is deterministic for the same declared inputs and environment;
- repository safety checks block common private, commercial, and credential-like content.

## Capabilities

- Parse JMdict-style XML input.
- Normalize written forms, readings, parts of speech, senses, and lookup keys.
- Validate lexical, source, and build-manifest records against JSON Schema.
- Audit coverage against a pre-tokenized corpus without using evaluation documents for candidate generation.
- Generate deterministic candidate queues with risk labels.
- Detect exact duplicates, reading conflicts, and ambiguous source records.
- Produce a read-only import dry-run.
- Preserve source, license, attribution, and transformation metadata.
- Build deterministic artifacts with SHA-256 hashes.

## Requirements

- Node.js 20 or newer.
- npm with lockfile support.

## Quick start

```bash
 git clone https://github.com/zrqZRQ77/yomeru-dictionary-pipeline.git
 cd yomeru-dictionary-pipeline
 npm ci
 npm run verify
```

`npm run verify` runs the tests, schema validation, clean example build, determinism check, repository safety scan, and whitespace check.

Build the bundled CC0 example directly:

```bash
npm run build
```

The example build writes these files to `dist/`:

- `lexical-records.json`
- `coverage-report.json`
- `candidate-queue.json`
- `import-dry-run.json`
- `provenance.json`
- `build-manifest.json`

Use a custom input set through the CLI:

```bash
node src/cli/main.mjs build \
  --input path/to/jmdict.xml \
  --sources path/to/source-records.json \
  --corpus path/to/pretokenized-corpus.json \
  --output path/to/output
```

The corpus format intentionally accepts pre-tokenized records. Tokenization is an upstream adapter boundary so projects can use Kuromoji, Sudachi, MeCab, or another tokenizer without coupling this package to a product runtime.

## Continuous verification

GitHub Actions runs the locked install, complete verification suite, and dependency audit on supported Node.js versions for every pull request and every push to `main`.

Local release gate:

```bash
npm ci
npm run verify
npm audit --audit-level=low
```

## Deterministic builds

Build output is sorted and canonically serialized. The manifest timestamp is taken from `SOURCE_DATE_EPOCH`; when it is unset, a fixed epoch is used. Two builds with the same inputs and environment therefore produce the same directory digest.

## Project status

The public foundation is at version `0.1.0`. Current work focuses on adapter examples, stronger synthetic fixtures, public integration evidence, and a documented release process.

- See [ROADMAP.md](ROADMAP.md) for planned work and release gates.
- See [ADOPTERS.md](ADOPTERS.md) for integration status and adoption reporting.
- See [CONTRIBUTING.md](CONTRIBUTING.md) before proposing code or data changes.
- See [SECURITY.md](SECURITY.md) for private vulnerability reporting and repository safeguards.

## Data and license boundary

The Apache-2.0 root license covers original project code and documentation only. External datasets keep their own licenses. No real JMdict data is bundled in the test fixture; the fixture is hand-authored and dedicated to CC0.

Review [NOTICE](NOTICE) and [docs/data-licenses.md](docs/data-licenses.md) before adding any data. The engineering controls documented here are not legal advice.
