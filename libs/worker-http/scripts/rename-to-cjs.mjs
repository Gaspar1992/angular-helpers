#!/usr/bin/env node
/* oxlint-disable no-console */
import { cpSync, existsSync } from 'node:fs';
import { readdir, rename, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const schematicsDir = '../../dist/worker-http/schematics';

function copyAssets() {
  cpSync('schematics/collection.json', join(schematicsDir, 'collection.json'));
  if (existsSync('schematics/ng-add/schema.json')) {
    cpSync('schematics/ng-add/schema.json', join(schematicsDir, 'ng-add/schema.json'));
  }
  if (existsSync('schematics/ng-add/files')) {
    cpSync('schematics/ng-add/files', join(schematicsDir, 'ng-add/files'), { recursive: true });
  }
}

async function renameFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await renameFiles(fullPath);
    } else if (entry.name.endsWith('.js')) {
      const newPath = fullPath.replace(/\.js$/, '.cjs');
      await rename(fullPath, newPath);
      console.log(`Renamed: ${fullPath} -> ${newPath}`);
    }
  }
}

async function updateCollectionJson() {
  const collectionPath = join(schematicsDir, 'collection.json');
  try {
    const content = await readFile(collectionPath, 'utf-8');
    const updated = content.replace(/\.js"/g, '.cjs"');
    await writeFile(collectionPath, updated);
    console.log('Updated collection.json');
  } catch {
    console.log('No collection.json to update');
  }
}

copyAssets();
await renameFiles(schematicsDir);
await updateCollectionJson();
