# Release checklist

Use this checklist before creating any Git tag or GitHub Release. Completing the checklist does not itself authorize publishing a release.

## Candidate identity

- [ ] Confirm the candidate is on `main`.
- [ ] Record the exact candidate commit SHA.
- [ ] Confirm `package.json` and `CHANGELOG.md` use the intended version.
- [ ] Confirm the working tree is clean in a fresh clone.

## Locked installation and verification

Run from a fresh clone:

```bash
npm ci
npm run verify
npm audit --audit-level=low
```

Required results:

- [ ] All unit tests pass.
- [ ] All JSON Schema validation passes.
- [ ] The example build completes.
- [ ] Repeated build hashes are identical.
- [ ] The repository safety scan reports zero blocking findings.
- [ ] The whitespace check reports zero findings.
- [ ] The dependency audit reports zero vulnerabilities at the configured threshold.

## CI evidence

- [ ] CI passes on Node.js 20.
- [ ] CI passes on Node.js 22.
- [ ] The CI workflow uses read-only repository permissions.
- [ ] The candidate commit has no cancelled, skipped, or failing required job.

## License and data boundary

- [ ] GitHub recognizes the root license as Apache-2.0.
- [ ] `NOTICE` accurately describes bundled and optional data.
- [ ] The sample-data directory exposes its CC0-1.0 license.
- [ ] No real JMdict, Wiktionary, commercial dictionary, or source-unknown records are bundled.
- [ ] Any added data has source ID, version, retrieval date, license, attribution, redistribution, and transformation metadata.

## Privacy and repository safety

- [ ] No credentials, tokens, private keys, private domains, or local absolute paths are present.
- [ ] No private application source, account code, user information, internal review record, or commercial definition is present.
- [ ] Evaluation-only documents are not used to generate or prioritize candidates.
- [ ] The import dry-run remains read-only.

## Release notes and rollback

- [ ] Summarize user-visible capabilities and known limitations.
- [ ] Record the commit range included in the release.
- [ ] Confirm `CHANGELOG.md` matches the release notes.
- [ ] Document rollback as returning consumers to the previously pinned commit or release.
- [ ] Confirm no deployment or data publication is bundled with the GitHub Release decision.

## Publishing boundary

Only after every required item is checked:

1. create the annotated version tag;
2. push the tag without force;
3. create the GitHub Release from that exact tag;
4. verify the release archive and displayed licenses;
5. record the final release URL and commit SHA.

A separate maintainer decision is required before these publishing steps.
