---
version: '1.0.0'
name: 'Angular Helpers Design System'
description: 'Machine-readable design tokens and guidelines for Angular Helpers web applications and documentation.'
tokens:
  color:
    primary:
      default: 'oklch(69% 0.18 254)'
      active: 'color-mix(in oklch, var(--color-primary) 90%, black)'
      dim: 'color-mix(in oklch, var(--color-primary) 10%, transparent)'
    secondary:
      default: 'oklch(65% 0.2 285)'
    accent:
      default: 'oklch(75% 0.18 200)'
    status:
      info: 'oklch(70% 0.15 230)'
      success: 'oklch(72% 0.15 150)'
      warning: 'oklch(80% 0.15 85)'
      error: 'oklch(65% 0.18 25)'
    background:
      main: '#09090b'
      surface: '#18181b'
      elevated: '#1e1e2e'
    text:
      main: 'rgba(255, 255, 255, 0.9)'
      secondary: 'rgba(255, 255, 255, 0.6)'
      muted: 'rgba(255, 255, 255, 0.4)'
    border:
      default: 'color-mix(in oklch, white 15%, transparent)'
      subtle: 'color-mix(in oklch, white 8%, transparent)'
  typography:
    fontFamily:
      sans: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
    fontSize:
      xs: '0.75rem'
      sm: '0.875rem'
      base: '1rem'
      lg: '1.125rem'
      xl: '1.25rem'
      2xl: '1.5rem'
      3xl: '1.875rem'
      4xl: '2.25rem'
      5xl: '3rem'
    fontWeight:
      normal: 400
      medium: 500
      semibold: 600
      bold: 700
      black: 900
  spacing:
    1: '0.25rem'
    2: '0.5rem'
    3: '0.75rem'
    4: '1rem'
    6: '1.5rem'
    8: '2rem'
    10: '2.5rem'
    12: '3rem'
    16: '4rem'
  radii:
    xs: '0.125rem'
    sm: '0.25rem'
    md: '0.375rem'
    lg: '0.5rem'
    xl: '0.75rem'
    2xl: '1rem'
    3xl: '1.5rem'
    4xl: '2rem'
    full: '9999px'
  motion:
    durationFast: '150ms'
    durationNormal: '250ms'
    durationSlow: '350ms'
    easingDefault: 'cubic-bezier(0.16, 1, 0.3, 1)'
    easingSnappy: 'cubic-bezier(0.4, 0, 0.2, 1)'
---

# Angular Helpers Design System (DESIGN.md)

This document is the authoritative design contract for AI assistants, engineers, and designers working on the Angular Helpers web platform (`apps/web`). It follows the open-source **Google DESIGN.md specification**, combining machine-readable tokens (in the YAML front matter above) with human-and-agent readable design rules below.

---

## 1. Core Principles

1. **Performance & Lightweight First**:
   - Zero gratuitous dependencies. Never introduce heavy UI libraries when native CSS or Tailwind v4 tokens suffice.
   - Defer below-the-fold content using `@defer (on viewport; prefetch on idle)`.
   - Never cause Change Detection storms: respect OnPush and Zoneless architecture.

2. **Dark-Mode Native & Oklch Color Fidelity**:
   - The primary palette is built around `oklch()` color space for perceptually uniform lightness and vibrant hues.
   - Deep background layers (`#09090b`, `#18181b`, `#1e1e2e`) create atmospheric depth with ambient glowing radial gradients.

3. **Accessibility (WCAG AA Minimum)**:
   - All interactive text must achieve at least 4.5:1 contrast against its background (3:1 for large text).
   - Interactive elements must maintain explicit focus rings: `focus-visible:outline-2 focus-visible:outline-primary`.
   - Touch targets must be at least 44x44px on mobile devices.
   - Screen-reader accessible names are mandatory on icon-only buttons (`aria-label`, `aria-hidden="true"` on SVGs).

4. **Predictable Component Layouts**:
   - Prefer container queries (`@container`, `@3xl:gap-16`) over global media queries for self-contained components.
   - Max width container: `max-width-container` (max 1280px with responsive padding).

---

## 2. Color System & Semantic Roles

