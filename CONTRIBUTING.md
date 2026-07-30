# Contributing

## Principles

1. Keep code, data, and license metadata separable.
2. Do not add commercial dictionary content or source-unknown data.
3. Do not use evaluation documents to generate or prioritize candidates.
4. Every external record must retain source ID, version, retrieval date, license, attribution, and transformation history.
5. Generated output must be reproducible from declared inputs.

## Development workflow

```bash
npm install
npm run verify
```

Add focused tests for every parser, schema, risk rule, or output-format change. A change that adds data must also update `NOTICE` and `docs/data-licenses.md`.

## Data contributions

Only submit data that is authored by you under a compatible license, explicitly CC0, or redistributable under clearly documented terms. Do not submit copied definitions from commercial dictionaries, search snippets, private datasets, or material with unclear rights.
