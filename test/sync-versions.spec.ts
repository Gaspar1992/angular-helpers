import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';

const FIXTURES_DIR = path.resolve(__dirname, 'fixtures/sync-test');

describe('sync-versions.js utility script', () => {
  beforeEach(() => {
    fs.mkdirSync(path.join(FIXTURES_DIR, 'src'), { recursive: true });
    // Write mock package.json
    fs.writeFileSync(
      path.join(FIXTURES_DIR, 'package.json'),
      JSON.stringify({ name: 'mock-pkg', version: '2.3.4' }, null, 2),
    );
    // Write mock source file
    fs.writeFileSync(
      path.join(FIXTURES_DIR, 'src/public-api.ts'),
      "export const other = 'val';\nexport const version = '1.0.0';\n",
    );
  });

  afterEach(() => {
    if (fs.existsSync(FIXTURES_DIR)) {
      fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
    }
  });

  it('should read version from package.json and update the version constant in the target file', () => {
    const scriptPath = path.resolve(__dirname, '../scripts/sync-versions.js');
    const sourceFile = path.join(FIXTURES_DIR, 'src/public-api.ts');

    // Run sync-versions.js
    execFileSync('node', [scriptPath, FIXTURES_DIR, 'src/public-api.ts'], { stdio: 'pipe' });

    // Assert version is updated
    const sourceContent = fs.readFileSync(sourceFile, 'utf8');
    expect(sourceContent).toContain("export const version = '2.3.4';");
    expect(sourceContent).toContain("export const other = 'val';");
    expect(sourceContent).not.toContain("export const version = '1.0.0';");
  });

  it('should preserve double quotes if they were used in the original source file', () => {
    const scriptPath = path.resolve(__dirname, '../scripts/sync-versions.js');
    const sourceFile = path.join(FIXTURES_DIR, 'src/public-api.ts');

    // Rewrite with double quotes
    fs.writeFileSync(sourceFile, 'export const version = "1.0.0";\n');

    execFileSync('node', [scriptPath, FIXTURES_DIR, 'src/public-api.ts'], { stdio: 'pipe' });

    const sourceContent = fs.readFileSync(sourceFile, 'utf8');
    expect(sourceContent).toContain('export const version = "2.3.4";');
  });

  it('should not update mtime of target file if version is already matching', async () => {
    const scriptPath = path.resolve(__dirname, '../scripts/sync-versions.js');
    const sourceFile = path.join(FIXTURES_DIR, 'src/public-api.ts');

    // Write already matched version
    fs.writeFileSync(sourceFile, "export const version = '2.3.4';\n");

    const initialMtime = fs.statSync(sourceFile).mtimeMs;

    // Small delay to ensure timestamp resolution difference if overwritten
    await new Promise((resolve) => setTimeout(resolve, 10));

    execFileSync('node', [scriptPath, FIXTURES_DIR, 'src/public-api.ts'], { stdio: 'pipe' });

    const finalMtime = fs.statSync(sourceFile).mtimeMs;
    expect(finalMtime).toBe(initialMtime);
  });

  it('should fail with exit code 1 if arguments are missing', () => {
    const scriptPath = path.resolve(__dirname, '../scripts/sync-versions.js');
    expect(() => {
      execFileSync('node', [scriptPath], { stdio: 'pipe' });
    }).toThrow();
  });
});
