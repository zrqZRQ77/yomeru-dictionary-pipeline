import assert from 'node:assert/strict';
import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { parseJmdictXml } from '../src/parse/jmdict.mjs';
import { normalizeLexicalEntries, normalizeReading } from '../src/normalize/lexical-record.mjs';
import { auditCoverage } from '../src/audit/coverage.mjs';
import { detectConflicts, createImportDryRun } from '../src/audit/conflicts.mjs';
import { buildCandidateQueue } from '../src/review/candidates.mjs';
import { runPipeline, validateInputs } from '../src/artifacts/pipeline.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtureRoot = path.join(projectRoot, 'examples/minimal-open-dataset');
const inputPath = path.join(fixtureRoot, 'input/jmdict-mini.xml');
const sourcesPath = path.join(fixtureRoot, 'source-records.json');
const corpusPath = path.join(fixtureRoot, 'corpus.json');

async function loadRecords() {
  const [xml, sources] = await Promise.all([
    readFile(inputPath, 'utf8'),
    JSON.parse(await readFile(sourcesPath, 'utf8')),
  ]);
  return normalizeLexicalEntries(parseJmdictXml(xml), sources[0].id);
}

test('parses and normalizes JMdict-style XML', async () => {
  const records = await loadRecords();
  assert.equal(records.length, 3);
  assert.equal(normalizeReading('マナブ'), 'まなぶ');
  assert.ok(records.some((record) => record.primaryForm === '学ぶ' && record.primaryReading === 'まなぶ'));
  assert.ok(records.every((record) => record.sourceRefs[0].sourceId === 'cc0-hand-authored-fixture'));
});

test('coverage audit measures both splits but candidate queue uses development only', async () => {
  const records = await loadRecords();
  const corpus = JSON.parse(await readFile(corpusPath, 'utf8'));
  const report = auditCoverage(records, corpus);
  const queue = buildCandidateQueue(report);

  assert.equal(report.totalDocuments, 2);
  assert.equal(report.totalTokens, 7);
  assert.equal(report.hits, 3);
  assert.equal(queue.candidateGenerationSplit, 'development');
  assert.equal(queue.evaluationUsedForRanking, false);
  assert.ok(queue.candidates.some((candidate) => candidate.form === '未収録'));
  assert.ok(queue.candidates.some((candidate) => candidate.form === '山田' && candidate.riskLevel === 'high'));
  assert.ok(queue.candidates.every((candidate) => !candidate.developmentEvidence.documentIds.includes('evaluation-001')));
  assert.ok(queue.candidates.every((candidate) => candidate.form !== '限定語'));
});

test('duplicate and conflict analysis is deterministic and dry-run is read-only', async () => {
  const records = await loadRecords();
  const duplicate = structuredClone(records[0]);
  duplicate.id = 'duplicate-record';
  const conflict = structuredClone(records[0]);
  conflict.id = 'conflict-record';
  conflict.primaryReading = 'がくぶ';
  conflict.readings = ['がくぶ'];
  conflict.keys.readings = ['がくぶ'];
  conflict.keys.formReading = conflict.keys.forms.map((form) => `${form}\u0000がくぶ`);

  const analysis = detectConflicts([...records, duplicate, conflict]);
  assert.ok(analysis.duplicates.length > 0);
  assert.ok(analysis.conflicts.some((item) => item.form === '学ぶ'));

  const dryRun = createImportDryRun(records, records);
  assert.equal(dryRun.mode, 'read-only');
  assert.equal(dryRun.writesPerformed, 0);
  assert.equal(dryRun.wouldInsert.length, 0);
  assert.equal(dryRun.exactDuplicates.length, records.length);
});

test('schemas validate and clean builds are deterministic', async () => {
  const validation = await validateInputs({ projectRoot, inputPath, sourcesPath });
  assert.deepEqual(validation, { sourceRecords: 1, lexicalRecords: 3 });

  const temporaryRoot = path.join(projectRoot, '.tmp', 'test-builds');
  await rm(temporaryRoot, { recursive: true, force: true });
  const common = { projectRoot, inputPath, sourcesPath, corpusPath };
  const first = await runPipeline({ ...common, outputPath: path.join(temporaryRoot, 'first') });
  const second = await runPipeline({ ...common, outputPath: path.join(temporaryRoot, 'second') });

  assert.equal(first.directoryDigest, second.directoryDigest);
  assert.equal(first.manifest.counts.lexicalRecords, 3);
  assert.equal(first.manifest.counts.documents, 2);
  assert.equal(first.manifest.deterministic, true);
  assert.match(first.directoryDigest, /^[a-f0-9]{64}$/);
});
