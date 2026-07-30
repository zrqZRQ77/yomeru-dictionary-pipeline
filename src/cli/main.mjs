#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runPipeline, validateInputs } from '../artifacts/pipeline.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function parseOptions(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const key = args[index];
    if (!key.startsWith('--')) throw new Error(`Unexpected argument: ${key}`);
    const value = args[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${key}`);
    options[key.slice(2)] = value;
    index += 1;
  }
  return options;
}

function required(options, name) {
  if (!options[name]) throw new Error(`Missing required option --${name}`);
  return path.resolve(options[name]);
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const options = parseOptions(rest);

  if (command === 'build') {
    const result = await runPipeline({
      projectRoot,
      inputPath: required(options, 'input'),
      sourcesPath: required(options, 'sources'),
      corpusPath: required(options, 'corpus'),
      outputPath: required(options, 'output'),
    });
    console.log(JSON.stringify({
      buildId: result.manifest.buildId,
      directoryDigest: result.directoryDigest,
      output: required(options, 'output'),
    }, null, 2));
    return;
  }

  if (command === 'schema-check') {
    const result = await validateInputs({
      projectRoot,
      inputPath: required(options, 'input'),
      sourcesPath: required(options, 'sources'),
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  throw new Error('Usage: main.mjs <build|schema-check> [options]');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
