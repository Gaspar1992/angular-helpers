import {
  Rule,
  SchematicContext,
  Tree,
  apply,
  applyTemplates,
  chain,
  mergeWith,
  move,
  url,
  SchematicsException,
} from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { strings } from '@angular-devkit/core';
import { Schema } from './schema';

function updateTsConfig(options: Schema): Rule {
  return (tree: Tree) => {
    const tsconfigPath = 'tsconfig.json';
    if (!tree.exists(tsconfigPath)) {
      throw new SchematicsException(`Root tsconfig.json not found.`);
    }

    const contentBytes = tree.read(tsconfigPath);
    if (!contentBytes) {
      throw new SchematicsException(`Could not read root tsconfig.json.`);
    }

    const content = contentBytes.toString('utf-8');

    // Check if mapping already exists to prevent duplicate entries
    const searchString = `@angular-helpers/${options.name}`;
    if (content.includes(searchString)) {
      return tree;
    }

    const wildcardPattern =
      /([\t ]*)("@angular-helpers\/\*":\s*\[\s*"\.\/packages\/\*\/src\/index\.ts"\s*\])/;
    if (!wildcardPattern.test(content)) {
      throw new SchematicsException(
        `Could not find wildcard mapping "@angular-helpers/*" in tsconfig.json paths.`,
      );
    }

    const newMapping = `"@angular-helpers/${options.name}": ["./packages/${options.name}/src/index.ts"],`;
    const updated = content.replace(
      wildcardPattern,
      (_, indent, line) => `${indent}${newMapping}\n${indent}${line}`,
    );

    tree.overwrite(tsconfigPath, updated);
    return tree;
  };
}

export function createPackage(options: Schema): Rule {
  return (_tree: Tree, context: SchematicContext) => {
    // Validate package name using the pattern from schema.json
    const nameRegex = /^[a-z][a-z0-9-]*$/;
    if (!nameRegex.test(options.name)) {
      throw new SchematicsException(
        `Invalid package name: "${options.name}". Name must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens.`,
      );
    }

    const templateSource = apply(url('./files'), [
      applyTemplates({
        ...options,
        ...strings,
      }),
      move(`packages/${options.name}`),
    ]);

    // Schedule post-install node package task
    context.addTask(
      new NodePackageInstallTask({
        packageManager: 'pnpm',
      }),
    );

    return chain([mergeWith(templateSource), updateTsConfig(options)]);
  };
}
