# Angular Helpers

Monorepo de utilidades y packages para Angular.

## 📦 Estructura del Proyecto

Este es un monorepo que contiene:

- **Aplicación demo**: Proyecto Angular principal en `src/`
- **Packages publicables**: Bibliotecas reutilizables en `packages/`

## 🚀 Scripts Disponibles

### Aplicación Principal
```bash
npm start          # Iniciar aplicación de desarrollo
npm run build      # Build de producción
npm test           # Ejecutar tests
```

### Gestión de Packages

#### 📦 Build de Packages

Este monorepo utiliza **ng-packagr** para construir los paquetes Angular de manera estándar y distribuible.

##### Build Individual

```bash
# Construir un package específico
cd packages/browser-web-apis
npm run build

# Watch mode para desarrollo
npm run build:watch
```

##### Build de Todos los Packages

```bash
# Construir todos los packages del workspace
npm run build:packages
```

##### Estructura de Build

Cada package genera su distribución en `dist/[package-name]/`:

```
dist/
└── browser-web-apis/
    ├── package.json              # Package.json limpio para distribución
    ├── fesm2022/                 # ES Modules
    │   ├── angular-helpers-browser-web-apis.mjs
    │   └── angular-helpers-browser-web-apis.mjs.map
    └── types/                    # Declaraciones TypeScript
        └── angular-helpers-browser-web-apis.d.ts
```

## 🏗️ Estructura del Workspace

Este es un **monorepo Angular** que utiliza npm workspaces para gestionar múltiples paquetes de manera eficiente.

```
angular-helpers/
├── packages/                    # Paquetes Angular
│   └── browser-web-apis/       # Package de Browser Web APIs
├── src/                       # Aplicación principal de demo
├── scripts/                   # Scripts de automatización
├── dist/                      # Builds de distribución
└── package.json              # Configuración del workspace
```

### 🎯 Ventajas del Workspace

- **📦 Dependencias Compartidas** - Todas las dependencias viven en el root
- **⚡ Instalación Rápida** - Un solo `npm install` para todo
- **🔄 Versiones Consistentes** - Evita conflictos de versiones
- **🚀 Build Centralizado** - Scripts unificados para todos los packages
- **💾 Ahorro de Espacio** - No duplicar node_modules

##### Configuración de ng-packagr

Cada package incluye un `ng-package.json`:

```json
{
  "$schema": "https://raw.githubusercontent.com/ng-packagr/ng-packagr/main/src/ng-package.schema.json",
  "dest": "../../dist/browser-web-apis",
  "lib": {
    "entryFile": "src/public-api.ts"
  }
}
```

### 🔄 Workspace Management

#### Instalación de Dependencias
```bash
# Instalar todas las dependencias del workspace
npm install

# Agregar nueva dependencia al workspace
npm install --save <package>

# Agregar devDependency al workspace
npm install --save-dev <package>
```

#### Scripts del Workspace
```bash
# Ejecutar scripts en todos los packages
npm run build:packages
npm run test:packages
npm run lint

# Ejecutar script en un package específico
npm run build --workspace=@angular-helpers/browser-web-apis
npm run test --workspace=@angular-helpers/browser-web-apis
```

#### Crear Nuevo Package
```bash
# Crear un nuevo package con el script automatizado
./scripts/create-package.sh <nombre-package>

# Ejemplo:
./scripts/create-package.sh browser-storage
```

## 📦 Crear Nuevo Package

Usa el script automatizado:

```bash
./scripts/create-package.sh <package-name>
```

## 📦 Packages Disponibles

### @angular-helpers/browser-web-apis

Sistema de servicios Angular para acceso formalizado a Browser Web APIs.

**Features:**
- 📸 Cámara - Captura de fotos y video
- 🗺️ Geolocalización - GPS y watch position
- � Notificaciones - Sistema de notificaciones del navegador
- 📋 Clipboard - Copiar/pegar texto e imágenes
- 🔐 Permisos - Gestión centralizada de permisos
- 🎥 Media Devices - Enumeración de dispositivos de medios

**Instalación:**
```bash
npm install @angular-helpers/browser-web-apis
```

**Uso:**
```typescript
import { CameraService, GeolocationService } from '@angular-helpers/browser-web-apis';

@Component({...})
export class MyComponent {
  constructor(
    private cameraService: CameraService,
    private geolocationService: GeolocationService
  ) {}
}
```

## 🔧 Desarrollo

### Instalación
```bash
# Instalar todas las dependencias del workspace
npm install
```

### Desarrollo simultáneo
```bash
# Iniciar app principal y watch de packages
npm run dev
```

### Scripts de Desarrollo
```bash
# Build de todos los packages
npm run build:packages

# Test de todos los packages
npm run test:packages

# Lint de todo el workspace
npm run lint

# Limpiar builds
npm run clean
```

### Flujo de Trabajo
1. **Desarrollo**: `npm run dev` (app + packages)
2. **Testing**: `npm run test:packages` 
3. **Build**: `npm run build:packages`
4. **Lint**: `npm run lint`

## 📄 Licencia

MIT
