# Spec: Web Structural Overhaul + DaisyUI + Narrative Alignment

## 1. Folder Convention

### REQ-S-01: Canonical section structure

Every top-level route section MUST adopt this internal structure:

```
src/app/<section>/
├── <section>.component.ts       ← entry page (lazy-loaded by app.routes.ts)
├── <section>.routes.ts          ← self-contained child routing (if sub-routes exist)
├── ui/                          ← presentational/dumb components (no domain service injection)
├── feature/                     ← smart/container components (use services, signals)
├── config/                      ← constants, data arrays, static config (no side effects)
├── models/                      ← TypeScript interfaces and types
├── store/                       ← signal-based state (may be empty; only create if needed)
└── services/                    ← section-scoped services (NOT providedIn: 'root')
```

Sections in scope: `home/`, `demo/`, `docs/`, `blog/` (new).

### REQ-S-02: Black-box entry point

- `app.routes.ts` imports ONLY a section's entry component or its routes file.
- No cross-section component/service imports allowed — only via `app/shared/` or `app/core/`.
- Each section declares its own `providers: []` at route level for scoped DI.

### REQ-S-03: Shared vs Core distinction

**`src/app/shared/`** — deduplication boundary:

- Contains components, models, and pipes used in **2 or more** sections.
- Single-section code MUST NOT live here.

**`src/app/core/`** — global systems boundary:

- Global configuration, i18n, app-wide constants, systems that affect the entire web.
- NOT for reusable UI components.

### REQ-S-04: Shared components routing

| Component      | Used in          | Target               |
| -------------- | ---------------- | -------------------- |
| `code-window`  | home, docs       | `shared/components/` |
| `site-footer`  | home, docs, blog | `shared/components/` |
| `site-nav`     | all sections     | `shared/components/` |
| `feature-card` | home only        | `home/ui/`           |
| `package-card` | home only        | `home/ui/`           |
| `stats-bar`    | home only        | `home/ui/`           |

### REQ-S-05: features/ elimination

`src/app/features/docs/` MUST be absorbed into `src/app/docs/feature/`. The top-level `src/app/features/` directory is removed.

---

## 2. Design System — Tailwind v4 + DaisyUI v5

### REQ-D-01: Installation

- `tailwindcss@^4` and `daisyui@^5` added to `devDependencies`.
- `@tailwindcss/vite` plugin registered in `vite.config.ts` (Angular 21 uses Vite).
- No `tailwind.config.js` — CSS-first configuration only.

`styles.css` MUST begin with:

```css
@import 'tailwindcss';
@plugin "daisyui";
```

### REQ-D-02: Custom DaisyUI theme

A theme named `angular-helpers` MUST be defined mapping the existing palette:

```css
@plugin "daisyui" {
  themes: [ 'angular-helpers'];
}

[data-theme='angular-helpers'] {
  --color-primary: #6b8cf2;
  --color-base-100: #0f1117;
  --color-base-200: #1a1c28;
  --color-base-300: #13151f;
  --color-neutral: #1e1e2e;
  --color-base-content: #e0e4f0;
}
```

`<html>` in `index.html` MUST have `data-theme="angular-helpers"`.

### REQ-D-03: CSS token bridge

Existing `--sp-*`, `--border`, `--accent`, `--font-*` tokens MUST remain in `:root` during migration. They are removed section-by-section as components are converted.

### REQ-D-04: Component CSS rule

- **New components**: Tailwind + DaisyUI utility classes ONLY. No `.component.css`.
- **Migrated components**: Convert all styles to utilities. Delete `.component.css` when empty.
- **Global `styles.css`**: Tailwind import + DaisyUI theme + base reset + `highlight.js` overrides ONLY.

### REQ-D-05: Mobile-first

All layout CSS MUST use mobile-first breakpoints (`sm:`, `md:`, `lg:`). No desktop-first overrides.

---

## 3. Core — Global Systems

### REQ-C-01: i18n system

`src/app/core/i18n/` MUST contain:

- `en.ts` — English strings (source of truth, all UI copy)
- `i18n.service.ts` — Signal-based service to get/switch language
- `i18n.token.ts` — injection token or provide function

All section `config/` data files MUST source their display strings from `core/i18n/en.ts`. No raw string literals in templates — use the i18n service or config arrays that reference i18n keys.

### REQ-C-02: App-level config

`src/app/core/config/` MUST contain:

- `packages.data.ts` — canonical `PackageInfo[]` (migrated from `home.config.ts`)
- `nav.data.ts` — navigation structure used by `site-nav`
- `app.constants.ts` — app-wide constants (repo URL, org name, etc.)

Stats derived from package count MUST be computed from `packages.data.ts`, not hardcoded.

### REQ-C-03: PackageInfo shape

