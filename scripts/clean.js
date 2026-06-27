import fs from 'node:fs';
import path from 'node:path';

const defaultFolders = ['.angular', 'dist', 'out-tsc', 'coverage', '.vitest'];

const args = process.argv.slice(2);

function deletePath(targetPath) {
  if (fs.existsSync(targetPath)) {
    console.log(`Deleting: ${targetPath}`);
    fs.rmSync(targetPath, { recursive: true, force: true });
  }
}

if (args.length > 0) {
  for (const arg of args) {
    const targetPath = path.resolve(arg);
    deletePath(targetPath);
  }
} else {
  const cwd = process.cwd();

  // Clean in root (cwd)
  for (const folder of defaultFolders) {
    deletePath(path.join(cwd, folder));
  }

  // Clean in packages/*/
  const packagesDir = path.join(cwd, 'packages');
  if (fs.existsSync(packagesDir) && fs.statSync(packagesDir).isDirectory()) {
    const packages = fs.readdirSync(packagesDir);
    for (const pkg of packages) {
      const pkgDir = path.join(packagesDir, pkg);
      if (fs.statSync(pkgDir).isDirectory()) {
        for (const folder of defaultFolders) {
          deletePath(path.join(pkgDir, folder));
        }
      }
    }
  }
}
