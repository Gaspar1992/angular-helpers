import type { ServiceDoc } from '../models/doc-meta.model';

export const SCHEMATICS_SERVICES: ServiceDoc[] = [
  {
    id: 'create-package',
    name: 'create-package',
    description:
      'Nx/Angular CLI schematic that scaffolds a new @angular-helpers library package with ng-packagr config, strict TypeScript setup, Vitest integration, and automatic root tsconfig.json path mapping.',
    scope: 'provided',
    importPath: '@angular-helpers/schematics',
    requiresSecureContext: false,
    browserSupport: 'Node.js >= 24.15.0 (CLI)',
    notes: [
      'Validates package name (lowercase kebab-case) and rejects collisions with existing directories.',
      'Updates root tsconfig.json compilerOptions.paths using exact key matching.',
      'Generates ng-package.json, project.json, package.json, README.md, and src/public-api.ts.',
    ],
    methods: [
      {
        name: 'name',
        signature: '--name=<kebab-case-name>',
        description: 'Required package name (e.g. my-feature). Creates libs/<name>/.',
        returns: 'Rule',
      },
      {
        name: 'description',
        signature: '--description="<text>"',
        description: 'Optional package description written to package.json and README.md.',
        returns: 'Rule',
      },
    ],
    example: `# Generate a new @angular-helpers library package
pnpm exec schematics @angular-helpers/schematics:create-package --name=my-feature

# Or via Nx / Angular CLI
pnpm nx g @angular-helpers/schematics:create-package --name=my-feature`,
  },
];
