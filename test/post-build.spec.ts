import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

const FIXTURES_DIR = path.resolve(__dirname, 'fixtures/post-build-test');

describe('post-build.js utility script', () => {
  beforeEach(() => {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
    // Write JS, CSS and map files
    fs.writeFileSync(
      path.join(FIXTURES_DIR, 'index.js'),
      'console.log("hello");\n//# sourceMappingURL=index.js.map\n',
    );
    fs.writeFileSync(path.join(FIXTURES_DIR, 'index.js.map'), '{"version":3,"file":"index.js"}');
    fs.writeFileSync(
      path.join(FIXTURES_DIR, 'styles.css'),
      '.btn { color: red; }\n/*# sourceMappingURL=styles.css.map */\n',
    );
    fs.writeFileSync(
      path.join(FIXTURES_DIR, 'styles.css.map'),
      '{"version":3,"file":"styles.css"}',
    );

    // Nested directory
    const nestedDir = path.join(FIXTURES_DIR, 'nested');
    fs.mkdirSync(nestedDir, { recursive: true });
    fs.writeFileSync(
      path.join(nestedDir, 'nested.js'),
      'console.log("nested");\n//# sourceMappingURL=nested.js.map\n',
    );
    fs.writeFileSync(path.join(nestedDir, 'nested.js.map'), '{"version":3,"file":"nested.js"}');

    // File without map comments
    fs.writeFileSync(path.join(FIXTURES_DIR, 'plain.js'), 'console.log("plain");\n');
  });

  afterEach(() => {
    if (fs.existsSync(FIXTURES_DIR)) {
      fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
    }
  });

  it('should recursively delete .map files and strip sourceMappingURL comments', () => {
    const scriptPath = path.resolve(__dirname, '../scripts/post-build.js');
    const jsFile = path.join(FIXTURES_DIR, 'index.js');
    const cssFile = path.join(FIXTURES_DIR, 'styles.css');
    const jsMapFile = path.join(FIXTURES_DIR, 'index.js.map');
    const cssMapFile = path.join(FIXTURES_DIR, 'styles.css.map');
    const nestedJsFile = path.join(FIXTURES_DIR, 'nested/nested.js');
    const nestedMapFile = path.join(FIXTURES_DIR, 'nested/nested.js.map');
    const plainJsFile = path.join(FIXTURES_DIR, 'plain.js');

    expect(fs.existsSync(jsMapFile)).toBe(true);
    expect(fs.existsSync(cssMapFile)).toBe(true);
    expect(fs.existsSync(nestedMapFile)).toBe(true);

    const initialPlainMtime = fs.statSync(plainJsFile).mtimeMs;

    // Run post-build.js
    execSync(`node ${scriptPath} "${FIXTURES_DIR}"`, { stdio: 'pipe' });

    // .map files should be deleted
    expect(fs.existsSync(jsMapFile)).toBe(false);
    expect(fs.existsSync(cssMapFile)).toBe(false);
    expect(fs.existsSync(nestedMapFile)).toBe(false);

    // Source map comments should be stripped in-place
    const jsContent = fs.readFileSync(jsFile, 'utf8');
    const cssContent = fs.readFileSync(cssFile, 'utf8');
    const nestedJsContent = fs.readFileSync(nestedJsFile, 'utf8');
    const plainJsContent = fs.readFileSync(plainJsFile, 'utf8');

    expect(jsContent).not.toContain('sourceMappingURL');
    expect(cssContent).not.toContain('sourceMappingURL');
    expect(nestedJsContent).not.toContain('sourceMappingURL');
    expect(plainJsContent).toContain('console.log("plain");');

    // Ensure original code is preserved
    expect(jsContent).toContain('console.log("hello");');
    expect(cssContent).toContain('.btn { color: red; }');
    expect(nestedJsContent).toContain('console.log("nested");');

    // Plain JS file should not have been rewritten (mtime should remain the same or content matches)
    const finalPlainMtime = fs.statSync(plainJsFile).mtimeMs;
    expect(initialPlainMtime).toBe(finalPlainMtime);
  });

  it('should fail with exit code 1 if no target directory is passed', () => {
    const scriptPath = path.resolve(__dirname, '../scripts/post-build.js');
    expect(() => {
      execSync(`node ${scriptPath}`, { stdio: 'pipe' });
    }).toThrow();
  });
});
