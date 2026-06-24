## Exploration: Create a floating performance panel in the documentation layout displaying real-time LCP, CLS, and INP metrics using injectPerformanceObserver from @angular-helpers/browser-web-apis

### Current State

The documentation layout is managed by [DocsLayoutComponent](file:///home/gasparrv92/Repositorios/angular-helpers/src/app/docs/layout/docs-layout.component.ts), which provides the core navigation frame, version selectors, bookmark/reading history widgets, and a main content slot displaying the documentation pages.
Currently, there is no real-time performance tracking or performance metrics displayed in the user interface.

The library offers a utility function `injectPerformanceObserver` defined at [inject-performance-observer.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/fns/inject-performance-observer.ts) which wraps browser `PerformanceObserver` observations inside Angular signals.

### Affected Areas

- [DocsLayoutComponent](file:///home/gasparrv92/Repositorios/angular-helpers/src/app/docs/layout/docs-layout.component.ts) — The root layout template needs to import and render the performance panel.
- [docs-layout.component.spec.ts](file:///home/gasparrv92/Repositorios/angular-helpers/src/app/docs/layout/docs-layout.component.spec.ts) — Unit tests need to handle the rendering and potential mocking of the panel.
- [vitals-panel.component.ts](file:///home/gasparrv92/Repositorios/angular-helpers/src/app/docs/layout/vitals-panel.component.ts) _(New File)_ — A dedicated standalone component for the floating performance panel logic, calculation, and UI.

### Approaches

1. **Dedicated Standalone Component (VitalsPanelComponent)**
   Create a dedicated component under the docs layout directory. It will call `injectPerformanceObserver` for each metric and encapsulate layout, styling, and status calculations.
   - **Pros**:
     - Clean separation of concerns (SRP).
     - Keeps [DocsLayoutComponent](file:///home/gasparrv92/Repositorios/angular-helpers/src/app/docs/layout/docs-layout.component.ts) lightweight and readable.
     - Easy to isolate, unit test, or mock out in other layouts.
     - Fully encapsulates its styling (e.g. glassmorphism) and accessibility attributes.
   - **Cons**:
     - Requires creating a new source file.
   - **Effort**: Medium

2. **Inline Logic inside DocsLayoutComponent**
   Declare all performance observers, calculations, and UI elements directly in [DocsLayoutComponent](file:///home/gasparrv92/Repositorios/angular-helpers/src/app/docs/layout/docs-layout.component.ts).
   - **Pros**:
     - No additional files required.
   - **Cons**:
     - Bloats the main layout shell component with unrelated performance tracking code.
     - Increases unit testing complexity for the layout shell itself.
     - Violates SRP.
   - **Effort**: Low

### Recommendation

We recommend **Approach 1 (Dedicated Standalone Component)**. By isolating the performance observation logic and UI into `VitalsPanelComponent`, we maintain a clean and modular architecture. The panel will float in the bottom-right corner of the layout, checking browser support dynamically, and rendering a premium glassmorphic dashboard of core web vitals.

#### Implementation Details & Vitals Calculations:

- **LCP (Largest Contentful Paint)**:
  Use `injectPerformanceObserver({ type: 'largest-contentful-paint', buffered: true })`.
  LCP value corresponds to the `startTime` of the latest entry.
- **CLS (Cumulative Layout Shift)**:
  Use `injectPerformanceObserver({ type: 'layout-shift', buffered: true })`.
  Calculate standard session window CLS: Layout shifts with less than 1s gap and a maximum session duration of 5s. Exclude shifts where `hadRecentInput` is true.
- **INP (Interaction to Next Paint)**:
  Use `injectPerformanceObserver({ type: 'event', buffered: true })`.
  Find the maximum duration of interaction event entries (`interactionId > 0`).

#### Premium Styling (using styles.css tokens):

- Glassmorphic card styling: `bg-base-200/50 backdrop-blur-md border border-border-subtle shadow-xl`.
- Glowing indicator dots: Using status colors like `--color-success` (Green), `--color-warning` (Yellow/Orange), and `--color-error` (Red).
- Accessible transitions and animations: Hover states, keyframes like `fade-in-up`, and expandable dashboard panel with aria-expanded attributes.

### Risks

- **Browser Support**: Certain browsers (like Safari and Firefox) do not support all performance entry types (e.g., Safari lacks full support for `'layout-shift'` or `'event'` timing observers). The code must gracefully detect support using `PerformanceObserver.supportedEntryTypes` and display `N/A` for unsupported metrics rather than crashing or showing inaccurate zeroes.
- **Test Environment Mocking**: Unit tests in Vitest run with jsdom where `PerformanceObserver` is undefined. The implementation must handle this gracefully, and tests should mock or stub the component or browser APIs.

### Ready for Proposal

Yes. The requirements and architecture are clear. The next recommended step is `/sdd-propose`.
