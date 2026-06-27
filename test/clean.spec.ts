import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

const FIXTURES_DIR = path.resolve(__dirname, 'fixtures/clean-test');

describe('clean.js utility script', () => {
  beforeEach(() => {
    // Create mock directories and files
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
    fs.mkdirSync(path.join(FIXTURES_DIR, 'dist'), { recursive: true });
    fs.mkdirSync(path.join(FIXTURES_DIR, '.angular'), { recursive: true });
    fs.mkdirSync(path.join(FIXTURES_DIR, 'packages/pkg-a/dist'), { recursive: true });
    fs.mkdirSync(path.join(FIXTURES_DIR, 'keep-me'), { recursive: true });
    fs.writeFileSync(path.join(FIXTURES_DIR, 'dist/index.js'), 'console.log("hello");');
    fs.writeFileSync(path.join(FIXTURES_DIR, '.angular/cache.json'), '{}');
    fs.writeFileSync(
      path.join(FIXTURES_DIR, 'packages/pkg-a/dist/index.js'),
      'console.log("pkg-a");',
    );
    fs.writeFileSync(path.join(FIXTURES_DIR, 'keep-me/index.js'), 'console.log("keep");');
  });

  afterEach(() => {
    if (fs.existsSync(FIXTURES_DIR)) {
      fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
    }
  });

  it('should delete specified paths when passed as arguments', () => {
    const scriptPath = path.resolve(__dirname, '../scripts/clean.js');
    const target1 = path.join(FIXTURES_DIR, 'dist');
    const target2 = path.join(FIXTURES_DIR, '.angular');

    expect(fs.existsSync(target1)).toBe(true);
    expect(fs.existsSync(target2)).toBe(true);

    // Run clean.js with arguments
    execSync(`node ${scriptPath} "${target1}" "${target2}"`, { stdio: 'pipe' });

    // These should be deleted
    expect(fs.existsSync(target1)).toBe(false);
    expect(fs.existsSync(target2)).toBe(false);
  });

  it('should clean default directories relative to cwd when no arguments are passed', () => {
    const scriptPath = path.resolve(__dirname, '../scripts/clean.js');
    const rootDist = path.join(FIXTURES_DIR, 'dist');
    const rootAngular = path.join(FIXTURES_DIR, '.angular');
    const pkgDist = path.join(FIXTURES_DIR, 'packages/pkg-a/dist');
    const keepMe = path.join(FIXTURES_DIR, 'keep-me');

    expect(fs.existsSync(rootDist)).toBe(true);
    expect(fs.existsSync(rootAngular)).toBe(true);
    expect(fs.existsSync(pkgDist)).toBe(true);
    expect(fs.existsSync(keepMe)).toBe(true);

    // Run clean.js with no arguments, setting cwd to FIXTURES_DIR
    execSync(`node ${scriptPath}`, { cwd: FIXTURES_DIR, stdio: 'pipe' });

    // Default folders should be deleted
    expect(fs.existsSync(rootDist)).toBe(false);
    expect(fs.existsSync(rootAngular)).toBe(false);
    expect(fs.existsSync(pkgDist)).toBe(false);
    // Non-default folder should NOT be deleted
    expect(fs.existsSync(keepMe)).toBe(true);
  });

  it('should handle non-existent directories gracefully without crashing', () => {
    const scriptPath = path.resolve(__dirname, '../scripts/clean.js');
    const nonExistent = path.join(FIXTURES_DIR, 'does-not-exist');

    expect(fs.existsSync(nonExistent)).toBe(false);

    // Running with non-existent dir as argument should not fail
    expect(() => {
      execSync(`node ${scriptPath} "${nonExistent}"`, { stdio: 'pipe' });
    }).not.toThrow();
  });
});
