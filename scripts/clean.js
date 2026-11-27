/* oxlint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';

const defaultFolders = ['.angular', 'dist', 'out-tsc', 'coverage', '.vitest'];
const cwd = process.cwd();

const args = process.argv.slice(2);

function deletePath(targetPath) {
  const rel = path.relative(cwd, targetPath);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`Refusing to delete path outside workspace root: ${targetPath}`);
  }
  if (fs.existsSync(targetPath)) {
    console.log(`Deleting: ${targetPath}`);
    fs.rmSync(targetPath, { recursive: true, force: true });
  }
}

if (args.length > 0) {
  for (const arg of args) {
    const targetPath = path.resolve(cwd, arg);
    deletePath(targetPath);
  }
} else {
  // Clean in root (cwd)
  for (const folder of defaultFolders) {
    deletePath(path.join(cwd, folder));
  }

  // Clean in libs/*/ and apps/*/
  for (const parent of ['libs', 'apps']) {
    const parentDir = path.join(cwd, parent);
    if (fs.existsSync(parentDir) && fs.statSync(parentDir).isDirectory()) {
      for (const pkg of fs.readdirSync(parentDir)) {
        const pkgDir = path.join(parentDir, pkg);
        if (fs.statSync(pkgDir).isDirectory()) {
          for (const folder of defaultFolders) {
            deletePath(path.join(pkgDir, folder));
          }
        }
      }
    }
  }
}
