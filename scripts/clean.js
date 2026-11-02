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

  // Clean in libs/*/
  const libsDir = path.join(cwd, 'libs');
  if (fs.existsSync(libsDir) && fs.statSync(libsDir).isDirectory()) {
    const libs = fs.readdirSync(libsDir);
    for (const pkg of libs) {
      const pkgDir = path.join(libsDir, pkg);
      if (fs.statSync(pkgDir).isDirectory()) {
        for (const folder of defaultFolders) {
          deletePath(path.join(pkgDir, folder));
        }
      }
    }
  }
}
