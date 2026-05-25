#!/usr/bin/env node
import * as fs from 'node:fs';
import * as path from 'node:path';
import ts from 'typescript';

interface MethodDoc {
  name: string;
  signature: string;
  description: string;
  returns: string;
}

interface InputDoc {
  name: string;
  type: string;
  defaultValue?: string;
  description: string;
}

interface OutputDoc {
  name: string;
  type: string;
  description: string;
}

interface ServiceDoc {
  id: string;
  name: string;
  description: string;
  scope: 'root' | 'component' | 'provided';
  importPath: string;
  methods: MethodDoc[];
  example: string;
  browserSupport: string;
  requiresSecureContext: boolean;
  notes: string[];
  inputs?: InputDoc[];
  outputs?: OutputDoc[];
  [key: string]: any;
}

const PACKAGES = [
  {
    name: 'core',
    srcDir: 'packages/core/src',
    dataFile: 'src/app/docs/data/core.data.ts',
    varName: 'CORE_SERVICES',
  },
  {
    name: 'security',
    srcDir: 'packages/security/src',
    dataFile: 'src/app/docs/data/security.data.ts',
    varName: 'SECURITY_SERVICES',
  },
  {
    name: 'browser-web-apis',
    srcDir: 'packages/browser-web-apis/src',
    dataFile: 'src/app/docs/data/browser-web-apis.data.ts',
    varName: 'BROWSER_WEB_APIS_SERVICES',
  },
  {
    name: 'worker-http',
    srcDir: 'packages/worker-http',
    dataFile: 'src/app/docs/data/worker-http.data.ts',
    varName: 'WORKER_HTTP_ENTRIES',
  },
  {
    name: 'openlayers',
    srcDir: 'packages/openlayers',
    dataFile: 'src/app/docs/data/openlayers.data.ts',
    varName: 'OPENLAYERS_SERVICES',
  },
  {
    name: 'storage',
    srcDir: 'packages/storage/src',
    dataFile: 'src/app/docs/data/storage.data.ts',
    varName: 'STORAGE_SERVICES',
  },
];

console.log('🤖 Starting Docs-as-Code Metadata Generator...\n');

// Recursive scanner for .ts files
function getTsFiles(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== 'coverage' && file !== 'test') {
        results = results.concat(getTsFiles(filePath));
      }
    } else if (
      filePath.endsWith('.ts') &&
      !filePath.endsWith('.spec.ts') &&
      !filePath.endsWith('.d.ts')
    ) {
      results.push(filePath);
    }
  }
  return results;
}

function getJSDocComment(node: ts.Node): string {
  const jsDocNode = (node as any).jsDoc?.[0];
  if (jsDocNode) {
    if (typeof jsDocNode.comment === 'string') {
      return jsDocNode.comment.trim();
    }
    if (Array.isArray(jsDocNode.comment)) {
      return jsDocNode.comment
        .map((part: any) => part.text)
        .join('')
        .trim();
    }
  }
  return '';
}

function parseClassMethods(node: ts.ClassDeclaration): MethodDoc[] {
  const methods: MethodDoc[] = [];
  for (const member of node.members) {
    if (ts.isMethodDeclaration(member)) {
      const modifiers = ts.getModifiers(member);
      const isPrivateOrProtected = modifiers?.some(
        (mod) =>
          mod.kind === ts.SyntaxKind.PrivateKeyword || mod.kind === ts.SyntaxKind.ProtectedKeyword,
      );
      if (isPrivateOrProtected) continue;

      const name = member.name.getText();
      if (
        name.startsWith('_') ||
        name === 'ngOnInit' ||
        name === 'ngOnDestroy' ||
        name === 'constructor' ||
        name.startsWith('ngOn')
      ) {
        continue;
      }

      const params = member.parameters
        .map((p) => {
          const pName = p.name.getText();
          const pType = p.type ? p.type.getText() : 'any';
          const isOptional = p.questionToken ? '?' : '';
          return `${pName}${isOptional}: ${pType}`;
        })
        .join(', ');

      const returnType = member.type ? member.type.getText() : 'void';
      const signature = `${name}(${params}): ${returnType}`;
      const description = getJSDocComment(member);

      methods.push({
        name,
        signature,
        description: description || `Public method ${name}.`,
        returns: returnType,
      });
    }
  }
  return methods;
}

