## Exploration: Premium UX Animations and Loading States for Search Modal and Vitals Panel

### Current State

1. **Search Service & Search Modal**:
   The `SearchService` ([search.service.ts](file:///home/gasparrv92/Repositorios/angular-helpers/src/app/core/services/search.service.ts)) manages the `query` signal and triggers web worker executions through an RxJS observable pipeline to produce the `results` signal. It currently lacks a tracking loading state indicating when active search queries are executing.
   The `SearchModalComponent` ([search-modal.component.ts](file:///home/gasparrv92/Repositorios/angular-helpers/src/app/shared/components/search-modal/search-modal.component.ts)) displays the search input and results list, but lacks any visual indicator showing when a background web worker query is running.

2. **Vitals Panel**:
   The `VitalsPanelComponent` ([vitals-panel.component.ts](file:///home/gasparrv92/Repositorios/angular-helpers/src/app/docs/layout/vitals-panel.component.ts)) displays real-time Core Web Vitals (LCP, CLS, INP). It toggles its metrics content using a standard Angular `@if (expanded())` block. When expanded changes state, the panel immediately appears or disappears from the DOM without any smooth motion or transition.

### Affected Areas

- [search.service.ts](file:///home/gasparrv92/Repositorios/angular-helpers/src/app/core/services/search.service.ts) — Add class property `readonly searching = signal(false);` and manage its state within the `results` observable pipeline during worker execution and lifecycle.
- [search-modal.component.ts](file:///home/gasparrv92/Repositorios/angular-helpers/src/app/shared/components/search-modal/search-modal.component.ts) — Render an infinitely-shifting glowing progress bar container at the bottom of the input wrapper when `search.searching()` is true, using custom CSS animations.
- [vitals-panel.component.ts](file:///home/gasparrv92/Repositorios/angular-helpers/src/app/docs/layout/vitals-panel.component.ts) — Replace the `@if (expanded())` logic with a class binding `[class.expanded]="expanded()"` on `.vitals-content` and introduce smooth CSS transitions for opacity, transform (slide-up), and visibility (ensuring keyboard/screen reader accessibility).

### Approaches

#### 1. Search Service `searching` State

- **Approach 1A: Reactive side-effects using nested switchMap + tap + finalize (Recommended)**
  - Inject side-effects into the `results` observable pipeline. Before calling `pool.execute`, set `searching.set(true)`. Use `finalize()` on the execution observable to set `searching.set(false)`. Use a nested `switchMap` projection to ensure proper subscription/unsubscription sequence.
  - **Pros**:
    - Automatically handles race conditions and cancellations when the query changes quickly.
    - Synchronous clean-up ensures `searching` status represents the true lifecycle of the worker request.
  - **Cons**:
    - Slightly higher complexity in understanding the RxJS subscription order under `switchMap`.
  - **Effort**: Low
- **Approach 1B: Manual state management inside component change events**
  - Manually toggle the signal during `ngModelChange` or inside helper methods.
  - **Pros**: Simple conceptual flow.
  - **Cons**: Does not map to actual asynchronous worker execution. If the worker hangs or resolves out of order, the loading state will become desynchronized.
  - **Effort**: Medium

#### 2. Vitals Panel Transition

- **Approach 2A: CSS Transitions with persistent DOM and Class Binding (Recommended)**
  - Always render the panel container in the DOM, toggle the `.expanded` class with `[class.expanded]="expanded()"`, and use CSS transitions on `opacity`, `transform` (slide-up), and `visibility`.
  - **Pros**:
    - Clean animations for both expansion and collapse.
    - Highly performant, styling remains encapsulated within the component.
    - Retains semantic HTML structure and accessibility features (`visibility: hidden` prevents focus trapping).
  - **Cons**:
    - DOM element is persistent, though extremely lightweight.
  - **Effort**: Low
- **Approach 2B: Angular Animations (`@angular/animations`)**
  - Define a custom slide-up trigger in the component decorator and apply it to the `@if (expanded())` block.
  - **Pros**: Standard Angular way for conditional DOM elements.
  - **Cons**:
    - Adds bundle size, depends on external browser animation configurations.
    - Angular 22/new versions deprecate the legacy animation system in favor of newer lightweight helpers, introducing potential tech debt.
  - **Effort**: Medium

### Recommendation

We recommend **Approach 1A (Reactive RxJS pipeline side-effects)** for the search modal and **Approach 2A (CSS Transitions with class binding)** for the vitals panel.

1. **Search Modal Implementation Details**:
   - In `SearchService`, refine the `results` pipeline:
     ```typescript
     readonly results = toSignal(
       toObservable(this.query).pipe(
         switchMap((q) => {
           const query = q.toLowerCase().trim();
           if (!query) {
             return of([]);
           }
           return of(null).pipe(
             tap(() => this.searching.set(true)),
             switchMap(() =>
               from(this.pool.execute<SearchResult[]>('search', { q })).pipe(
                 catchError((error) => {
                   console.error('Search worker error:', error);
                   return of([]);
                 }),
                 finalize(() => {
                   this.searching.set(false);
                 })
               )
             )
           );
         }),
       ),
       { initialValue: [] },
     );
     ```
   - In `SearchModalComponent`, add the shifting bar styled with standard theme variables (`var(--c-primary)`, `var(--c-accent)`, `var(--c-secondary)`):
     ```css
     .search-progress-bar {
       width: 100%;
       height: 100%;
       background: linear-gradient(
         90deg,
         transparent 0%,
         var(--c-primary) 25%,
         var(--c-accent) 50%,
         var(--c-secondary) 75%,
         transparent 100%
       );
       background-size: 200% 100%;
       animation: search-glow 1.5s infinite linear;
       box-shadow: 0 0 8px var(--c-primary);
     }
     ```

2. **Vitals Panel Implementation Details**:
   - In `VitalsPanelComponent`, replace the `@if` block to keep the element in DOM and bind `[class.expanded]`.
   - Update styles to include transition definitions:
     ```css
     .vitals-content {
       /* existing layout properties... */
       opacity: 0;
       transform: translateY(12px) scale(0.95);
       pointer-events: none;
       visibility: hidden;
       transition:
         opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1),
         transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
         visibility 0.25s;
     }
     .vitals-content.expanded {
       opacity: 1;
       transform: translateY(0) scale(1);
       pointer-events: auto;
       visibility: visible;
     }
     ```

### Risks

- **Unit Test Coverage**: The `vitals-panel.component.spec.ts` mocks the `injectPerformanceObserver` and simulates clicks to assert elements. The transition to a class-based approach is fully backward-compatible since the DOM selectors (`#vitals-panel-content` / `.vitals-content`) and metrics are still rendered inside the template. No tests are expected to break.
- **Worker Failure / Infinite Loading**: If the Web Worker takes too long or fails, `finalize` must always run to set `searching` back to false. The proposed RxJS pipeline ensures that both `catchError` and unsubscription will trigger the `finalize` operator block.

### Ready for Proposal

Yes. The exploration is complete. The affected components, styles, and architectures are well understood. We are ready to proceed to `/sdd-propose`.
