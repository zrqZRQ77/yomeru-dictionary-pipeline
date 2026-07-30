import { readFile } from 'node:fs/promises';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

export async function createSchemaValidators(projectRoot) {
  const schemaRoot = path.join(projectRoot, 'schemas');
  const [lexicalSchema, sourceSchema, manifestSchema] = await Promise.all([
    readJson(path.join(schemaRoot, 'lexical-record.schema.json')),
    readJson(path.join(schemaRoot, 'source-record.schema.json')),
    readJson(path.join(schemaRoot, 'build-manifest.schema.json')),
  ]);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  return {
    lexical: ajv.compile(lexicalSchema),
    source: ajv.compile(sourceSchema),
    manifest: ajv.compile(manifestSchema),
  };
}

function formatErrors(errors) {
  return (errors || []).map((error) => `${error.instancePath || '/'} ${error.message}`).join('; ');
}

export function assertValid(validate, value, label) {
  if (!validate(value)) throw new Error(`${label} failed schema validation: ${formatErrors(validate.errors)}`);
}

export function assertAllValid(validate, values, label) {
  values.forEach((value, index) => assertValid(validate, value, `${label}[${index}]`));
}
