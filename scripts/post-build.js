import fs from 'node:fs';
import path from 'node:path';

const targetDir = process.argv[2];
if (!targetDir) {
  console.error('Usage: node scripts/post-build.js <target_directory>');
  process.exit(1);
}

const resolvedTargetDir = path.resolve(targetDir);
if (!fs.existsSync(resolvedTargetDir)) {
  console.error(`Error: Target directory does not exist: ${resolvedTargetDir}`);
  process.exit(1);
}

function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile()) {
      if (entry.name.endsWith('.map')) {
        console.log(`Deleting source map file: ${fullPath}`);
        fs.rmSync(fullPath, { force: true });
      } else if (
        entry.name.endsWith('.js') ||
        entry.name.endsWith('.mjs') ||
        entry.name.endsWith('.cjs') ||
        entry.name.endsWith('.css')
      ) {
        let content = fs.readFileSync(fullPath, 'utf8');
        let modified = false;

        // Remove JS source map reference comments
        const jsMapRegex = /\/\/#\s*sourceMappingURL=.*/g;
        if (jsMapRegex.test(content)) {
          content = content.replace(jsMapRegex, '');
          modified = true;
        }

        // Remove CSS source map reference comments
        const cssMapRegex = /\/\*#\s*sourceMappingURL=.*?\*\//g;
        if (cssMapRegex.test(content)) {
          content = content.replace(cssMapRegex, '');
          modified = true;
        }

        if (modified) {
          console.log(`Stripped source map comments from: ${fullPath}`);
          fs.writeFileSync(fullPath, content, 'utf8');
        }
      }
    }
  }
}

processDirectory(resolvedTargetDir);