| Token                       | Semantic Role            | Usage & Guidelines                                                                 |
| :-------------------------- | :----------------------- | :--------------------------------------------------------------------------------- |
| `color.primary.default`     | Core brand identity      | Active links, primary call-to-actions, brand text highlights.                      |
| `color.primary.dim`         | Subtle brand tint        | 10% alpha background for hovered pills, badge backgrounds, active icon containers. |
| `color.secondary.default`   | Secondary accent         | Gradient pairings with primary, secondary entry point tags.                        |
| `color.accent.default`      | Highlight & telemetry    | Metric callouts, benchmark bars, status accents.                                   |
| `color.background.main`     | Canvas root              | Page root background (`#09090b`), main layout base.                                |
| `color.background.surface`  | Card / Panel surface     | Cards, tables, sidebars, modal containers (`#18181b`).                             |
| `color.background.elevated` | Dropdowns & Floating     | Flyout menus, search modals, tooltips (`#1e1e2e`).                                 |
| `color.border.default`      | Structural dividers      | Card borders, table headers (15% white mix).                                       |
| `color.border.subtle`       | Micro-separators         | Nested item dividers, badge borders (8% white mix).                                |
| `color.status.success`      | Positive state           | Online badges, pass states, verified checkmarks.                                   |
| `color.status.warning`      | Alert / degraded state   | Offline indicators, deprecation notices, ReDoS warnings.                           |
| `color.status.error`        | Failure / critical state | Error boundaries, validation rejections, failed benchmarks.                        |

---

## 3. Typography & Hierarchy

- **Primary Typeface**: `Inter`, system fallback stack.
- **Code & Monospace**: `ui-monospace`, `SFMono-Regular`, `Consolas`.

### Scale & Application

- **Display / Hero H1**: `text-5xl @3xl:text-[5rem] font-black leading-[1.1] tracking-tight`. Use sparingly on landing page hero.
- **Section Heading H2**: `text-2xl sm:text-3xl font-bold tracking-tight text-base-content`.
- **Card / Subsection Heading H3**: `text-lg sm:text-xl font-bold text-base-content`.
- **Body Text**: `text-base text-base-content/80 font-normal leading-relaxed`.
- **Secondary / Meta Caption**: `text-xs sm:text-sm text-base-content/60 font-medium`.
- **Kbd / Micro Badges**: `text-[10px] sm:text-[11px] font-black uppercase tracking-widest font-mono`.

---

## 4. Surfaces, Depth & Glassmorphism

- **Translucent Headers & Bars**:
  ```css
  background: color-mix(in oklch, var(--c-bg-main), transparent 15%);
  backdrop-filter: blur(20px) saturate(1.4);
  border-block-end: 1px solid var(--c-border-subtle);
  ```
- **Ambient Glow Effects**:
  - Primary Glow: Radial gradient with `var(--color-primary)` at 15% opacity blurred at 120px.
  - Secondary Glow: Radial gradient with `var(--color-secondary)` at 10% opacity blurred at 140px.
- **Cards**:
  - Border: `1px solid var(--color-border-subtle)`.
  - Hover Transition: `transition: transform 200ms ease, border-color 200ms ease`.
  - Hover State: Border increases to `var(--color-border)` or `var(--color-primary-dim)`, with subtle elevation shadow.

---

## 5. Component Patterns & Rules

### Buttons

- **Primary Button**: Filled with `var(--color-primary)`, text white/dark depending on contrast, bold tracking-tight, rounded-xl.
- **Outline / Ghost Button**: Border with `var(--color-border-subtle)`, transparent background, hover bg `white/5`.
- **Icon-Only Button**: Always include `aria-label="Action description"`. The internal icon must have `aria-hidden="true"`.

### Code Blocks

- Use `app-code-block` component.
- Always display language badge and copy action.
- Copy button must delegate to `injectClipboard()` from `@angular-helpers/browser-web-apis` to ensure SSR safety and reactive feedback (`Copied!`).

### Error Boundaries & Resilience

- When rendering risky or external widgets (e.g. OpenLayers map canvas, Web Workers, browser sensors), wrap with Angular's native `@boundary`:
  ```html
  @boundary {
  <app-interactive-demo />
  } @error (let err) {
  <div class="card p-6 bg-error/10 border border-error/20">
    <span class="text-error font-bold">Failed to load demo: {{ err.message }}</span>
  </div>
  }
  ```

---

## 6. Do's and Don'ts for AI Agents

### DO

- ✅ Use Tailwind utility classes matching the tokens defined in `styles.css`.
- ✅ Use Angular signals (`signal()`, `computed()`, `linkedSignal()`) and inject functions (`inject()`) for local state.
- ✅ Use native control flow (`@if`, `@for`, `@switch`, `@defer`, `@boundary`).
- ✅ Optimize bundle size by lazy-loading non-critical sections and components with `@defer`.
- ✅ Verify all color pairings with Axe Core checks to ensure 100% WCAG AA compliance.

### DON'T

- ❌ Do NOT use hardcoded hex values outside of the token definitions.
- ❌ Do NOT introduce external UI frameworks (e.g. Material Components, PrimeNG, Bootstrap) into `apps/web`.
- ❌ Do NOT use deprecated Angular decorators like `@HostBinding`, `@HostListener`, or `standalone: true` (default in v20+).
- ❌ Do NOT use `ngClass` or `ngStyle`; use native `[class]` and `[style]` bindings.
- ❌ Do NOT omit accessible names on buttons, comboboxes, or modal dialogs.
