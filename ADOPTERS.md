# Adopters and integrations

This file records verifiable uses of the public interfaces without exposing private source code, production data, user information, or commercial review records.

## Yomeru

**Status:** verified private integration

The pipeline was created from provenance, deterministic-build, and safety requirements developed while maintaining Yomeru's Japanese-learning data workflows. The public repository is a clean-room implementation and does not contain Yomeru's application runtime, accounts, course content, curated commercial definitions, or production datasets.

A private CI integration was verified on 2026-07-31 against pinned public commit `86e790cb9636521df967ae70d48818ff46c68ec5`.

The integration:

- checked out the public repository at the exact pinned commit;
- completed `npm ci` and the public `npm run verify` gate;
- invoked the public CLI and schemas with temporary hand-authored synthetic data;
- preserved the declared source reference in all generated lexical records;
- produced two identical builds with build ID `build-4a87d6d22fcc8494`;
- produced directory digest `7e6339b8b0aa5cabface31cc82157bdcdd95cf2dd6612dd017c77765a649869b` on both runs;
- generated 2 lexical records from 2 documents and 3 tokens, with 1 development candidate, 0 duplicates, and 0 conflicts;
- used no private inputs, user information, commercial definitions, or production data.

The private integration remains pinned to a public Git commit. A future formal release may replace the commit pin only after the release checklist passes.

## Report an adoption

Open an issue with:

- project name and public URL, when available;
- pipeline version or commit used;
- the public capability being used;
- non-sensitive verification details;
- permission to list the project here.

Do not include private datasets, credentials, internal URLs, user data, or copied dictionary definitions.
