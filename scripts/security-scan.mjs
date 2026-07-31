import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const excludedDirectories = new Set(['.git', 'node_modules']);
const selfPath = 'scripts/security-scan.mjs';
const boundaryDocument = 'docs/commercial-boundary.md';
const readmeDocument = 'README.md';
const adoptersDocument = 'ADOPTERS.md';
const ciWorkflow = '.github/workflows/ci.yml';
const yomeruProjectNamePaths = new Set([
  readmeDocument,
  adoptersDocument,
  'package.json',
  'NOTICE',
  boundaryDocument,
]);
const allowedTermPaths = new Map([
  ['Yomeru', yomeruProjectNamePaths],
  ['zrqZRQ77', new Set([readmeDocument])],
  ['GA4', new Set([boundaryDocument])],
  ['AdSense', new Set([boundaryDocument])],
  ['Amazon', new Set([boundaryDocument])],
  ['preview', new Set([boundaryDocument])],
  ['production', new Set([
    boundaryDocument,
    'examples/minimal-open-dataset/LICENSE',
    readmeDocument,
    adoptersDocument,
    ciWorkflow,
  ])],
  ['hidden acceptance', new Set([boundaryDocument])],
]);
const forbiddenPathParts = [
  '.ai-bridge',
  '.ai-coordination',
  'frontend',
  'account',
  'auth',
  'supabase',
  '.vercel',
  'app.js',
  'vocab-store.js',
  'chinese-definitions-source.json',
  'hidden-acceptance',
];
const forbiddenTerms = [
  'Yomeru',
  'japanese-tool',
  'japanese-hub',
  'zrqZRQ77',
  '/Users/zhouruoqi',
  'vercel',
  'supabase',
  'GA4',
  'AdSense',
  'Amazon',
  'dpl_',
  'preview',
  'production',
  'hidden acceptance',
  'hidden-acceptance',
];
const secretPatterns = [
  { name: 'private-key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'github-token', pattern: /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/ },
  { name: 'openai-key', pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
  { name: 'aws-access-key', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'jwt', pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/ },
  { name: 'assigned-secret', pattern: /\b(?:api[_-]?key|secret|token|password)\s*[:=]\s*["'][^"']{8,}["']/i },
  { name: 'private-domain', pattern: /\b(?:[a-z0-9-]+\.)+(?:internal|local|private)\b/i },
  { name: 'commercial-product-domain', pattern: /\b(?:yomeru|japanese-tool|japanese-hub)(?:\.[a-z0-9-]+)+\b/i },
  { name: 'unix-home-path', pattern: /\/(?:Users|home)\/[A-Za-z0-9._-]+\// },
  { name: 'mac-temporary-path', pattern: /\/(?:private\/var|var\/folders)\// },
  { name: 'windows-user-path', pattern: /[A-Za-z]:\\Users\\/ },
];

async function listFiles(directory = root) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(absolute));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

function termMatches(term, content) {
  if (['preview', 'production'].includes(term)) {
    return new RegExp(`\\b${term}\\b`).test(content);
  }
  return content.includes(term);
}

const findings = [];
const allowedMentions = [];
for (const absolute of await listFiles()) {
  const relative = path.relative(root, absolute);
  for (const part of forbiddenPathParts) {
    if (relative.split(path.sep).includes(part)) {
      findings.push({ type: 'forbidden-path', value: part, file: relative });
    }
  }
  if (relative === selfPath) continue;
  const bytes = await readFile(absolute);
  if (bytes.includes(0)) continue;
  const content = bytes.toString('utf8');
  for (const term of forbiddenTerms) {
    if (!termMatches(term, content)) continue;
    const item = { type: 'commercial-reference', value: term, file: relative };
    if (allowedTermPaths.get(term)?.has(relative)) allowedMentions.push(item);
    else findings.push(item);
  }
  for (const { name, pattern } of secretPatterns) {
    if (pattern.test(content)) findings.push({ type: 'secret-pattern', value: name, file: relative });
  }
}

const result = {
  scannedTerms: forbiddenTerms,
  termAllowlist: Object.fromEntries(
    [...allowedTermPaths.entries()].map(([term, paths]) => [term, [...paths].sort()]),
  ),
  allowedMentions,
  findings,
  passed: findings.length === 0,
};
console.log(JSON.stringify(result, null, 2));
if (!result.passed) process.exitCode = 1;
