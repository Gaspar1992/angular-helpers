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

function getCatalogVersions(rootDir) {
  const pnpmWorkspacePath = path.join(rootDir, 'pnpm-workspace.yaml');
  const catalog = {};
  if (fs.existsSync(pnpmWorkspacePath)) {
    const yaml = fs.readFileSync(pnpmWorkspacePath, 'utf8');
    let inCatalog = false;
    for (const line of yaml.split('\n')) {
      if (/^catalog:\s*$/.test(line)) {
        inCatalog = true;
        continue;
      }
      if (inCatalog && line.length > 0 && !line.startsWith('  ')) {
        inCatalog = false;
      }
      if (inCatalog && line.startsWith('  ')) {
        const match = line.match(/^\s+['"]?([^'":]+)['"]?:\s*['"]?([^'"]+)['"]?\s*$/);
        if (match) {
          catalog[match[1]] = match[2].trim();
        }
      }
    }
  }
  return catalog;
}

function getWorkspaceVersions(rootDir) {
  const versions = {};
  const libsDir = path.join(rootDir, 'libs');
  if (fs.existsSync(libsDir)) {
    for (const entry of fs.readdirSync(libsDir)) {
      const pkgPath = path.join(libsDir, entry, 'package.json');
      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
          if (pkg.name && pkg.version) {
            versions[pkg.name] = pkg.version;
          }
        } catch {
          // ignore invalid json
        }
      }
    }
  }
  return versions;
}

function sanitizePackageJson(dir) {
  const pkgJsonPath = path.join(dir, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) return;

  const rootDir = process.cwd();
  const catalog = getCatalogVersions(rootDir);
  const workspaceVersions = getWorkspaceVersions(rootDir);

  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  let modified = false;

  for (const depField of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
    if (pkgJson[depField] && typeof pkgJson[depField] === 'object') {
      for (const [depName, versionSpec] of Object.entries(pkgJson[depField])) {
        if (typeof versionSpec === 'string') {
          if (versionSpec.startsWith('workspace:')) {
            const resolvedVer = workspaceVersions[depName] || '22.0.0';
            pkgJson[depField][depName] = `^${resolvedVer}`;
            modified = true;
          } else if (versionSpec.startsWith('catalog:')) {
            const resolvedVer = catalog[depName] || '^2.8.1';
            pkgJson[depField][depName] = resolvedVer;
            modified = true;
          }
        }
      }
    }
  }

  if (pkgJson.sideEffects === undefined) {
    pkgJson.sideEffects = false;
    modified = true;
  }

  if (modified) {
    console.log(`Sanitized package.json dependencies and metadata in: ${pkgJsonPath}`);
    fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n', 'utf8');
  }
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
sanitizePackageJson(resolvedTargetDir);
