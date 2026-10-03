# 🗺️ @angular-helpers/openlayers/core

Core sub-entry point for `@angular-helpers/openlayers`. Provides the foundational `<ol-map>` container component, `OlMapService`, projections setup, and geometric calculation services.

---

## Quick Path

### 1. Installation

```bash
pnpm add @angular-helpers/openlayers ol
```

### 2. Usage

```typescript
import { Component } from '@angular/core';
import { OlMapComponent } from '@angular-helpers/openlayers/core';

@Component({
  selector: 'app-base-map',
  imports: [OlMapComponent],
  template: ` <ol-map [center]="[0, 0]" [zoom]="2" class="w-full h-[400px] block" /> `,
})
export class BaseMapComponent {}
```

---

## Primitives & Services

| Primitive                | Category  | Description                                                                               |
| :----------------------- | :-------- | :---------------------------------------------------------------------------------------- |
| `OlMapComponent`         | Component | The root map canvas container with reactive `center`, `zoom`, and `rotation` inputs.      |
| `OlMapService`           | Service   | Scoped service providing programmatic access to the underlying OpenLayers `Map` instance. |
| `GeometryService`        | Service   | Geodesic distance, area, and bearing calculations.                                        |
| `provideOpenLayers(...)` | Provider  | Configures OpenLayers environment providers, projection systems, and feature modules.     |

---

## Documentation

Full documentation and interactive examples:
👉 **[Angular Helpers OpenLayers Docs](https://gaspar1992.github.io/angular-helpers/docs/openlayers)**

---

## License

MIT