function parseClassInputsOutputs(node: ts.ClassDeclaration): {
  inputs: InputDoc[];
  outputs: OutputDoc[];
} {
  const inputs: InputDoc[] = [];
  const outputs: OutputDoc[] = [];

  for (const member of node.members) {
    if (ts.isPropertyDeclaration(member) && member.initializer) {
      const propName = member.name.getText();
      const init = member.initializer;

      let isInput = false;
      let isOutput = false;
      let isRequired = false;
      let typeArg = 'any';
      let defaultValue = undefined;

      if (ts.isCallExpression(init)) {
        const exprText = init.expression.getText();
        if (exprText === 'input' || exprText === 'input.required') {
          isInput = true;
          isRequired = exprText.endsWith('.required');
        } else if (exprText === 'output' || exprText === 'output.required') {
          isOutput = true;
          isRequired = exprText.endsWith('.required');
        }

        if (isInput || isOutput) {
          if (init.typeArguments && init.typeArguments.length > 0) {
            typeArg = init.typeArguments[0].getText();
          }
          if (init.arguments && init.arguments.length > 0) {
            defaultValue = init.arguments[0].getText();
          }
        }
      }

      const description =
        getJSDocComment(member) || `Reactive ${isInput ? 'input' : 'output'} property.`;

      if (isInput) {
        inputs.push({
          name: propName,
          type: typeArg,
          defaultValue:
            defaultValue !== undefined ? defaultValue : isRequired ? undefined : 'undefined',
          description,
        });
      } else if (isOutput) {
        outputs.push({
          name: propName,
          type: typeArg,
          description,
        });
      }
    }
  }
  return { inputs, outputs };
}

function formatValue(val: any, depth = 0): string {
  const indent = '  '.repeat(depth);
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (typeof val === 'boolean' || typeof val === 'number') return String(val);
  if (typeof val === 'string') {
    if (val.includes('\n') || val.includes('`')) {
      const escaped = val.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\${/g, '\\${');
      return `\`${escaped}\``;
    }
    const escaped = val.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `'${escaped}'`;
  }
  if (Array.isArray(val)) {
    if (val.length === 0) return '[]';
    const items = val.map((item) => `${indent}  ${formatValue(item, depth + 1)}`).join(',\n');
    return `[\n${items}\n${indent}]`;
  }
  if (typeof val === 'object') {
    const keys = Object.keys(val);
    if (keys.length === 0) return '{}';
    const props = keys
      .map((k) => {
        const keyStr = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : `'${k}'`;
        return `${indent}  ${keyStr}: ${formatValue(val[k], depth + 1)}`;
      })
      .join(',\n');
    return `{\n${props}\n${indent}}`;
  }
  return 'undefined';
}

function replaceArrayInContent(content: string, varName: string, newArrayString: string): string {
  const declaration = `export const ${varName}: ServiceDoc[] = [`;
  let declIndex = content.indexOf(declaration);
  let resolvedDecl = declaration;

  if (declIndex === -1) {
    const declarationAlt = `export const ${varName} = [`;
    declIndex = content.indexOf(declarationAlt);
    if (declIndex === -1) {
      throw new Error(`Could not find declaration for ${varName} in metadata file.`);
    }
    resolvedDecl = declarationAlt;
  }

  let bracketCount = 1;
  let i = declIndex + resolvedDecl.length;
  while (i < content.length && bracketCount > 0) {
    if (content[i] === '[') bracketCount++;
    else if (content[i] === ']') bracketCount--;
    i++;
  }

  let endIndex = i;
  if (content[endIndex] === ';') {
    endIndex++;
  }

  const before = content.substring(0, declIndex);
  const after = content.substring(endIndex);

  return `${before}${resolvedDecl}\n${newArrayString}\n];${after}`;
}