```typescript
export interface PackageInfo {
  icon: string;
  name: string;
  npmPackage: string;
  tagline: string; // one-sentence pitch
  description: string;
  highlights: string[];
  highlightsLabel: string;
  installCmd: string;
  docsLink: string;
  demoLink: string | null;
  badge: string | null;
  promise: string; // lightweight | robust | performance
}
```

---

## 4. Blog Section

### REQ-B-01: New section

`src/app/blog/` MUST be created with canonical structure. Entry route: `/blog`.

### REQ-B-02: First article

First article slug: `web-redesign-and-library-vision`.

Content covers:

- Why we redesigned the web
- Core principles of `@angular-helpers` as a library ecosystem
- What each package stands for
- Technical decisions made (Tailwind v4, DaisyUI v5, folder conventions, testing strategy)

### REQ-B-03: Article model

```typescript
export interface BlogPost {
  slug: string;
  title: string;
  publishedAt: string; // ISO date
  tags: string[];
  excerpt: string;
  contentPath: string; // path to markdown or inline component
}
```

---

## 5. Demo Section

### REQ-Demo-01: library-services-harness

Route `/demo/library-services` remains valid. It is NOT listed in the demo navigation. It is accessible by direct URL. The route's page MUST have a visible note: _"Internal harness — not part of the public demo"_.

### REQ-Demo-02: Section structure

`demo/` sub-sections (`security/`, `browser-apis/`, `worker-http/`) each follow the same internal convention:

```
demo/<sub-section>/
├── index.ts or <sub>.component.ts   ← entry
├── ui/
├── config/
└── services/ (if overriding anything)
```

---

## 6. Testing

### REQ-T-01: Web-level Playwright tests per section

Each section MUST have a Playwright test file in `test/web/<section>.spec.ts` verifying:

1. **Rendering**: Key content (headings, CTAs, navigation links) is visible.
2. **DI health**: No console errors on page load (catches injection failures).
3. **Accessibility baseline**: `@axe-core/playwright` AXE scan with zero critical/serious violations.

### REQ-T-02: Test coverage targets

| Section | Tests                                                          |
| ------- | -------------------------------------------------------------- |
| home    | Hero heading, CTA buttons, package cards, stats bar, nav links |
| docs    | Landing heading, package nav links, no 404 on known routes     |
| demo    | Nav items (public), harness NOT in nav                         |
| blog    | First article link appears in list                             |

---

## 7. Narrative

### REQ-N-01: Core value proposition (home hero)

> _"Every Angular app solves the same browser problems. We solved them once — typed, tested, tree-shakable."_

### REQ-N-02: Per-package promise

| Package            | Tagline                                                  | Promise keyword |
| ------------------ | -------------------------------------------------------- | --------------- |
| `browser-web-apis` | 37 typed Angular services for the browser. One provider. | `lightweight`   |
| `security`         | Worker-isolated, ReDoS-safe security primitives.         | `robust`        |
| `worker-http`      | HTTP off the main thread. Non-blocking by design.        | `performance`   |

---

## 8. Routing

### REQ-R-01: Updated app routes

```
/               → home/home.component.ts
/demo           → demo/demo.routes.ts (children self-contained)
/docs           → docs/docs.routes.ts (children self-contained)
/blog           → blog/blog.routes.ts (children self-contained)
/**             → redirect to /
```

---

## 9. Acceptance Criteria

| ID    | Criterion                                               | Verifiable by             |
| ----- | ------------------------------------------------------- | ------------------------- |
| AC-01 | `src/app/features/` does not exist                      | `ls src/app/`             |
| AC-02 | All 4 sections have `ui/`, `feature/`, `config/`        | `ls src/app/<section>/`   |
| AC-03 | `tailwindcss` + `daisyui` in `package.json` devDeps     | `cat package.json`        |
| AC-04 | `data-theme="angular-helpers"` on `<html>`              | `cat src/index.html`      |
| AC-05 | No `.component.css` files with content remain           | `grep -r "styleUrl"`      |
| AC-06 | `src/app/core/config/packages.data.ts` exists           | `ls src/app/core/`        |
| AC-07 | `src/app/core/i18n/en.ts` exists                        | `ls src/app/core/i18n/`   |
| AC-08 | Blog section exists with first article                  | `ls src/app/blog/`        |
| AC-09 | `/demo/library-services` accessible but NOT in demo nav | Playwright test           |
| AC-10 | AXE zero critical violations on home, docs, blog        | Playwright + axe          |
| AC-11 | All existing Playwright library tests still pass        | `npm run test:browser:ci` |
| AC-12 | `npm run lint` + `npm run format:check` clean           | CI / local                |

---

## 10. Constraints

- Angular 21, signals-first, no NgModules
- `ChangeDetectionStrategy.OnPush` on every component
- No `standalone: true` in decorators (default in v20+)
- No `@HostBinding` / `@HostListener` — use `host: {}` object
- SSR compatible (`@angular/ssr` active)
- All copy in English (i18n system ready for future languages)
- Mobile-first breakpoints throughout
