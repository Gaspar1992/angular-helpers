import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcPath = path.join(__dirname, '../public/assets/workers/regex.worker.js');
const destPath = path.join(__dirname, '../packages/security/src/workers/regex.worker.inline.ts');

try {
  const workerContent = fs.readFileSync(srcPath, 'utf8');
  const fileContent = `export const REGEX_WORKER_INLINE = ${JSON.stringify(workerContent)};\n`;
  fs.writeFileSync(destPath, fileContent, 'utf8');
  console.log('✅ Successfully inlined regex.worker.js');
} catch (error) {
  console.error('❌ Failed to inline regex.worker.js:', error);
  process.exit(1);
}
