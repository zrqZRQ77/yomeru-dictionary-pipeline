import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

export function stableJson(value) {
  return `${JSON.stringify(canonicalize(value), null, 2)}\n`;
}

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export async function sha256File(filePath) {
  return sha256(await readFile(filePath));
}

export async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const text = stableJson(value);
  await writeFile(filePath, text, 'utf8');
  return sha256(text);
}

async function listFiles(root, current = root) {
  const entries = await readdir(current, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(root, absolute));
    else if (entry.isFile()) files.push(path.relative(root, absolute));
  }
  return files;
}

export async function directoryDigest(root) {
  const hash = createHash('sha256');
  for (const relative of await listFiles(root)) {
    hash.update(relative);
    hash.update('\0');
    hash.update(await readFile(path.join(root, relative)));
    hash.update('\0');
  }
  return hash.digest('hex');
}

export function sourceDateTime() {
  const raw = process.env.SOURCE_DATE_EPOCH;
  const seconds = raw === undefined ? 946684800 : Number(raw);
  if (!Number.isInteger(seconds) || seconds < 0) {
    throw new Error('SOURCE_DATE_EPOCH must be a non-negative integer');
  }
  return new Date(seconds * 1000).toISOString();
}
