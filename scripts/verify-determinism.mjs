import path from 'node:path';
import { rm } from 'node:fs/promises';
import { runPipeline } from '../src/artifacts/pipeline.mjs';

const projectRoot = process.cwd();
const temporaryRoot = path.join(projectRoot, '.tmp', 'determinism');
const common = {
  projectRoot,
  inputPath: path.join(projectRoot, 'examples/minimal-open-dataset/input/jmdict-mini.xml'),
  sourcesPath: path.join(projectRoot, 'examples/minimal-open-dataset/source-records.json'),
  corpusPath: path.join(projectRoot, 'examples/minimal-open-dataset/corpus.json'),
};

await rm(temporaryRoot, { recursive: true, force: true });
const first = await runPipeline({ ...common, outputPath: path.join(temporaryRoot, 'first') });
const second = await runPipeline({ ...common, outputPath: path.join(temporaryRoot, 'second') });

if (first.directoryDigest !== second.directoryDigest) {
  throw new Error(`Nondeterministic build: ${first.directoryDigest} != ${second.directoryDigest}`);
}

console.log(JSON.stringify({
  first: first.directoryDigest,
  second: second.directoryDigest,
  identical: true,
}, null, 2));
