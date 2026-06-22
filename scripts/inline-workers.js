import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcPath = path.join(__dirname, '../packages/security/src/workers/regex.worker.ts');
const destPath = path.join(__dirname, '../packages/security/src/workers/regex.worker.inline.ts');

try {
  // Compile the worker TypeScript source directly using esbuild (no prior build needed)
  const result = await build({
    entryPoints: [srcPath],
    bundle: true,
    write: false,
    format: 'iife',
    target: 'es2020',
    platform: 'browser',
  });

  const workerContent = result.outputFiles[0].text;
  const fileContent = `export const REGEX_WORKER_INLINE = ${JSON.stringify(workerContent)};\n`;
  fs.writeFileSync(destPath, fileContent, 'utf8');
  console.log('✅ Successfully compiled and inlined regex.worker.ts');
} catch (error) {
  console.error('❌ Failed to compile and inline regex.worker.ts:', error);
  process.exit(1);
}
