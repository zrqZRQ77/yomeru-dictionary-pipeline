# Yomeru Dictionary Pipeline

Yomeru Dictionary Pipeline is a reproducible, provenance-aware pipeline for auditing, normalizing, reviewing, and building Japanese dictionary data for learning applications.

This repository contains a general-purpose data pipeline. It does not contain a learning application's interface, account system, user data, course content, private review records, or a commercial dictionary.

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

## Local use

```bash
npm install
npm test
npm run schema:validate
npm run build
npm run verify:determinism
npm run scan:safety
npm run check:whitespace
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

## Deterministic builds

Build output is sorted and canonically serialized. The manifest timestamp is taken from `SOURCE_DATE_EPOCH`; when it is unset, a fixed epoch is used. Two builds with the same inputs and environment therefore produce the same directory digest.

## Data and license boundary

The Apache-2.0 root license covers original project code only. External datasets keep their own licenses. No JMdict data is bundled in the test fixture; the fixture is hand-authored and dedicated to CC0. See `NOTICE` and `docs/data-licenses.md` before adding data.

This repository documents engineering controls and is not legal advice.
