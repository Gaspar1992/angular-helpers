# Web Workers in Angular Applications - Deployment Strategies

When using `@angular-helpers/worker-http` with web workers, there are specific challenges when deploying to static hosting (GitHub Pages, Netlify, etc.) where direct route access returns a 404.

## The Problem

Angular CLI bundles web workers using `new Worker(new URL('./worker.ts', import.meta.url))`. However, when accessing a route directly (e.g., `/demo/worker-http`), the server returns `404.html`, which breaks `import.meta.url` resolution for workers.

## Solutions

### Option 1: Pre-transpiled Workers with Vite (Recommended)

Build workers separately and distribute as static assets. This works regardless of how users access your app.

**Setup in your Angular app:**

1. **Create `vite.config.ts` in your project root:**

```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: {
        'my.worker': resolve(__dirname, 'src/workers/my.worker.ts'),
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    outDir: 'public/assets/workers',
    emptyOutDir: true,
  },
});
```

2. **Add build script to `package.json`:**

```json
{
  "scripts": {
    "build:workers": "vite build",
    "build:all": "npm run build:workers && ng build"
  }
}
```

3. **Use `workerUrl` in your component:**

```typescript
import { createWorkerTransport } from '@angular-helpers/worker-http/transport';

const transport = createWorkerTransport({
  workerUrl: 'assets/workers/my.worker.js', // Resolves against base href
  maxInstances: 2,
});
```

4. **Add to `.gitignore`:**

```
public/assets/workers/
```

### Option 2: Angular CLI with 404.html Fallback

If you must use `workerFactory` with inline workers, configure your deployment:

**For GitHub Pages:**

1. **Update `.github/workflows/deploy.yml`:**

```yaml
- name: Build for GitHub Pages
  run: ng build --base-href /your-repo/

- name: Copy index.html → 404.html
  run: cp dist/your-app/browser/index.html dist/your-app/browser/404.html

- name: Add .nojekyll
  run: touch dist/your-app/browser/.nojekyll
```

2. **Ensure `<base href>` is correct:**

```html
<!-- In index.html -->
<base href="/your-repo/" />
```

3. **Use workerUrl instead of workerFactory:**

The library now supports `workerUrl` which resolves against `document.baseURI`, avoiding `import.meta.url` issues in 404.html context.

### Option 3: Custom Builder Configuration

For advanced cases, extend Angular CLI builder:

**`angular.json` modifications:**

```json
{
  "projects": {
    "your-app": {
      "architect": {
        "build": {
          "options": {
            "assets": [
              {
                "glob": "**/*",
                "input": "public"
              },
              {
                "glob": "**/*.worker.js",
                "input": "src/workers/dist",
                "output": "/assets/workers/"
              }
            ]
          }
        }
      }
    }
  }
}
```

### Option 4: Post-Build Worker Extraction

Use a script to extract and rename workers after Angular build:

**`scripts/extract-workers.js`:**

```javascript
const fs = require('fs');
const path = require('path');

const distPath = 'dist/your-app/browser';
const files = fs.readdirSync(distPath);

// Find and copy workers to predictable location
files.forEach((file) => {
  if (file.includes('worker') && file.endsWith('.js')) {
    fs.copyFileSync(
      path.join(distPath, file),
      path.join(distPath, 'assets', 'workers', 'my.worker.js'),
    );
  }
});
```

## Comparison

| Strategy               | Complexity | 404.html Support | Bundler Lock-in |
| ---------------------- | ---------- | ---------------- | --------------- |
| Vite pre-build         | Medium     | Yes              | No              |
| Angular CLI + 404.html | Low        | Partial          | Angular only    |
| Custom builder         | High       | Yes              | Angular only    |
| Post-build extraction  | Medium     | Yes              | No              |

## Recommendation

Use **Option 1 (Vite)** for libraries distributing pre-built workers, or when you need maximum compatibility with static hosting providers.

Use **Option 2** for simpler apps where you control the deployment and can ensure proper 404.html handling.
