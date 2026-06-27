import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageDir = join(__dirname, '..');
const srcDir = join(packageDir, 'src');
const distDir = join(packageDir, '../../dist/packages/schematics');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(join(src, childItemName), join(dest, childItemName));
    });
  } else {
    fs.mkdirSync(dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function processDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (extname(file) === '.js') {
      const cjsPath = fullPath.slice(0, -3) + '.cjs';
      let content = fs.readFileSync(fullPath, 'utf8');

      // Update any relative require paths from .js to .cjs
      content = content.replace(/require\("(\.\.?\/[^"]+)\.js"\)/g, 'require("$1.cjs")');
      content = content.replace(/require\('(\.\.?\/[^']+)\.js'\)/g, "require('$1.cjs')");

      fs.writeFileSync(cjsPath, content, 'utf8');
      fs.unlinkSync(fullPath);
    }
  }
}

// 1. Copy collection.json
fs.mkdirSync(distDir, { recursive: true });
fs.copyFileSync(join(packageDir, 'collection.json'), join(distDir, 'collection.json'));

// 2. Process compiled JS files in dist
processDirectory(distDir);

// 3. Copy templates and JSON schemas from src to dist
if (fs.existsSync(srcDir)) {
  const items = fs.readdirSync(srcDir);
  for (const item of items) {
    const srcPath = join(srcDir, item);
    const destPath = join(distDir, item);

    if (fs.statSync(srcPath).isDirectory()) {
      const subItems = fs.readdirSync(srcPath);
      for (const subItem of subItems) {
        const subSrcPath = join(srcPath, subItem);
        const subDestPath = join(destPath, subItem);
        if (subItem === 'files' || subItem === 'schema.json') {
          copyRecursiveSync(subSrcPath, subDestPath);
        }
      }
    }
  }
}

console.log('Schematics build post-processing complete.');
