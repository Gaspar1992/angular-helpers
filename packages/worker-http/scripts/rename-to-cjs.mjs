#!/usr/bin/env node
import { readdir, rename, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const schematicsDir = '../../dist/packages/worker-http/schematics';

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

await renameFiles(schematicsDir);
await updateCollectionJson();
