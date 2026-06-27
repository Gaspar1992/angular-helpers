import fs from 'node:fs';
import path from 'node:path';

const pkgDir = process.argv[2];
const relativeFilePath = process.argv[3];

if (!pkgDir || !relativeFilePath) {
  console.error(
    'Usage: node scripts/sync-versions.js <package_directory> <relative_source_file_path>',
  );
  process.exit(1);
}

const resolvedPkgDir = path.resolve(pkgDir);
const pkgJsonPath = path.join(resolvedPkgDir, 'package.json');
const sourceFilePath = path.join(resolvedPkgDir, relativeFilePath);

if (!fs.existsSync(pkgJsonPath)) {
  console.error(`Error: package.json not found in ${resolvedPkgDir}`);
  process.exit(1);
}

if (!fs.existsSync(sourceFilePath)) {
  console.error(`Error: source file not found at ${sourceFilePath}`);
  process.exit(1);
}

// 1. Read package version
const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
const version = pkgJson.version;
if (!version) {
  console.error(`Error: "version" not found in package.json at ${pkgJsonPath}`);
  process.exit(1);
}

// 2. Read source file
const content = fs.readFileSync(sourceFilePath, 'utf8');

// 3. Regex for version constant (supporting single or double quotes, and optional semicolon)
const versionRegex = /(export\s+const\s+version\s*=\s*['"])([^'"]+)(['"];?)/;

if (!versionRegex.test(content)) {
  console.error(`Error: Could not find version constant export in ${sourceFilePath}`);
  process.exit(1);
}

const newContent = content.replace(versionRegex, `$1${version}$3`);

if (content !== newContent) {
  console.log(`Syncing version in ${relativeFilePath} to ${version}`);
  fs.writeFileSync(sourceFilePath, newContent, 'utf8');
} else {
  console.log(`Version in ${relativeFilePath} is already up to date (${version})`);
}
