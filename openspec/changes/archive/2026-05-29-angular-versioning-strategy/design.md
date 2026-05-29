# Technical Design — Angular Versioning Strategy

## 1. Routing & State Strategy: Signal Service with Query Parameters

Rather than adopting a route-based structure (e.g., `/docs/v21/core` vs `/docs/v22/core`), we will use a **global Signal service synchronized with query parameters** (e.g., `/docs/core?v=21`).

### Rationale

- **Simple Routes**: Keeps routing configuration clean and DRY without nested path parameters or route wildcards.
- **Bookmarkable & Linkable**: Query parameters guarantee that shared URLs preserve the selected documentation version.
- **Seamless Toggling**: Users can toggle versions on any detail page without route layout destruction or state loss.
- **Single Source of Truth**: The active route query parameter (`v`) drives the reactive signal in `DocsVersionService`, ensuring correct state.

---

## 2. Versioned Data Organization: Subfolder Isolation

To organize files under `src/app/docs/data/`, we will isolate files into **subfolders by Angular version**:

```text
src/app/docs/data/
├── v21/
│   ├── browser-web-apis.data.ts
│   ├── core.data.ts
│   └── ...
└── v22/
    ├── browser-web-apis.data.ts
    ├── core.data.ts
    └── ...
```

### Rationale

- **Zero-Risk Iteration**: Modifying v22 data will never accidentally break or modify historical v21 content.
- **Scalability**: Adding support for a new version (e.g., v23) is as straightforward as duplicating the folder and updating the APIs.
- **Dynamic Resolving**: Centralized resolvers dynamically map imports using standard dictionary mapping based on the active version.

---

## 3. Component Architecture & Structural Plan

### 3.1 `DocsVersionService` (`src/app/docs/services/docs-version.service.ts`)

A root-provided Angular service managing the active version state.

```typescript
import { Injectable, signal, computed, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

export type AngularVersion = '21' | '22';

@Injectable({ providedIn: 'root' })
export class DocsVersionService {
  private readonly router = inject(Router);
  private readonly defaultVersion: AngularVersion = '22';

  // Backing writeable signal
  readonly activeVersionSignal = signal<AngularVersion>(this.defaultVersion);

  // Public readonly computed signal
  readonly version = computed(() => this.activeVersionSignal());

  setVersion(version: AngularVersion) {
    this.activeVersionSignal.set(version);
    this.router.navigate([], {
      queryParams: { v: version },
      queryParamsHandling: 'merge',
    });
  }
}
```

### 3.2 `VersionDropdownComponent` (`src/app/docs/shared/version-dropdown.component.ts`)

A highly accessible, standalone, OnPush component placed in the Topbar layout.

```typescript
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { DocsVersionService, AngularVersion } from '../services/docs-version.service';

@Component({
  selector: 'app-version-dropdown',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative inline-block text-left">
      <label for="version-select" class="sr-only">Select Angular Version</label>
      <select
        id="version-select"
        [value]="versionService.version()"
        (change)="onVersionChange($event)"
        class="bg-base-200 text-base-content text-xs font-bold py-1.5 px-3 rounded-lg border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
      >
        <option value="22">Angular v22 (Latest)</option>
        <option value="21">Angular v21</option>
      </select>
    </div>
  `,
})
export class VersionDropdownComponent {
  protected readonly versionService = inject(DocsVersionService);

  protected onVersionChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.versionService.setVersion(select.value as AngularVersion);
  }
}
```

### 3.3 Routing & Resolvers Updates

- **Routing Setup**: `DocsLayoutComponent` synchronizes the query parameter to the `DocsVersionService` on initialization/navigation using `ActivatedRoute` query params subscription.
- **Resolvers Integration**: Both `overviewResolver` and `serviceDetailResolver` inject `DocsVersionService`, load data from the corresponding subfolder based on the current active version, and feed the pages.

---

## 4. Testing Strategy (Vitest)

Tests will be implemented under `src/app/docs/services/docs-version.service.spec.ts` and `src/app/docs/shared/version-dropdown.component.spec.ts`.

### 4.1 Service Tests

- Assert defaults to `v22`.
- Assert `setVersion` updates the signal state.
- Assert `setVersion` triggers router navigation with the corresponding `v` query parameter.

### 4.2 Component Tests

- Assert correct standard selection rendering.
- Verify dropdown interaction triggers `setVersion` call in `DocsVersionService`.
- Verify full keyboard accessibility and screen-reader friendliness (ARIA compliance).