async function run() {
  for (const pkg of PACKAGES) {
    console.log(`📦 Processing package: @angular-helpers/${pkg.name}`);
    const files = getTsFiles(pkg.srcDir);

    if (files.length === 0) {
      console.log(`⚠️ No source files found for ${pkg.name}. Skipping.`);
      continue;
    }

    // Load existing metadata to merge
    const dataFilePath = path.resolve(pkg.dataFile);
    let existingServices: ServiceDoc[] = [];

    if (fs.existsSync(dataFilePath)) {
      try {
        const fileContent = fs.readFileSync(dataFilePath, 'utf-8');
        // Extract exported array dynamically using evaluation or tsx dynamic import
        const module = await import(dataFilePath);
        existingServices = module[pkg.varName] || [];
      } catch (err) {
        console.warn(`⚠️ Could not parse existing metadata for ${pkg.name}:`, err);
      }
    }

    const parsedServicesMap = new Map<string, Partial<ServiceDoc>>();

    // Create TypeScript compiler session
    const program = ts.createProgram(files, {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    });
    const checker = program.getTypeChecker();

    for (const sourceFile of program.getSourceFiles()) {
      if (sourceFile.isDeclarationFile) continue;

      ts.forEachChild(sourceFile, (node) => {
        let name = '';
        let isExported = false;
        let description = '';
        let methods: MethodDoc[] = [];
        let inputs: InputDoc[] = [];
        let outputs: OutputDoc[] = [];
        let isClass = false;

        // Check if node is exported
        const modifiers = ts.getModifiers(node as any);
        isExported = modifiers?.some((mod) => mod.kind === ts.SyntaxKind.ExportKeyword) ?? false;

        if (!isExported) return;

        if (ts.isClassDeclaration(node) && node.name) {
          name = node.name.getText();
          isClass = true;
          description = getJSDocComment(node);
          methods = parseClassMethods(node);
          const parsedIO = parseClassInputsOutputs(node);
          inputs = parsedIO.inputs;
          outputs = parsedIO.outputs;
        } else if (ts.isFunctionDeclaration(node) && node.name) {
          name = node.name.getText();
          description = getJSDocComment(node);
        } else {
          return;
        }

        // Generate ID from camelCase / PascalCase name
        const id = name
          .replace(/Service$/, '')
          .replace(/Component$/, '')
          .replace(/Directive$/, '')
          .replace(/([A-Z])/g, '-$1')
          .toLowerCase()
          .replace(/^-/, '');

        // Map categories dynamically
        let category: any = undefined;
        if (pkg.name === 'openlayers') {
          if (name.includes('Layer')) category = 'ol-layers';
          else if (name.includes('Control')) category = 'ol-controls';
          else if (name.includes('Military')) category = 'ol-military';
          else if (name.includes('Overlay') || name.includes('Popup')) category = 'ol-overlays';
          else category = 'ol-core';
        }

        parsedServicesMap.set(id, {
          id,
          name,
          description: description || `Helper ${name}.`,
          scope: isClass ? 'provided' : 'provided',
          importPath: `@angular-helpers/${pkg.name}`,
          methods,
          inputs: inputs.length > 0 ? inputs : undefined,
          outputs: outputs.length > 0 ? outputs : undefined,
          category,
        });
      });
    }

    // Merge logic: preserve manual metadata fields
    const mergedServices: ServiceDoc[] = [];

    // 1. Keep existing services, updating methods, inputs, and outputs if parsed
    for (const existing of existingServices) {
      const parsed = parsedServicesMap.get(existing.id);
      if (parsed) {
        // Merge! We overwrite ONLY structural parsed fields: methods, inputs, outputs
        const merged: ServiceDoc = {
          ...existing,
          methods: parsed.methods || existing.methods || [],
        };
        if (parsed.inputs !== undefined) merged.inputs = parsed.inputs;
        if (parsed.outputs !== undefined) merged.outputs = parsed.outputs;
        mergedServices.push(merged);
        parsedServicesMap.delete(existing.id); // Remove from maps so we know what is remaining
      } else {
        // Conceptual doc or concept not matching a class — preserve as-is!
        mergedServices.push(existing);
      }
    }

    // 2. Add any newly found services/components ONLY if explicitly marked with @docs or @service JSDoc tags
    for (const [id, parsed] of parsedServicesMap.entries()) {
      const comment = parsed.description || '';
      const hasDocsTag = comment.includes('@docs') || comment.includes('@service');

      if (hasDocsTag) {
        console.log(`✨ Discovered new API entry: ${parsed.name} (${id})`);
        const cleanDesc = comment
          .replace(/@docs/g, '')
          .replace(/@service/g, '')
          .trim();
        mergedServices.push({
          id: parsed.id!,
          name: parsed.name!,
          description: cleanDesc || `Helper ${parsed.name}.`,
          scope: parsed.scope!,
          importPath: parsed.importPath!,
          methods: parsed.methods || [],
          inputs: parsed.inputs,
          outputs: parsed.outputs,
          browserSupport: 'All modern browsers',
          requiresSecureContext: false,
          notes: [`Auto-generated note for ${parsed.name}. Please enrich.`],
          example: `// Example for ${parsed.name}`,
          category: parsed.category,
        });
      }
    }

    // Write back to file in clean, human-readable TypeScript syntax
    if (fs.existsSync(dataFilePath)) {
      const originalContent = fs.readFileSync(dataFilePath, 'utf-8');

      // Format the array into a beautiful TypeScript string
      const arrayItems = mergedServices
        .map((srv) => {
          const formatted = formatValue(srv, 1);
          return `  ${formatted}`;
        })
        .join(',\n');

      try {
        const updatedContent = replaceArrayInContent(originalContent, pkg.varName, arrayItems);
        fs.writeFileSync(dataFilePath, updatedContent, 'utf-8');
        console.log(`✅ Successfully updated ${pkg.dataFile}\n`);
      } catch (err: any) {
        console.error(`❌ Error updating ${pkg.dataFile}:`, err.message);
      }
    } else {
      console.log(`⚠️ Metadata file does not exist at ${pkg.dataFile}. Skipping write.`);
    }
  }
  console.log('🏁 Docs-as-Code Metadata Generation complete!');
}

run().catch((err) => {
  console.error('💥 Fatal error running generator:', err);
  process.exit(1);
});
