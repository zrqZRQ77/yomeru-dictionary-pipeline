# Architecture

## Data flow

```text
source register + JMdict-style XML + pre-tokenized corpus
  -> source validation
  -> XML parsing
  -> lexical normalization and lookup-key generation
  -> duplicate and conflict detection
  -> corpus coverage audit
  -> development-only candidate queue
  -> read-only import dry-run
  -> deterministic artifacts and build manifest
```

## Modules

- `src/parse/`: input adapters.
- `src/normalize/`: canonical lexical records and normalized keys.
- `src/audit/`: coverage, duplicate, and conflict analysis.
- `src/review/`: candidate ranking and risk classification.
- `src/artifacts/`: orchestration, stable serialization, hashing, and manifests.
- `src/validate/`: JSON Schema validation.
- `src/cli/`: command-line entry point.

## Boundary decisions

- Corpus tokenization is an adapter boundary and is not tied to a browser or application runtime.
- Candidate generation reads development documents only. Evaluation documents may be measured but never used for candidate ranking.
- Builds never mutate input data.
- Source layers remain independently removable and rebuildable.
- A build timestamp comes from `SOURCE_DATE_EPOCH`, not the wall clock, to preserve reproducibility.
