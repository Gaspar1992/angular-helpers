#!/bin/bash

# Script para crear nuevos packages en el monorepo

set -e

# Verificar si se proporcionó un nombre de package
if [ -z "$1" ]; then
    echo "❌ Error: Debes proporcionar un nombre para el package"
    echo "Uso: ./scripts/create-package.sh <nombre-package>"
    echo "Ejemplo: ./scripts/create-package.sh browser-storage"
    exit 1
fi

PACKAGE_NAME=$1
PACKAGE_DIR="packages/$PACKAGE_NAME"
PACKAGE_JSON_NAME="@angular-helpers/$PACKAGE_NAME"

echo "🚀 Creando package: $PACKAGE_JSON_NAME"

# Verificar si el package ya existe
if [ -d "$PACKAGE_DIR" ]; then
    echo "❌ Error: El package '$PACKAGE_NAME' ya existe en $PACKAGE_DIR"
    exit 1
fi

# Crear estructura de directorios
echo "📁 Creando estructura de directorios..."
mkdir -p "$PACKAGE_DIR/src"
mkdir -p "$PACKAGE_DIR/src/services"
mkdir -p "$PACKAGE_DIR/src/interfaces"
mkdir -p "$PACKAGE_DIR/src/utils"
mkdir -p "$PACKAGE_DIR/src/guards"

# Crear package.json
echo "📦 Creando package.json..."
cat > "$PACKAGE_DIR/package.json" << EOF
{
  "name": "$PACKAGE_JSON_NAME",
  "version": "0.1.0",
  "description": "Angular package para $PACKAGE_NAME",
  "main": "dist/$PACKAGE_NAME/$PACKAGE_NAME.d.ts",
  "types": "dist/$PACKAGE_NAME/$PACKAGE_NAME.d.ts",
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "ng-packagr -p ng-package.json",
    "build:watch": "ng-packagr -p ng-package.json --watch",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "clean": "rm -rf dist",
    "lint": "eslint src/**/*.ts",
    "prepublishOnly": "npm run build"
  },
  "keywords": [
    "angular",
    "typescript",
    "$PACKAGE_NAME"
  ],
  "author": "",
  "license": "MIT",
  "peerDependencies": {
    "@angular/core": "^21.0.0",
    "@angular/common": "^21.0.0",
    "@angular/platform-browser": "^21.0.0",
    "rxjs": "^7.0.0"
  }
}
EOF

# Crear ng-package.json
echo "📦 Creando ng-package.json..."
cat > "$PACKAGE_DIR/ng-package.json" << EOF
{
  "\$schema": "https://raw.githubusercontent.com/ng-packagr/ng-packagr/main/src/ng-package.schema.json",
  "dest": "../../dist/$PACKAGE_NAME",
  "lib": {
    "entryFile": "src/public-api.ts"
  }
}
EOF

# Crear public-api.ts
echo "📄 Creando public-api.ts..."
cat > "$PACKAGE_DIR/src/public-api.ts" << EOF
/*
 * Public API Surface for $PACKAGE_JSON_NAME
 */

// Services
export * from './services';

// Interfaces
export * from './interfaces';

// Utilities
export * from './utils';

// Guards
export * from './guards';
EOF

# Crear archivos base
echo "📄 Creando archivos base..."

# Services index
cat > "$PACKAGE_DIR/src/services/index.ts" << EOF
// Services for $PACKAGE_NAME
// Add your service exports here
EOF

# Interfaces index
cat > "$PACKAGE_DIR/src/interfaces/index.ts" << EOF
// Interfaces for $PACKAGE_NAME
// Add your interface exports here
EOF

# Utils index
cat > "$PACKAGE_DIR/src/utils/index.ts" << EOF
// Utilities for $PACKAGE_NAME
// Add your utility exports here
EOF

# Guards index
cat > "$PACKAGE_DIR/src/guards/index.ts" << EOF
// Guards for $PACKAGE_NAME
// Add your guard exports here
EOF

# Vitest config
cat > "$PACKAGE_DIR/vitest.config.ts" << EOF
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.spec.ts',
        '**/test-setup.ts'
      ]
    }
  }
});
EOF

# Test setup
cat > "$PACKAGE_DIR/src/test-setup.ts" << EOF
import { vi } from 'vitest';

// Mock de las APIs del navegador
Object.defineProperty(globalThis, 'navigator', {
  value: {
    // Add your navigator mocks here
  },
  writable: true
});

// Mock de otras APIs globales si es necesario
EOF

# README.md
cat > "$PACKAGE_DIR/README.md" << EOF
# $PACKAGE_JSON_NAME

Descripción del package $PACKAGE_NAME.

## Instalación

\`\`\`bash
npm install $PACKAGE_JSON_NAME
\`\`\`

## Uso

\`\`\`typescript
import { YourService } from '$PACKAGE_JSON_NAME';
\`\`\`

## Desarrollo

\`\`\`bash
# Build
npm run build

# Test
npm run test

# Watch mode
npm run build:watch
\`\`\`

## Licencia

MIT
EOF

# Instalar dependencias del workspace
echo "📦 Instalando dependencias del workspace..."
cd ..
npm install

echo ""
echo "✅ Package '$PACKAGE_JSON_NAME' creado exitosamente!"
echo ""
echo "📍 Ubicación: $PACKAGE_DIR/"
echo ""
echo "🚀 Próximos pasos:"
echo "   1. Agrega tus servicios en: $PACKAGE_DIR/src/services/"
echo "   2. Exporta tus APIs en: $PACKAGE_DIR/src/public-api.ts"
echo "   3. Escribe tests en: $PACKAGE_DIR/src/**/*.spec.ts"
echo "   4. Build con: npm run build (desde root o desde package)"
echo "   5. Test con: npm run test (desde root o desde package)"
echo ""
echo "📚 El package está listo para desarrollarse!"
echo "💡 Las dependencias se comparten desde el workspace root"
