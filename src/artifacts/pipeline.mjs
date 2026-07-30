import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { parseJmdictXml } from '../parse/jmdict.mjs';
import { normalizeLexicalEntries } from '../normalize/lexical-record.mjs';
import { auditCoverage } from '../audit/coverage.mjs';
import { createImportDryRun, detectConflicts } from '../audit/conflicts.mjs';
import { buildCandidateQueue } from '../review/candidates.mjs';
import { assertAllValid, assertValid, createSchemaValidators } from '../validate/schemas.mjs';
import { directoryDigest, sha256, sourceDateTime, writeJson } from './stable.mjs';

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

export async function runPipeline({ projectRoot, inputPath, sourcesPath, corpusPath, outputPath }) {
  const [xml, sources, corpus, packageText] = await Promise.all([
    readFile(inputPath, 'utf8'),
    readJson(sourcesPath),
    readJson(corpusPath),
    readFile(path.join(projectRoot, 'package.json'), 'utf8'),
  ]);
  if (!Array.isArray(sources) || sources.length === 0) {
    throw new Error('At least one source record is required');
  }

  const validators = await createSchemaValidators(projectRoot);
  assertAllValid(validators.source, sources, 'sourceRecords');
  const records = normalizeLexicalEntries(parseJmdictXml(xml), sources[0].id);
  assertAllValid(validators.lexical, records, 'lexicalRecords');

  const conflictReport = detectConflicts(records);
  const coverageReport = auditCoverage(records, corpus);
  const candidateQueue = buildCandidateQueue(coverageReport);
  const importDryRun = createImportDryRun(records);

  await rm(outputPath, { recursive: true, force: true });
  const outputs = [];
  for (const [name, value] of [
    ['lexical-records.json', records],
    ['coverage-report.json', coverageReport],
    ['candidate-queue.json', candidateQueue],
    ['import-dry-run.json', importDryRun],
    ['provenance.json', sources],
    ['conflict-report.json', { schemaVersion: '1.0.0', ...conflictReport }],
  ]) {
    outputs.push({ name, sha256: await writeJson(path.join(outputPath, name), value) });
  }
  outputs.sort((a, b) => a.name.localeCompare(b.name));

  const inputs = [
    { name: path.basename(inputPath), sha256: sha256(xml) },
    { name: path.basename(sourcesPath), sha256: sha256(await readFile(sourcesPath)) },
    { name: path.basename(corpusPath), sha256: sha256(await readFile(corpusPath)) },
  ].sort((a, b) => a.name.localeCompare(b.name));

  const packageJson = JSON.parse(packageText);
  const manifest = {
    schemaVersion: '1.0.0',
    buildId: `build-${sha256(JSON.stringify(inputs)).slice(0, 16)}`,
    toolVersion: packageJson.version,
    buildTimestamp: sourceDateTime(),
    inputs,
    outputs,
    counts: {
      lexicalRecords: records.length,
      documents: corpus.documents.length,
      tokens: coverageReport.totalTokens,
      candidates: candidateQueue.totalCandidates,
      duplicates: conflictReport.duplicates.length,
      conflicts: conflictReport.conflicts.length,
    },
    deterministic: true,
  };
  assertValid(validators.manifest, manifest, 'buildManifest');
  await writeJson(path.join(outputPath, 'build-manifest.json'), manifest);

  return {
    manifest,
    directoryDigest: await directoryDigest(outputPath),
  };
}

export async function validateInputs({ projectRoot, inputPath, sourcesPath }) {
  const [xml, sources] = await Promise.all([
    readFile(inputPath, 'utf8'),
    readJson(sourcesPath),
  ]);
  if (!Array.isArray(sources) || sources.length === 0) {
    throw new Error('At least one source record is required');
  }
  const validators = await createSchemaValidators(projectRoot);
  assertAllValid(validators.source, sources, 'sourceRecords');
  const records = normalizeLexicalEntries(parseJmdictXml(xml), sources[0].id);
  assertAllValid(validators.lexical, records, 'lexicalRecords');
  return { sourceRecords: sources.length, lexicalRecords: records.length };
}
