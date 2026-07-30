import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const excludedDirectories = new Set(['.git', '.tmp', 'dist', 'node_modules']);

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

const findings = [];
for (const absolute of await listFiles()) {
  const bytes = await readFile(absolute);
  if (bytes.includes(0)) continue;
  const content = bytes.toString('utf8');
  const relative = path.relative(root, absolute);
  content.split('\n').forEach((line, index) => {
    if (/[ \t]+$/.test(line)) findings.push({ file: relative, line: index + 1, issue: 'trailing-whitespace' });
  });
  if (content.length > 0 && !content.endsWith('\n')) findings.push({ file: relative, issue: 'missing-final-newline' });
}

console.log(JSON.stringify({ findings, passed: findings.length === 0 }, null, 2));
if (findings.length > 0) process.exitCode = 1;
